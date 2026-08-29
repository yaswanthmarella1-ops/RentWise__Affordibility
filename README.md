# RentWise

Rent affordability calculator and fair roommate cost splitter. React + TypeScript frontend,
NestJS + PostgreSQL backend, deployed with Docker Compose.

The calculator itself runs entirely in the browser and needs no account. Signing in adds
saved scenarios that persist across devices.

---

## Architecture

```
rentwise/
├── apps/
│   ├── web/            React 18 + Vite + Tailwind (the calculator UI)
│   └── api/            NestJS 10 + Prisma (auth + saved scenarios)
├── packages/
│   └── shared/         Domain types, currencies, formatters, calculation engine
├── docker/             Dockerfiles, nginx config, API entrypoint
├── docker-compose.yml       production stack
└── docker-compose.dev.yml   local overlay
```

`packages/shared` holds the affordability engine. Both the browser and the API import it,
so a saved scenario can never disagree with what the calculator displays — the server
recomputes results from the stored inputs on every read rather than persisting derived
values.

**Stack:** React 18.3 · TypeScript 5.7 · Vite 6 · Tailwind 3.4 · NestJS 10 · Prisma 6 ·
PostgreSQL 16 · nginx 1.27 · Node 22

---

## Quick start

Requires Node 22+, pnpm 11+, and Docker.

```bash
pnpm install
cp .env.example .env
```

Fill in `.env` — generate each JWT secret separately, they must differ:

```bash
openssl rand -base64 48   # JWT_ACCESS_SECRET
openssl rand -base64 48   # JWT_REFRESH_SECRET
openssl rand -hex 16      # POSTGRES_PASSWORD
```

### Everything in Docker

```bash
docker compose up --build
```

App at <http://localhost> (set `HTTP_PORT` in `.env` to use another port). nginx serves the
built React bundle and proxies `/api` to the API container, so the browser sees one origin
and there is no CORS in production. Migrations apply automatically on API start.

### Local development with hot reload

The dev overlay bind-mounts your source into the containers, so **editing code never
requires a `docker build`**:

```bash
pnpm docker:dev          # docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

| Service | URL | Reloads on |
|---|---|---|
| web | <http://localhost:3000> | Vite HMR — instant, browser keeps state |
| api | <http://localhost:4000/api> | Nest watch mode restarts on save (Swagger at `/api/docs`) |
| postgres | `localhost:5432` | — exposed for Prisma Studio or a GUI client |

Rebuild **only** when dependencies or the Dockerfiles change:

```bash
pnpm docker:dev:build
```

How it works: both services target the Dockerfiles' `build` stage, which still carries
devDependencies and the `nest` / `vite` / `tsc` CLIs that the production runner stages
deliberately strip. Only *source* directories are mounted — never a whole app directory —
so the image's `node_modules` are not shadowed by the host.

`@rentwise/shared` is handled on both sides: Vite aliases it straight to TypeScript source
(so web hot-reloads with no build step), while a `tsc --watch` inside the api container
rebuilds its `dist` for Nest to pick up.

Run a migration against the dev database:

```bash
pnpm docker:migrate --name your_migration_name
```

Prefer running the apps on the host instead? Start just the database with
`docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres`, point
`DATABASE_URL` at `localhost:5432`, then `pnpm dev:api` and `pnpm dev:web`.

---

## Commands

| Command | What it does |
|---|---|
| `pnpm build` | Build shared, then the web app |
| `pnpm test` | Run every workspace test suite |
| `pnpm dev:web` / `pnpm dev:api` | Start one app in watch mode |
| `pnpm --filter @rentwise/api exec prisma migrate dev` | Create and apply a migration |
| `pnpm --filter @rentwise/api exec prisma studio` | Browse the database |
| `docker compose up --build` | Full production stack |

---

## API

Base path `/api`. Swagger UI at `/api/docs` when `NODE_ENV != production`.

| Method | Route | Auth | Purpose |
|---|---|:--:|---|
| POST | `/auth/register` | — | Create an account, returns an access token |
| POST | `/auth/login` | — | Sign in |
| POST | `/auth/refresh` | cookie | Rotate the refresh token |
| POST | `/auth/logout` | cookie | Revoke the refresh token |
| GET | `/auth/me` | Bearer | Current user and optional profile |
| PATCH | `/auth/me` | Bearer | Update the optional profile (partial) |
| GET | `/stats` | Bearer | Portfolio statistics across saved scenarios |
| GET | `/scenarios` | Bearer | List your saved scenarios |
| POST | `/scenarios` | Bearer | Save a scenario |
| GET | `/scenarios/:id` | Bearer | Fetch one |
| PATCH | `/scenarios/:id` | Bearer | Update one |
| DELETE | `/scenarios/:id` | Bearer | Delete one |
| GET | `/health` | — | Liveness + database probe |

### Auth design

- Passwords hashed with **Argon2id** (19 MiB, t=2, p=1 — OWASP baseline).
- **Access token**: JWT, 15 minutes, kept in memory only. Never in `localStorage`, so an
  XSS payload cannot read it.
- **Refresh token**: opaque 48-byte random value, stored only as a SHA-256 hash, delivered
  as an `httpOnly` + `sameSite=strict` cookie scoped to `/api/auth`.
- **Rotation with reuse detection**: every refresh issues a new token and revokes the old
  one. Replaying a revoked token revokes the entire rotation family, so a stolen cookie
  stops working as soon as the real user refreshes.
- Login runs an Argon2 verification even for unknown emails, so response timing does not
  reveal whether an account exists.
- Scenarios owned by another user return **404, not 403** — a 403 would confirm the id
  exists.

---

## The optional profile

**Registration requires only an email and a password.** Everything else — name, city,
country, occupation, age group, monthly income, household size — is optional, can be
skipped entirely at sign-up, and can be added, changed, or cleared later at `/profile`.
The calculator and every saved scenario behave identically either way.

Supplying a field only makes the statistics richer:

| Field | What it unlocks |
|---|---|
| Monthly income | Every saved scenario is **re-scored against what you actually earn**, surfacing any that flip between affordable and over-target |
| Household size | Flags scenarios whose occupancy differs from your usual household |
| City | An anonymous comparison against other renters in the same city |
| Name | A personal greeting |

`GET /stats` never guesses at a missing value. A section that depends on an absent field
comes back as `null`, or as an object explaining what to fill in — so the UI can show a
locked card rather than a fabricated number.

### Statistics that are always available

Averages (housing cost, per-person share, income used, occupancy), the affordability
verdict breakdown, and the cheapest-vs-priciest spread with the annual saving between
them. Scenarios in a non-dominant currency are excluded from the averages and reported
separately, since averaging across currencies would be meaningless.

### The city cohort and privacy

The city comparison exposes **medians and a percentile only** — never another user's
scenarios. It stays hidden until at least **5 other renters** in that city have saved
data, so the "median" can never describe one identifiable person. Each peer contributes a
single averaged data point, so one prolific user cannot skew it.

### Partial updates

`PATCH /auth/me` distinguishes *omitted* from *cleared*: a field left out of the request
body keeps its stored value, while an explicit `null` removes it. Blank and
whitespace-only strings are treated as "not supplied" rather than stored as empty.

---

## Environment variables

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | — | Required. Host is `postgres` inside Docker, `localhost` outside |
| `JWT_ACCESS_SECRET` | — | Required, ≥32 chars |
| `JWT_REFRESH_SECRET` | — | Required, ≥32 chars, must differ from the access secret |
| `JWT_ACCESS_TTL` | `15m` | Access token lifetime |
| `REFRESH_TTL_DAYS` | `30` | Refresh token lifetime |
| `CORS_ORIGIN` | `http://localhost:3000` | Comma-separated allowed origins |
| `COOKIE_DOMAIN` | `localhost` | Applied in production only |
| `HTTP_PORT` | `80` | Host port nginx binds to |
| `PORT` | `4000` | API port inside its container |

Startup fails fast with a readable message if a required variable is missing or a secret is
too short.

---

## Deployment (single VPS)

1. Install Docker and the Compose plugin.
2. Clone the repo, create `.env` with production values (`NODE_ENV=production`, a real
   `COOKIE_DOMAIN`, and `CORS_ORIGIN` set to your domain).
3. `docker compose up -d --build`
4. Terminate TLS in front of nginx (certbot, or a reverse proxy such as Caddy or
   Cloudflare). `secure` cookies require HTTPS in production.
5. Back up nightly:

```bash
docker compose exec -T postgres pg_dump -U rentwise rentwise | gzip > backup-$(date +%F).sql.gz
```

Postgres data lives in the named volume `pgdata`. `docker compose down` preserves it;
`docker compose down -v` destroys it.

CI (`.github/workflows/ci.yml`) typechecks, tests, and builds on every PR, and pushes
images to GHCR on merge to `main`.

---

## Testing

```bash
pnpm test
```

56 unit tests cover `packages/shared`:

- **Calculation engine (35)** — split math, affordability thresholds and their exact
  boundaries, the budget ceiling and deficit case, and hostile input (zero income,
  negative rent, out-of-range targets).
- **Statistics engine (21)** — portfolio aggregates, mixed-currency exclusion, the
  income re-scoring and household-fit sections returning `null` when the optional field
  is absent, profile completeness, and the median/percentile helpers on empty input.

This is the money math, so it is the part that must not silently drift.
