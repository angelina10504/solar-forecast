"""
Solar generation forecast inference.
Loads the LightGBM model from S3 and produces hourly forecasts.

Usage (local test):
    python predict.py
"""
import boto3
import joblib
import json
import numpy as np
import pandas as pd
import pvlib
import requests
from io import BytesIO

# ---- Config ----
BUCKET = "solar-forecast-angelina-2026"
ARTIFACT_KEY = "bhadla/models/lightgbm_forecast_v1.joblib"
OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

# ---- Lazy-loaded globals (loaded once, reused across invocations) ----
_artifacts = None


def load_artifacts():
    """Load model + metadata from S3. Cached after first call."""
    global _artifacts
    if _artifacts is None:
        s3 = boto3.client("s3")
        obj = s3.get_object(Bucket=BUCKET, Key=ARTIFACT_KEY)
        _artifacts = joblib.load(BytesIO(obj["Body"].read()))
        print(f"Loaded model: {len(_artifacts['features'])} features, capacity {_artifacts['system_capacity_mw']} MW")
    return _artifacts


def fetch_weather_forecast(lat: float, lon: float, hours: int = 24) -> pd.DataFrame:
    """Get weather forecast from Open-Meteo for the next N hours."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "shortwave_radiation,direct_radiation,diffuse_radiation,"
                  "temperature_2m,cloud_cover,wind_speed_10m,"
                  "relative_humidity_2m,surface_pressure",
        "forecast_days": max(2, (hours // 24) + 1),
        "timezone": "Asia/Kolkata",
    }
    response = requests.get(OPEN_METEO_FORECAST_URL, params=params, timeout=30)
    response.raise_for_status()
    data = response.json()
    df = pd.DataFrame(data["hourly"])
    df["time"] = pd.to_datetime(df["time"])
    df = df.head(hours).reset_index(drop=True)
    return df


def build_features(weather: pd.DataFrame, artifacts: dict) -> pd.DataFrame:
    """
    Build the same 30 features the model was trained on.
    For lag features (which need historical data), we use defaults of 0 since
    a real-time forecast doesn't have access to past plant generation.
    This is a simplification — in production, you'd query recent plant data from a DB.
    """
    df = weather.copy().sort_values("time").reset_index(drop=True)
    loc = artifacts["location"]

    # Calendar features
    df["hour"] = df["time"].dt.hour
    df["day_of_year"] = df["time"].dt.dayofyear
    df["month_num"] = df["time"].dt.month
    df["day_of_week"] = df["time"].dt.dayofweek

    # Cyclical encoding
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
    df["doy_sin"]  = np.sin(2 * np.pi * df["day_of_year"] / 365)
    df["doy_cos"]  = np.cos(2 * np.pi * df["day_of_year"] / 365)

    # Lag features — set to 0 in forecast mode (no historical plant data available)
    for lag in [1, 24, 48, 168]:
        df[f"gen_lag_{lag}h"] = 0.0
    for col in ["shortwave_radiation", "cloud_cover", "temperature_2m"]:
        for lag in [24, 168]:
            df[f"{col}_lag_{lag}h"] = 0.0

    # Rolling means — also 0 in forecast mode
    df["gen_rolling_24h"] = 0.0
    df["gen_rolling_168h"] = 0.0

    # Solar geometry (deterministic from time + location)
    times = pd.to_datetime(df["time"]).dt.tz_localize("Asia/Kolkata")
    solpos = pvlib.solarposition.get_solarposition(
        times, loc["lat"], loc["lon"], altitude=loc["altitude"]
    )
    df["solar_zenith"] = solpos["zenith"].values
    df["solar_elevation"] = solpos["elevation"].values

    return df


def predict(lat: float = 27.5, lon: float = 71.9, hours: int = 24) -> dict:
    """Main forecast function: fetch weather, build features, predict."""
    artifacts = load_artifacts()

    # 1. Get weather forecast for the next N hours
    weather = fetch_weather_forecast(lat, lon, hours)

    # 2. Build features
    features_df = build_features(weather, artifacts)

    # 3. Run point + quantile predictions
    feature_cols = artifacts["features"]
    X = features_df[feature_cols]

    cap_mw = artifacts["system_capacity_mw"]

    point_model = artifacts["point_model"]
    quantile_models = artifacts["quantile_models"]

    p_point = np.clip(point_model.predict(X), 0, cap_mw)
    p10 = np.clip(quantile_models[0.1].predict(X), 0, cap_mw)
    p50 = np.clip(quantile_models[0.5].predict(X), 0, cap_mw)
    p90 = np.clip(quantile_models[0.9].predict(X), 0, cap_mw)

    # Enforce quantile ordering
    stacked = np.vstack([p10, p50, p90])
    p10, p50, p90 = np.sort(stacked, axis=0)

    # 4. Build response
    return {
        "location": {"lat": lat, "lon": lon},
        "capacity_mw": cap_mw,
        "hours_ahead": hours,
        "forecasts": [
            {
                "time": str(features_df["time"].iloc[i]),
                "point_mw":  float(p_point[i]),
                "p10_mw":    float(p10[i]),
                "p50_mw":    float(p50[i]),
                "p90_mw":    float(p90[i]),
            }
            for i in range(len(features_df))
        ],
    }


def lambda_handler(event, context):
    """
    AWS Lambda entry point. Invoked by API Gateway for GET /forecast.

    Query string params (event["queryStringParameters"]):
        lat   (optional, default 27.5)
        lon   (optional, default 71.9)
        hours (optional, default 24, max 48)
    """
    try:
        # API Gateway HTTP API passes params under queryStringParameters
        params = (event or {}).get("queryStringParameters") or {}
        lat   = float(params.get("lat", 27.5))
        lon   = float(params.get("lon", 71.9))
        hours = min(int(params.get("hours", 24)), 48)  # cap to 48h

        result = predict(lat=lat, lon=lon, hours=hours)

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",   # CORS for browser access
            },
            "body": json.dumps(result),
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({"error": str(e), "type": type(e).__name__}),
        }


if __name__ == "__main__":
    # Local test — simulate an API Gateway event
    fake_event = {
        "queryStringParameters": {
            "lat": "27.5",
            "lon": "71.9",
            "hours": "24",
        }
    }
    response = lambda_handler(fake_event, None)
    print(f"Status: {response['statusCode']}")
    body = json.loads(response["body"])
    if response["statusCode"] == 200:
        print(json.dumps({
            "location": body["location"],
            "capacity_mw": body["capacity_mw"],
            "first_3_hours": body["forecasts"][:3],
            "peak_hour": max(body["forecasts"], key=lambda x: x["point_mw"]),
        }, indent=2))
    else:
        print(body)