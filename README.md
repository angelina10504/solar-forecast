# Solar Generation Forecasting — Bhadla, India

End-to-end machine learning pipeline forecasting hourly MW generation at India's Bhadla Solar Park (Rajasthan, 2,245 MW). Translates forecast errors into ₹ DSM penalty exposure using India's CERC Deviation Settlement Mechanism — demonstrating ~₹3.43 crore annualized penalty savings versus a persistence baseline.

## Live API

**Endpoint:** https://s17e3cx382.execute-api.ap-south-1.amazonaws.com/forecast

curl "https://s17e3cx382.execute-api.ap-south-1.amazonaws.com/forecast?hours=24"

See [`deployment/README.md`](deployment/README.md) for full API documentation.

## Headline results

| Metric | Persistence baseline | LightGBM | Improvement |
|---|---|---|---|
| Test MAE (December 2024) | 13.77 MW | 9.53 MW | 31% |
| Test nMAE | 0.61% | 0.42% | — |
| Val MAE (Oct-Nov 2024) | 23.27 MW | 11.40 MW | 51% |
| **92-day DSM penalty exposure** | **₹92.1 lakh** | **₹6.5 lakh** | **93%** |
| **Annualized DSM savings (extrapolated)** | — | — | **~₹3.43 crore** |

Industry benchmark for day-ahead utility-scale solar forecasting: 4-8% nMAE. This model achieves 0.42% on synthetic data; real-world performance would be lower due to plant-level SCADA noise not present in synthetic generation.

## Stack

| Layer | Technology |
|---|---|
| Storage | AWS S3 (Hive-partitioned Parquet) |
| Querying | AWS Glue Data Catalog + Athena |
| ML training | SageMaker Studio + LightGBM |
| Experiment tracking | MLflow |
| Physics modeling | pvlib (PVWatts + SAPM cell temp) |
| Serving | AWS Lambda (container) + API Gateway |
| Container registry | AWS ECR |
| Monitoring | CloudWatch logs + metrics |
| Region | ap-south-1 (Mumbai) |

## Architecture
Open-Meteo weather (ERA5 reanalysis)
↓
S3 raw → Glue → Athena (partitioned by year/month)
↓
SageMaker Studio EDA + Modeling
├─ pvlib generates synthetic MW from weather
├─ Add stochastic noise (digital twin)
├─ LightGBM (point + P10/P50/P90 quantile models)
└─ MLflow tracks all experiments
↓
S3 model artifacts
↓
Docker container → ECR → Lambda → API Gateway
↓
Public HTTPS endpoint

## Project structure
solar-forecast/
├── scripts/          # Data ingestion + preprocessing
├── notebooks/        # EDA + modeling notebooks
├── deployment/       # Production Lambda + API
│   ├── lambda/       # Handler code + Dockerfile
│   └── README.md     # API documentation
├── README.md         # This file
└── requirements.txt  # Local development deps

## Weeks 1-4 status: complete

- **Week 1:** S3 + Glue + Athena pipeline scaffold
- **Week 2:** 2 years hourly Bhadla data ingested, partitioned, queryable
- **Week 3:** LightGBM models trained, DSM economics quantified, model artifacts in S3
- **Week 4:** Production deployment (Lambda + API Gateway, public endpoint)

## Next

- **Week 5:** Next.js dashboard with map, forecast curves, DSM ₹ panel, what-if sliders
- **Week 6:** Demo video, architecture diagram, polish
- **Future:** MLOps retrofit (DVC + GitHub Actions + drift monitoring)

