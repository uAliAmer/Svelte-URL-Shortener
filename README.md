# Snip — Self-Hosted URL Shortener

A self-hosted URL shortener built with SvelteKit, Prisma, PostgreSQL, and Redis. Auth-gated link creation, public redirects, per-link analytics, brandable, and API-key accessible.

## Features

- **Auth-gated creation** — JWT cookie sessions, bcrypt passwords, rate-limited login/register
- **Random + custom slugs** — 7-char base62 codes or pick your own
- **Tags + edit + pause** — organize links, change destinations, expire or pause without deleting
- **Click analytics** — IP / referrer / user-agent / country / timestamp per click, 30-day chart per link
- **QR codes** — every link has a downloadable PNG QR
- **Redis-cached redirects** — sub-millisecond `code → URL` lookups
- **Branded** — admins set instance name, tagline, default expiry from `/settings`
- **User management** — admin panel for adding/removing users, granting admin/API rights, optional public signup
- **API keys** — full or read-only scopes, `Authorization: Bearer` on every `/api/*` endpoint
- **Self-hostable** — `docker compose up` locally, or one-click deploy to Railway

## Stack

| Layer    | Tech |
|----------|------|
| Frontend | SvelteKit + Tailwind CSS |
| Backend  | SvelteKit server routes (Node) |
| ORM      | Prisma |
| DB       | PostgreSQL 16 |
| Cache    | Redis 7 |
| Auth     | JWT (HTTP-only cookie) + bcrypt, plus API key (sha256) |

## Quick start (Docker)

```bash
git clone https://github.com/uAliAmer/Svelte-URL-Shortener.git
cd Svelte-URL-Shortener

cp .env.example .env
# Edit .env — set a strong JWT_SECRET (e.g. openssl rand -hex 32)
# Optionally change POSTGRES_PASSWORD and PUBLIC_BASE_URL

docker compose up -d --build
docker compose exec app npm run db:seed   # creates a demo admin
```

Open <http://localhost:3000> and log in:

- **Email:** `demo@example.com`
- **Password:** `demo1234`

You'll be redirected to `/account/setup` to choose new credentials before continuing. The first registered user is automatically promoted to admin (so the seed is optional — you can also sign up fresh).

Migrations run automatically on container start (`prisma migrate deploy`).

## Configuration

All env vars live in `.env` (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `PUBLIC_BASE_URL` | `http://localhost:3000` | The public URL where this app is reachable. Used to build short-link strings shown in the dashboard. |
| `APP_PORT` | `3000` | Host port mapped to the container. |
| `JWT_SECRET` | _(required)_ | Secret for signing session JWTs. |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `snip` / `snip` / `snip` | Postgres credentials. |

Instance-level settings (brand title, tagline, signup toggle, default link expiry, API-key enable) are configured at runtime from `/settings` (admins only) — no env vars or restarts needed.

## Deploy to Railway

[Railway](https://railway.app) provides managed Postgres + Redis, builds from your Docker image, and gives you a public URL — no extra config files needed.

1. **Create a new project** in Railway and connect this repo (or your fork).
2. **Add two services** from the Railway dashboard: **Postgres** and **Redis** (both are one-click).
3. **Configure the app service** — Railway auto-detects the `Dockerfile`. Set these variables:

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (reference the Postgres service) |
   | `REDIS_URL` | `${{Redis.REDIS_URL}}` (reference the Redis service) |
   | `JWT_SECRET` | a 32-byte random string (`openssl rand -hex 32`) |
   | `PUBLIC_BASE_URL` | your Railway-generated URL (or custom domain) |
   | `ORIGIN` | same as `PUBLIC_BASE_URL` |
   | `NODE_ENV` | `production` |

4. **Generate a public domain** for the app service (Settings → Networking → Generate Domain), then paste it back into `PUBLIC_BASE_URL` and `ORIGIN` and redeploy.
5. Migrations apply automatically on container start. **Optionally seed a demo admin** by running `npm run db:seed` once from the Railway shell — or just sign up at `/register` (the first user is auto-promoted to admin).

That's it.

## Custom domain

Want your instance at `links.acme.com` instead of `localhost:3000`? Pick the path that matches your host:

### Railway

Open your app service → **Settings → Networking → Custom Domain** and enter your hostname. Railway provisions a TLS cert for you. Then update `PUBLIC_BASE_URL` and `ORIGIN` to `https://your-domain` and redeploy.

### Self-hosted (Docker)

The repo ships a Caddy override that handles TLS + Let's Encrypt automatically. In `.env`:

```bash
DOMAIN=links.acme.com
ACME_EMAIL=you@example.com
PUBLIC_BASE_URL=https://links.acme.com
```

Point your domain's A/AAAA record at the server, then:

```bash
docker compose -f docker-compose.yml -f docker-compose.caddy.yml up -d --build
```

Caddy binds 80/443, terminates TLS, and reverse-proxies to the app (port 3000 is no longer exposed to the host). Certs renew automatically and persist in the `snip-caddy-data` volume. To go back to plain HTTP, omit the `-f docker-compose.caddy.yml` flag on subsequent `docker compose` commands.

### Behind your own reverse proxy

If you already run Nginx, Traefik, or another front-end, just keep the default `docker-compose.yml` (app on port 3000) and proxy to it. Make sure `PUBLIC_BASE_URL` and `ORIGIN` match the public HTTPS URL — SvelteKit's CSRF check rejects form submissions when `Origin` doesn't match.

## Local development (without Docker)

```bash
npm install
cp .env.example .env

export DATABASE_URL="postgresql://snip:snip@localhost:5432/snip"
export REDIS_URL="redis://localhost:6379"
export JWT_SECRET="dev-secret"

npx prisma migrate dev
npm run db:seed
npm run dev
```

## API

The web UI uses cookie sessions. For programmatic use, create an **API key** at `/settings` and send it as `Authorization: Bearer <key>`. Two scopes:

- `snip_f_…` — full access (read + write)
- `snip_r_…` — read-only (rejects writes with 403)

Full reference with curl examples lives at `/docs/api` once the app is running.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | `{ email, password }` (gated by admin signup toggle) |
| `POST` | `/api/auth/login`    | `{ email, password }` → sets session cookie |
| `POST` | `/api/auth/logout`   | clears session cookie |
| `GET`  | `/api/links`         | List your links |
| `POST` | `/api/links`         | `{ originalUrl, customSlug?, expiresAt?, tag? }` |
| `GET`  | `/api/links/:id`     | Get link + recent clicks |
| `PATCH`| `/api/links/:id`     | `{ isActive?, originalUrl?, expiresAt?, tag? }` |
| `DELETE`| `/api/links/:id`    | Delete a link |
| `GET`  | `/api/keys`          | List your API keys (no plaintext) |
| `POST` | `/api/keys`          | `{ name, scope }` → returns plaintext **once** |
| `DELETE`| `/api/keys/:id`     | Revoke a key |
| `GET`  | `/:code`             | Public redirect |

Admin-only endpoints (`/api/admin/*`) accept cookie sessions only — never API keys.

## Data model

```
User    → id, email, passwordHash, isAdmin, canUseApi, mustChangeCredentials, createdAt
Link    → id, code, originalUrl, userId, clickCount, expiresAt, isActive, tag
Click   → id, linkId, ip, referrer, userAgent, country, createdAt
ApiKey  → id, userId, name, prefix, hash, scope, lastUsedAt, revokedAt, createdAt
Setting → key, value (JSON-encoded, single global namespace)
```

## Admin panel

Available at `/settings` — admins see the full instance-management UI; non-admin users see only their own API keys section. From there you can:

- Set **brand title** / **tagline** — propagates to header, footer, page titles, OG tags
- Toggle **public signup** (when off, `/api/auth/register` returns 403)
- Toggle **API keys** globally + revoke per-user API access
- Set a **default expiry** for new links
- **Add users** (bypasses the signup gate, forces credential rotation on first login)
- **Delete users** with a choice: transfer their links to your account, or cascade-delete them

The last admin cannot be deleted or demoted. You can't delete yourself.

## Production notes

- Run behind a TLS-terminating reverse proxy (Nginx, Caddy, Traefik).
- Set `PUBLIC_BASE_URL` to your production URL so the dashboard renders correct short-link strings.
- `ORIGIN` is also passed through to the Node adapter to satisfy SvelteKit's CSRF check.
- Generate a strong `JWT_SECRET` (32+ random bytes) and don't commit `.env`.
- The redirect handler logs every click in a fire-and-forget transaction. For high traffic, consider batching into an async queue.
- Rate limits (login: 10/min/IP, register: 5/hour/IP) are stored in Redis — flush keys after deploys if needed.

## CI

`.github/workflows/ci.yml` runs on every PR and push to `main`:

- Node 22
- `npm ci` + `prisma generate` + `vite build`

Green build = the app compiles and Prisma schema is valid.

## License

MIT — see [LICENSE](./LICENSE).
