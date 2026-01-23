# TecRail Worker Deployment

## Overview

This repository hosts the Cloudflare Worker that powers the TecRail backend. The worker depends on a D1 database schema (see `db/schema.sql`), several secrets (`JWT_SECRET`, `CORS_ORIGIN`), and the CLI configuration in `wrangler.toml`.

Use the scripts in `scripts/` to keep the deployment workflow consistent between terminals.

## Development vs production databases

- Local development uses a mirrored D1 (run `wrangler d1 execute app_db_prd --local --file=db/schema.sql` or simply start `wrangler dev`).
- Production uses the remote `app_db_prd` defined in `wrangler.toml`. Before every publish we reset/apply the schema on that database so it always matches `db/schema.sql`. The helper script already runs:
  ```sh
  npx wrangler d1 execute app_db_prd --remote --file=db/schema.sql
  ```
  before compiling and deploying the worker, so you don't need to manually drop tables.

## Schema notes on `company_id`

Every writable table exposed by the API includes the `company_id` column to scope rows to a tenant. A few supporting tables (`tb_company`, `tb_user_auth`, `tb_profile_permission`) lack that column intentionally:

- `tb_company` is the root entity: it is the source of truth for a company record, so it does not reference itself.
- `tb_user_auth` stores only authentication details and already links back to `tb_user` via `user_id`, which carries the company association.
- `tb_profile_permission` is keyed by `profile_id` and references `tb_profile`, therefore the company context flows through that relation.

The rest of the schema (users, ativos, ordens de serviço, etc.) all declare `company_id` and enforce it through `FOREIGN KEY` constraints as defined in `db/schema.sql`.

## Deployment script (PowerShell)

Run the PowerShell helper from the repository root to execute the required steps in order:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-worker.ps1
```

The script applies the remote schema (`wrangler d1 execute`), builds the worker bundle (`wrangler build`), and publishes the worker to the `works-to-backend.workstecnologiaoperacional.workers.dev` route (`wrangler deploy`). This is the flow validated in this session.

## Pre-deploy checklist

- ✅ Confirm your `.dev.vars` or environment provides `JWT_SECRET`, `CORS_ORIGIN`, and any other vars referenced in `src/index.ts`.
- ✅ Ensure the target worker name and D1 binding in `wrangler.toml` match the Cloudflare resources you intend to publish.
- ✅ Run the PowerShell or Bash script (`scripts/deploy-worker.*`), which executes the remote schema refresh, build and deploy in one shot.
- ✅ After deploy, hit `curl https://works-to-backend.workstecnologiaoperacional.workers.dev/health` to verify the worker + D1 respond `{"status":"ok","service":"tecrail-worker"}`.

## Deployment script (Unix/Bash)

On systems with Bash you can run:

```sh
./scripts/deploy-worker.sh
```

This script mirrors the PowerShell version but is suitable for POSIX shells. Both scripts rely on the `wrangler` CLI being authenticated with the Cloudflare account defined in `wrangler.toml`.

## Secrets & configuration

- Keep local development secrets in `.dev.vars` (e.g. `JWT_SECRET`, `CORS_ORIGIN=http://localhost:5173`).
- Ensure `wrangler.toml` `name` and `d1_databases` sections match the Cloudflare worker and D1 database you created (`works-to-backend`, `app_db_prd`, etc.).
- Set the same secrets in the Cloudflare dashboard under **Workers > Variables & secrets** before running `wrangler deploy`.

## Verification

After the deploy completes, confirm the worker is reachable:

```sh
curl https://works-to-backend.workstecnologiaoperacional.workers.dev/health
```

The expected response is `{"status":"ok","service":"tecrail-worker"}`.

## Manual steps preserved from this session

- Applied `db/schema.sql` to the remote `app_db_prd` D1 instance.
- Built the worker bundle with `npx wrangler build`.
- Published `works-to-backend` describing the appropriate route.

## Backend status

- The TecRail backend worker is hosted at `https://works-to-backend.workstecnologiaoperacional.workers.dev` and already serves the `/health`, `/auth`, `/ativos`, and other routes documented by the worker itself.
- You can verify the deployment at any time with:

  ```sh
  curl https://works-to-backend.workstecnologiaoperacional.workers.dev/health
  ```

  `{"status":"ok","service":"tecrail-worker"}` is the expected response when the worker and D1 database are healthy.

## Automate deployments with GitHub Actions

Add a repository secret `CF_API_TOKEN` scoped to the Cloudflare account + worker (needs `Workers Scripts` and `D1` permissions). Then include this workflow:

```yaml
name: Deploy TecRail Worker

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      CF_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: chmod +x scripts/deploy-worker.sh
      - run: ./scripts/deploy-worker.sh
```

The workflow runs the Unix helper (apply schema, build, deploy) just like the manual PowerShell script. Keep the `wrangler.toml` bindings and `scripts/` helpers in sync with the Cloudflare setup and rotate the `CF_API_TOKEN` secret whenever needed.
