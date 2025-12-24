# Stock Monitoring Worker

![Status: Frozen](https://img.shields.io/badge/status-frozen-blue)

Project status: frozen due to high pricing in Europe stock APIs.

Backend Cloudflare Worker for the Stock Monitoring app. It pairs with the React client at https://github.com/GeorgeLinardis/Lab_Stock-monitoring_client to serve market data and scoring results.

## What it does
- Serves a paginated `/api/stocks` endpoint backed by the D1 `symbols` table.
- Enforces pagination limits and returns `page`, `pageSize`, `total`, and `totalPages` metadata.
- Uses environment bindings for the D1 database and `TWELVE_API_TOKEN`.
- Sends JSON responses with a permissive CORS header for the client.

## Tech stack
- Cloudflare Workers (runtime)
- Wrangler (dev + deploy tooling)
- D1 (SQLite-backed database)
- Vitest (test runner)

## Dev & DB workflows

### Environments
- **Local DB (emulated)**:
  A temporary SQLite file created on your machine when you run
  `wrangler dev --local` or `wrangler d1 migrations apply --local`.
  Exists only locally (inside `.wrangler/state/v3/d1/`).
  Good for fully offline development or experiments you can throw away.

- **Preview DB (remote sandbox)**:
  Hosted on Cloudflare; used by `wrangler dev` and `dev:remote`.
  Safe to experiment with—separate from production data.
  Defined in `wrangler.toml` under `preview_database_id`.

- **Production DB (remote live)**:
  The real one your deployed Worker uses.
  Used by `wrangler deploy` and `dev:remote:prod`.

### Running locally
- `npm run dev`
  Local runtime + **preview DB** + local secrets from `.env`.

- `npm run dev:remote`
  Runs on Cloudflare **preview** (remote secrets from Cloudflare dashboard).

- `npm run dev:remote:prod`
  Runs on Cloudflare **production** (use with caution).

### Migrations
- `npm run db:migrate:local` — apply to local D1.
- `npm run db:migrate:preview` — apply to **preview** DB (remote).
- `npm run db:migrate:prod` — apply to **production** DB (remote).
- `npm run db:migrate:list:preview` / `:prod` — check status.

### Secrets
- Local: put in `.env`
- Remote: set in Cloudflare dashboard **per environment** (Preview/Production) or via `wrangler secret put`.

At runtime, access through `.env`, etc.

### Useful checks
- `npm run db:tables:preview` / `:prod` — list tables quickly.
