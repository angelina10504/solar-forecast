"""
Download hourly historical weather + solar data for Bhadla Solar Park.
Source: Open-Meteo Historical Archive API (free, no key, ERA5 reanalysis).
"""
import requests
import pandas as pd
from pathlib import Path

# Bhadla Solar Park, Rajasthan
LAT = 27.5
LON = 71.9
LOCATION_NAME = "bhadla"

YEARS = [2023, 2024]

# Variables we need for solar generation modeling
HOURLY_VARS = [
    "shortwave_radiation",      # equivalent to GHI (W/m²)
    "direct_radiation",         # equivalent to DNI
    "diffuse_radiation",        # equivalent to DHI
    "temperature_2m",           # air temperature (°C)
    "cloud_cover",              # total cloud cover (%)
    "wind_speed_10m",           # wind at 10m (km/h)
    "relative_humidity_2m",     # %
    "surface_pressure",         # hPa
]

OUTPUT_DIR = Path("data/raw")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

ENDPOINT = "https://archive-api.open-meteo.com/v1/archive"


def download_year(year: int) -> Path:
    params = {
        "latitude": LAT,
        "longitude": LON,
        "start_date": f"{year}-01-01",
        "end_date": f"{year}-12-31",
        "hourly": ",".join(HOURLY_VARS),
        "timezone": "Asia/Kolkata",  # IST, no DST in India
    }

    print(f"Requesting {year} for {LOCATION_NAME}...")
    response = requests.get(ENDPOINT, params=params, timeout=120)

    if response.status_code != 200:
        print(f"  ERROR {response.status_code}: {response.text[:500]}")
        response.raise_for_status()

    data = response.json()
    df = pd.DataFrame(data["hourly"])
    df["time"] = pd.to_datetime(df["time"])

    output_path = OUTPUT_DIR / f"{LOCATION_NAME}_{year}.csv"
    df.to_csv(output_path, index=False)
    size_kb = output_path.stat().st_size / 1024
    print(f"  Saved {output_path} ({size_kb:.1f} KB, {len(df)} rows)")
    return output_path


def main():
    for year in YEARS:
        download_year(year)

    print("\nDone. Files in data/raw/:")
    for f in sorted(OUTPUT_DIR.glob("*.csv")):
        print(f"  - {f.name}")


if __name__ == "__main__":
    main()