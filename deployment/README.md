# Deployment — Solar Forecast API

Production-grade serverless ML API that exposes the trained LightGBM solar forecasting model over HTTPS. Deployed on AWS in the Mumbai region (ap-south-1).

## Live endpoint
https://s17e3cx382.execute-api.ap-south-1.amazonaws.com/forecast

## Architecture
Browser / curl / Next.js dashboard
↓ HTTPS GET
API Gateway (HTTP API, regional)
↓ Lambda integration
AWS Lambda (Container image, 3 GB memory, 60s timeout)
├─ Pulls model artifact from S3 (cached after cold start)
├─ Fetches live weather from Open-Meteo API
├─ Runs LightGBM inference (point + P10/P50/P90 quantiles)
└─ Returns JSON
↓
CloudWatch (logs + invocation metrics)

**Container image** stored in ECR (`solar-forecast-lambda:v1`, 1.5 GB)
**Model artifact** stored in S3 (`s3://solar-forecast-angelina-2026/bhadla/models/lightgbm_forecast_v1.joblib`, 7 MB)

## Usage

### Query parameters

| Parameter | Required | Type | Default | Notes |
|---|---|---|---|---|
| `lat`   | No | float | 27.5 | Latitude (Bhadla default) |
| `lon`   | No | float | 71.9 | Longitude |
| `hours` | No | int   | 24   | Hours ahead to forecast, max 48 |

### Example: 24-hour forecast for Bhadla

curl "https://s17e3cx382.execute-api.ap-south-1.amazonaws.com/forecast?lat=27.5&lon=71.9&hours=24"

### Response shape

```json
{
  "location": { "lat": 27.5, "lon": 71.9 },
  "capacity_mw": 2245.0,
  "hours_ahead": 24,
  "forecasts": [
    {
      "time": "2026-05-18 12:00:00",
      "point_mw": 1646.67,
      "p10_mw": 926.16,
      "p50_mw": 1290.27,
      "p90_mw": 1569.15
    }
  ]
}
```

`point_mw` is the squared-error-optimized point forecast.
`p10_mw`, `p50_mw`, `p90_mw` are the 10th / 50th / 90th percentile predictions from independently trained quantile models (with isotonic post-processing to enforce monotonic ordering).

## Performance

| Metric | Value |
|---|---|
| Cold start latency | ~25-30 seconds |
| Warm invocation latency | 1-3 seconds |
| Memory ceiling | 3008 MB allocated, ~261 MB peak used |
| Region | Mumbai (ap-south-1) |
| Estimated cost (free tier) | ~₹0 for <1M requests/month |

Cold starts can be eliminated in production with **Provisioned Concurrency** (~$15/month per warm instance), at the cost of always-on billing. Not enabled for this demo.

## Local development

The same `predict.py` runs locally without Docker:
cd deployment/lambda
python predict.py

To test the Docker container locally before deploying:
docker run --platform linux/amd64 --rm -p 9000:8080 \
-e AWS_ACCESS_KEY_ID="$(aws configure get aws_access_key_id)" \
-e AWS_SECRET_ACCESS_KEY="$(aws configure get aws_secret_access_key)" \
-e AWS_DEFAULT_REGION="ap-south-1" \
solar-forecast-lambda:v1


In another terminal:
curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" \
-H "Content-Type: application/json" \
-d '{"queryStringParameters": {"lat":"27.5","lon":"71.9","hours":"24"}}'

## Build and redeploy workflow

1. Make code changes to predict.py
2. Rebuild container
docker build --platform linux/amd64 --provenance=false \
-t solar-forecast-lambda:v1 .
3. Tag and push to ECR
docker tag solar-forecast-lambda:v1 \
916963274421.dkr.ecr.ap-south-1.amazonaws.com/solar-forecast-lambda:v1
aws ecr get-login-password --region ap-south-1 | \
docker login --username AWS --password-stdin \
916963274421.dkr.ecr.ap-south-1.amazonaws.com
docker push 916963274421.dkr.ecr.ap-south-1.amazonaws.com/solar-forecast-lambda:v1
4. Update Lambda to use new image
aws lambda update-function-code \
--function-name solar-forecast \
--image-uri 916963274421.dkr.ecr.ap-south-1.amazonaws.com/solar-forecast-lambda:v1 \
--region ap-south-1

## Known limitations

- **Lag features set to 0 in production.** The model was trained with lagged generation and weather features, but the deployed API has no access to recent plant SCADA data. In a real Adani deployment, these would be fetched from a time-series database. For now, the model degrades gracefully because GHI dominates feature importance (~40× over any other feature).
- **No authentication.** Public endpoint, anyone can call. For production, would add API Gateway API keys or AWS IAM auth.
- **CORS is wide-open (`*`).** Acceptable for portfolio demo; would whitelist specific frontend domains in production.

## Files in this folder

- `lambda/predict.py` — Lambda handler with inference logic
- `lambda/Dockerfile` — Container image definition (Python 3.11 on Amazon Linux 2)
- `lambda/requirements.txt` — Python dependencies pinned for reproducibility
- `README.md` — this file