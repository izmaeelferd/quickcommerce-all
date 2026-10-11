#!/bin/sh
# QuickCart MinIO bootstrap (blueprint). Idempotent: safe to run on every `docker compose up`.
# Creates the bucket, enables versioning, and creates a bucket-scoped access key for the application
# so the api/worker never hold the MinIO root credentials.
set -eu

ROOT_USER="$(cat /run/secrets/minio_root_user)"
ROOT_PASSWORD="$(cat /run/secrets/minio_root_password)"
APP_KEY="$(cat /run/secrets/s3_access_key_id)"
APP_SECRET="$(cat /run/secrets/s3_secret_access_key)"
BUCKET="${S3_BUCKET:?S3_BUCKET is required}"

mc alias set local http://minio:9000 "$ROOT_USER" "$ROOT_PASSWORD" >/dev/null

mc mb --ignore-existing "local/$BUCKET"
mc version enable "local/$BUCKET"

# Expire non-current object versions after 30 days (deleted product images stay recoverable for 30 days).
mc ilm rule ls "local/$BUCKET" 2>/dev/null | grep -q "NoncurrentVersionExpiration" ||
  mc ilm rule add --noncurrent-expire-days 30 "local/$BUCKET"

POLICY_FILE=/tmp/quickcart-app-policy.json
cat >"$POLICY_FILE" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:AbortMultipartUpload"],
      "Resource": ["arn:aws:s3:::${BUCKET}/*"]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket", "s3:GetBucketLocation"],
      "Resource": ["arn:aws:s3:::${BUCKET}"]
    }
  ]
}
EOF

mc admin policy create local quickcart-app "$POLICY_FILE" 2>/dev/null || true
if ! mc admin user info local "$APP_KEY" >/dev/null 2>&1; then
  mc admin user add local "$APP_KEY" "$APP_SECRET"
fi
mc admin policy attach local quickcart-app --user "$APP_KEY" 2>/dev/null || true

echo "minio-init: bucket ${BUCKET} ready (versioning on, app policy attached)"
