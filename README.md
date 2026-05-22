# Snip — Self-Hosted URL Shortener

A self-hosted URL shortener built with SvelteKit, Prisma, PostgreSQL, and Redis. Only authenticated users can create links; redirects are public.

## Features

- **Auth-gated creation** — JWT cookie sessions, bcrypt password hashing
- **Random + custom slugs** — 7-char base62 random codes or pick your own
- **Full click analytics** — every click logs IP, referrer, user-agent, country, timestamp
- **Redis-cached redirects** — sub-millisecond `code → URL` lookups
- **Expiration + pause** — set TTL or pause links without deleting
- **Fully dockerized** — `docker compose up` and you're running

## Stack

| Layer    | Tech |
|----------|------|
| Frontend | SvelteKit + Tailwind CSS |
| Backend  | SvelteKit server routes (Node) |
| ORM      | Prisma |
| DB       | PostgreSQL 16 |
| Cache    | Redis 7 |
| Auth     | JWT (HTTP-only cookie) + bcrypt |

## Quick start (Docker)

```bash
git clone https://github.com/uAliAmer/Svelte-URL-Shortener.git
cd Svelte-URL-Shortener

cp .env.example .env
# Edit .env — set a strong JWT_SECRET (e.g. openssl rand -hex 32)
# Optionally change POSTGRES_PASSWORD and PUBLIC_BASE_URL

docker compose up -d --build
```

Open <http://localhost:3000>, create an account, and start shortening.

Migrations run automatically on container start (`prisma migrate deploy`).

## Configuration

All env vars live in `.env` (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `PUBLIC_BASE_URL` | `http://localhost:3000` | The public URL where this app is reachable. Used to build short-link strings shown in the dashboard. |
| `APP_PORT` | `3000` | Host port mapped to the container. |
| `JWT_SECRET` | _(required)_ | Secret for signing session JWTs. |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `snip` / `snip` / `snip` | Postgres credentials. |

## Local development (without Docker)

```bash
npm install
cp .env.example .env

# Point DATABASE_URL at a running Postgres + REDIS_URL at a running Redis
export DATABASE_URL="postgresql://snip:snip@localhost:5432/snip"
export REDIS_URL="redis://localhost:6379"
export JWT_SECRET="dev-secret"

npx prisma migrate dev
npm run dev
```

## API

All endpoints under `/api` require an authenticated session except for auth.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | `{ email, password }` → sets session cookie |
| `POST` | `/api/auth/login`    | `{ email, password }` → sets session cookie |
| `POST` | `/api/auth/logout`   | clears session cookie |
| `GET`  | `/api/links`         | List your links |
| `POST` | `/api/links`         | `{ originalUrl, customSlug?, expiresAt? }` |
| `GET`  | `/api/links/:id`     | Get link + recent clicks |
| `PATCH`| `/api/links/:id`     | `{ isActive?, originalUrl? }` |
| `DELETE`| `/api/links/:id`    | Delete a link |
| `GET`  | `/:code`             | Public redirect |

## Data model

```
User       → id, email, passwordHash, createdAt
Link       → id, code, originalUrl, userId, clickCount, expiresAt, isActive
Click      → id, linkId, ip, referrer, userAgent, country, createdAt
```

## Production notes

- Run behind a TLS-terminating reverse proxy (Nginx, Caddy, Traefik).
- Set `PUBLIC_BASE_URL` to your production URL so the dashboard renders correct short-link strings.
- `ORIGIN` is also passed through to the Node adapter to satisfy SvelteKit's CSRF check.
- Generate a strong `JWT_SECRET` (32+ random bytes) and don't commit `.env`.
- The redirect handler logs every click. For high traffic, batch into an async queue.

## License

MIT — see [LICENSE](./LICENSE).
