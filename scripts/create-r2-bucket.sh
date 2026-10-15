#!/usr/bin/env bash
# Create the voice-artifacts R2 bucket on Cloudflare
# Requires: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID env vars

set -e

ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:?Set CLOUDFLARE_ACCOUNT_ID in .env}"
API_TOKEN="${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN in .env}"
BUCKET_NAME="${R2_BUCKET_NAME:-voice-artifacts}"

echo "🪣 Creating R2 bucket: ${BUCKET_NAME}"

RESPONSE=$(curl -s -X POST \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"${BUCKET_NAME}\", \"locationHint\": \"enam\"}")

echo "${RESPONSE}" | python3 -m json.tool 2>/dev/null || echo "${RESPONSE}"

echo ""
echo "📋 Listing buckets:"
curl -s "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets" \
  -H "Authorization: Bearer ${API_TOKEN}" | python3 -m json.tool 2>/dev/null | head -30
