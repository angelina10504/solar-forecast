"""
Convert raw CSVs to partitioned Parquet files.
Output layout: data/processed/year=YYYY/month=MM/data.parquet
"""
from tokenize import group

from tokenize import group

import pandas as pd
from pathlib import Path

import pyarrow as pa
import pyarrow.parquet as pq

RAW_DIR = Path("data/raw")
PROCESSED_DIR = Path("data/processed")
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)


def process_file(csv_path: Path):
    print(f"Processing {csv_path.name}...")
    df = pd.read_csv(csv_path, parse_dates=["time"])

    # Add partition columns
    df["year"] = df["time"].dt.year
    df["month"] = df["time"].dt.month

    # Write one parquet file per (year, month)
    for (year, month), group in df.groupby(["year", "month"]):
        out_dir = PROCESSED_DIR / f"year={year}" / f"month={month:02d}"
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / "data.parquet"

        # Drop partition cols from file contents (they live in the path)
        import pyarrow as pa
        import pyarrow.parquet as pq

        clean = group.drop(columns=["year", "month"])
        # Convert pandas datetime to pyarrow timestamp with millisecond precision
        # (Athena's Parquet reader handles ms timestamps better than ns)
        table = pa.Table.from_pandas(clean, preserve_index=False)
        schema = table.schema
        ts_idx = schema.get_field_index("time")
        new_field = pa.field("time", pa.timestamp("ms"))
        schema = schema.set(ts_idx, new_field)
        table = table.cast(schema)
        pq.write_table(table, out_path, compression="snappy")
        print(f"  {out_path} ({len(group)} rows)")


def main():
    for csv in sorted(RAW_DIR.glob("bhadla_*.csv")):
        process_file(csv)

    # Summary
    files = list(PROCESSED_DIR.rglob("*.parquet"))
    total_size = sum(f.stat().st_size for f in files) / 1024
    print(f"\nTotal: {len(files)} parquet files, {total_size:.1f} KB")


if __name__ == "__main__":
    main()