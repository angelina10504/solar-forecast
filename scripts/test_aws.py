import boto3

# This uses the same credentials configured via 'aws configure'
sts = boto3.client("sts")
identity = sts.get_caller_identity()

print("Connected to AWS as:")
print(f"  User ARN: {identity['Arn']}")
print(f"  Account:  {identity['Account']}")

# List S3 buckets (should be empty for now)
s3 = boto3.client("s3")
buckets = s3.list_buckets()
print(f"\nS3 buckets in this account: {len(buckets['Buckets'])}")
for b in buckets["Buckets"]:
    print(f"  - {b['Name']}")