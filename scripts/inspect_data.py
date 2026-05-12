"""Quick sanity check on the downloaded weather data."""
import pandas as pd
from pathlib import Path

for year in [2023, 2024]:
    path = Path(f"data/raw/bhadla_{year}.csv")
    df = pd.read_csv(path, parse_dates=["time"])

    print(f"\n=== {year} ===")
    print(f"Rows: {len(df)}")
    print(f"Date range: {df['time'].min()} to {df['time'].max()}")
    print(f"Columns: {list(df.columns)}")
    print(f"Missing values per column:")
    print(df.isnull().sum())
    print(f"\nFirst 3 rows:")
    print(df.head(3))
    print(f"\nSummary stats for solar radiation:")
    print(df[["shortwave_radiation", "direct_radiation", "diffuse_radiation"]].describe())