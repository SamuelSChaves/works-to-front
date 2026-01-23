#!/usr/bin/env sh
set -euo pipefail

SCRIPT_NAME=$(basename "$0")

echo "$SCRIPT_NAME: Applying D1 schema to remote 'app_db_prd'"
npx wrangler d1 execute app_db_prd --remote --file=db/schema.sql

echo "$SCRIPT_NAME: Building worker bundle"
npx wrangler build

echo "$SCRIPT_NAME: Deploying worker"
npx wrangler deploy

echo "$SCRIPT_NAME: Deployment finished"
