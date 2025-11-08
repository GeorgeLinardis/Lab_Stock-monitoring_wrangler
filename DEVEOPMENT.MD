# Dev & DB Workflows

## Environments
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

## Running locally
- `npm run dev`
  Local runtime + **preview DB** + local secrets from `.env`.

- `npm run dev:remote`
  Runs on Cloudflare **preview** (remote secrets from Cloudflare dashboard).

- `npm run dev:remote:prod`
  Runs on Cloudflare **production** (use with caution).

## Migrations
- `npm run migration:local` — apply to local D1.
- `npm run migration:preview` — apply to **preview** DB (remote).
- `npm run migration:prod` — apply to **production** DB (remote).
- `npm run migration:list:preview` / `:prod` — check status.

## Secrets
- Local: put in `.env`
- Remote: set in Cloudflare dashboard **per environment** (Preview/Production) or via `wrangler secret put`.

At runtime, access through `.env`, etc.

## Useful checks
- `npm run db:tables:preview` / `:prod` — list tables quickly.
