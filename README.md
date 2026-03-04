# Hermes Dashboard

Next.js dashboard for Hermes marketing operations with SQLite-backed APIs and session auth.

## Setup

1. Create local env file:

```bash
pnpm env:bootstrap
```

2. Verify required auth values in `.env.local`:
- `AUTH_USER`
- `AUTH_PASS` (min 10 chars)
- `API_KEY`
- `AUTH_COOKIE_SECURE` (`false` for HTTP, `true` for HTTPS)

Optional Google SSO:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (e.g. `https://your-domain/api/auth/google/callback`)
- Optional: `GOOGLE_AUTH_ALLOWED_EMAILS`, `GOOGLE_AUTH_ALLOWED_DOMAINS`, `GOOGLE_AUTH_DEFAULT_ROLE`

Host access lock (default keeps Hermes local-first for OpenClaw/Codex workflows):
- `HERMES_HOST_LOCK=local` (default): allow `localhost`, `127.0.0.1`, and Tailscale hosts
- `HERMES_HOST_LOCK=off`: disable host lock
- `HERMES_HOST_LOCK=host1,host2`: explicit hostname allowlist

Optional 1Password runtime overlay (standalone mode):
- `HERMES_1PASSWORD_MODE=off`: never use 1Password
- `HERMES_1PASSWORD_MODE=auto` (default): use 1Password if available, otherwise fallback to current env
- `HERMES_1PASSWORD_MODE=required`: fail startup unless 1Password overlay succeeds
- `HERMES_OP_ENV_FILE=/etc/hermes-dashboard/hermes-dashboard.op.env` (override op template file path)

Agent discovery / squads:
- Agents and squad views are dynamic (discovered from OpenClaw config/filesystem via `/api/agents`).
- `HERMES_USE_DEFAULT_AGENT_META=false` (default) keeps discovery fully dynamic.
- Set `HERMES_USE_DEFAULT_AGENT_META=true` only if you want legacy built-in metadata defaults.

3. Install and run:

```bash
pnpm install
pnpm dev
```

## Auth Behavior

- Session auth is required for all protected pages and API routes.
- API routes also allow `x-api-key` when it matches `API_KEY`.
- If the `users` table is empty, the app seeds the first admin from:
  - `AUTH_USER`
  - `AUTH_PASS`
- There are no default fallback credentials.
- Admin users can manage users and roles (`admin`, `operator`, `viewer`) from **Settings**.
- When Google SSO is configured, users can sign in via Google and are provisioned on first login.

## Scripts

- `pnpm dev`
- `pnpm env:bootstrap` (creates/updates `.env.local` with fresh `AUTH_PASS` + `API_KEY`)
- `pnpm lint`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm prepare:standalone` (copies static assets into `.next/standalone`)
- `pnpm build:standalone` (build + prepare standalone; fixes missing CSS after rebuilds)
- `pnpm start`
- `pnpm seed`

## Template Hygiene

- Run `./scripts/template-audit.sh` before sharing or templating.
- Use `./scripts/template-export.sh [output_dir]` to produce a clean copy (excludes `.env*`, `*.db*`, `state`, `.next`, `node_modules`).
- Seed/demo data is synthetic and template-safe (`example.test` addresses).
- Host lock defaults to local-only for OpenClaw workflows; change `HERMES_HOST_LOCK` only if your deployment needs public host access.

## Open Source

- License: MIT ([LICENSE](./LICENSE))
- Security reporting: [SECURITY.md](./SECURITY.md)
- Contribution guide: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Code of conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- Third-party licenses: [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)
