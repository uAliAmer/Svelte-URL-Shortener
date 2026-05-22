# Snip — Self-Hosted URL Shortener

A self-hosted URL shortener built with SvelteKit, Prisma, PostgreSQL, and Redis. Auth-gated link creation, public redirects, per-link analytics, brandable, and API-key accessible.

## Features

- **Auth-gated creation** — JWT cookie sessions, bcrypt passwords, rate-limited login/register
- **Random + custom slugs** — 7-char base62 codes or pick your own
- **Tags + edit + pause** — organize links, change destinations, expire or pause without deleting
- **Click analytics** — IP / referrer / user-agent / country / timestamp per click, 30-day chart per link
- **QR codes** — every link has a downloadable PNG QR
- **Redis-cached redirects** — sub-millisecond `code → URL` lookups
- **Branded** — admins set instance name, tagline, default expiry from `/admin`
- **User management** — admin panel for adding/removing users, granting admin/API rights, optional public signup
- **API keys** — full or read-only scopes, `Authorization: Bearer` on every `/api/*` endpoint
- **Self-hostable** — `docker compose up` and you're running

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

Instance-level settings (brand title, tagline, signup toggle, default link expiry, API-key enable) are configured at runtime from `/admin` — no env vars or restarts needed.

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

The web UI uses cookie sessions. For programmatic use, create an **API key** at `/account/api-keys` and send it as `Authorization: Bearer <key>`. Two scopes:

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

Available at `/admin` to any user with `isAdmin = true`. From there you can:

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
