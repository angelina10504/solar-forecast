from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.getenv("NSRDB_API_KEY")
email = os.getenv("NSRDB_EMAIL")
bucket = os.getenv("S3_BUCKET")

print(f"API key loaded: {'yes' if api_key else 'NO'} ({len(api_key) if api_key else 0} chars)")
print(f"Email loaded:   {email}")
print(f"S3 bucket:      {bucket}")