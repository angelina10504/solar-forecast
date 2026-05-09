import pandas as pd
from datetime import datetime, timedelta
import os

os.makedirs("data", exist_ok=True)

start = datetime(2024, 1, 1)
rows = []
for i in range(72):  # 3 days, hourly = 72 rows
    rows.append({
        "timestamp": (start + timedelta(hours=i)).isoformat(),
        "ghi_wm2": 200 + (i % 24) * 30,    # fake solar irradiance
        "temp_c": 25 + (i % 24) * 0.5,     # fake temperature
        "cloud_pct": (i * 7) % 100         # fake cloud cover
    })

df = pd.DataFrame(rows)
df.to_csv("data/test_weather.csv", index=False)
print(f"Wrote {len(df)} rows to data/test_weather.csv")
print(df.head())