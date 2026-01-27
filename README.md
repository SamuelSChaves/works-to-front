# TecRail Worker Deployment

## Overview

This repository hosts the Cloudflare Worker that powers the TecRail backend. The worker depends on a D1 database schema (see `db/schema.sql`), several secrets (`JWT_SECRET`, `CORS_ORIGIN`), and the CLI configuration in `wrangler.toml`.

Use the scripts in `scripts/` to keep the deployment workflow consistent between terminals. The PowerShell and Unix helpers now run `scripts/create-admin.sql` immediately after applying `db/schema.sql`, so the remote database always starts with the TecRail tenant, an admin user, and a few sample ações.

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

The script applies the remote schema (`wrangler d1 execute`), seeds the D1 database with `scripts/create-admin.sql`, builds the worker bundle (`wrangler build`), and publishes the worker to the `works-to-backend.workstecnologiaoperacional.workers.dev` route (`wrangler deploy`). This is the flow validated in this session.

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

This script mirrors the PowerShell version but is suitable for POSIX shells. Both helpers ghost the schema refresh, the admin seed (`scripts/create-admin.sql`), bundle build, and deploy in one flow and rely on the `wrangler` CLI being authenticated with the Cloudflare account defined in `wrangler.toml`.

## Secrets & configuration

- Keep local development secrets in `.dev.vars` (e.g. `JWT_SECRET=...`, `CORS_ORIGIN=http://localhost:5173` or whatever origin shards you need while debugging).
- Ensure `wrangler.toml` `name` and `d1_databases` sections match the Cloudflare worker and D1 database you created (`works-to-backend`, `app_db_prd`, etc.).
- Mirror the same secrets into the Cloudflare dashboard with `wrangler secret put`. A convenient set of values for this project is:
  ```sh
  wrangler secret put JWT_SECRET <secret-value>
  wrangler secret put CORS_ORIGIN "http://localhost:5173 https://works-to-front.pages.dev https://*.works-to-front.pages.dev"
  ```
  Replace `<secret-value>` with the strong secret used locally so that local `wrangler dev` and the deployed worker share the same signing key.

## Password reset flow

- The worker now exposes `POST /auth/password-reset` and `POST /auth/password-reset/confirm` so users can request a link and then set a new password without logging in.
- The link points to `${PASSWORD_RESET_FRONTEND_URL}/recuperar-senha?token_id=...&token=...` and the front-end provides a `/recuperar-senha` page that validates the tokens and lets users submit matching passwords.
- Tokens live in `tb_password_reset`, expire after `PASSWORD_RESET_TOKEN_EXP_MINUTES` (default 30 minutes), and reuse is prevented. The login screen requires the CS field before you can request the link.

- In addition to password resets, login now requires a six-digit security code for users who never logged in or whose last validation is older than 30 days. The endpoints `POST /auth/security-code/confirm` and `POST /auth/security-code/resend` drive that flow and return the usual session bundle when the code is confirmed. The UI shows a masked email hint plus the expiration countdown.

### Password reset secrets

Add these environment values alongside `JWT_SECRET`:

1. `PASSWORD_RESET_FRONTEND_URL` – the absolute URL of the front-end (`https://works-to-front.pages.dev` in production) used to build the reset link.
2. `PASSWORD_RESET_TOKEN_EXP_MINUTES` – optional override for the token lifetime (defaults to `30`).
3. `PASSWORD_RESET_EMAIL_API_URL` – HTTP endpoint that accepts JSON `{ from, to, subject, text, html }`.
4. `PASSWORD_RESET_EMAIL_API_KEY` – Bearer token added as `Authorization: Bearer ...`.
5. `PASSWORD_RESET_EMAIL_FROM` – verified sender address.
6. `PASSWORD_RESET_EMAIL_SUBJECT` – optional custom subject (defaults to `TO Works · Redefinição de senha`).

Configure them via `.dev.vars` and `wrangler secret put` so the worker can send the recovery email.

### Security validation secrets

1. `SECURITY_CODE_EXP_MINUTES` - TTL for the six-digit code (defaults to `15`).
2. `SECURITY_CODE_EMAIL_SUBJECT` - optional custom subject for the security-code email (defaults to `TO Works · Código de segurança`).


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
- Re-running `npx wrangler d1 execute app_db_prd --remote --file=scripts/create-admin.sql` restores the default TecRail tenant, admin user, and seeded ações when needed.

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
