# RentWise

Rent affordability calculator and fair roommate cost splitter.

Work out what share of the rent each person owes, whether it fits your income, and how much
sharing with one more person would actually save you. The calculator runs entirely in your
browser and needs no account. Signing in adds saved scenarios and statistics across them.

**Stack:** React 18 · TypeScript 5.7 · Vite 6 · Tailwind 3.4 · NestJS 10 · Prisma 6 ·
PostgreSQL 16 · nginx 1.27 · Docker · Node 22

---

## Quick start

You need **Docker** installed and nothing else — not Node, not pnpm, not Postgres.

```bash
git clone https://github.com/yaswanthmarella1-ops/RentWise__Affordibility.git
cd RentWise__Affordibility
./start.sh
```

That's it. The script removes any existing RentWise containers, generates a `.env` with
fresh secrets, builds the images, starts everything, applies database migrations, waits
until each service actually answers, then prints your URLs.

First run takes a few minutes (it pulls base images and installs dependencies). After that
it's seconds.

| | URL |
|---|---|
| **App** | <http://localhost:3000> |
| API | <http://localhost:4000/api> |
| API docs (Swagger) | <http://localhost:4000/api/docs> |
| Database | `localhost:5432` |

### Everything `start.sh` can do

```bash
./start.sh              # dev mode: hot reload (default)
./start.sh prod         # production mode: nginx serves a built bundle on :8080
./start.sh --logs       # tail logs of the running stack
./start.sh --stop       # stop everything, keep the database
./start.sh --clean      # wipe the database volume too (prompts first)
./start.sh --help
```

In dev mode **you edit code and it reloads** — no rebuild. You only need to rebuild when
dependencies change, and `./start.sh` does that for you anyway.

Ports are all configurable in `.env` (`WEB_PORT`, `API_PORT`, `HTTP_PORT`, `POSTGRES_PORT`)
if something on your machine already uses them.

---

## Why each piece is here

Every dependency below solves a problem this app actually has. If you're reviewing the
stack, this is the reasoning.

### Docker — why containers at all

The app needs Node 22, PostgreSQL 16, and nginx, all at specific versions. Without Docker,
every developer installs those by hand, and someone always ends up on Postgres 14 with a
subtly different `Decimal` behaviour, or Node 18 where a syntax feature is missing. The
classic "works on my machine" failure.

Docker gives us:

- **One command to run everything.** `./start.sh` on a fresh laptop produces a working app.
  No install guide, no version matrix.
- **Identical environments.** The container your teammate runs is byte-for-byte the one CI
  runs and the one deployed to the server. A bug can't hide in a version difference.
- **Disposable state.** `./start.sh --clean` resets the database completely. Try doing that
  reliably with a Postgres you installed via Homebrew.
- **No pollution.** Postgres runs in a container, not as a permanent background service on
  your machine competing for port 5432 with every other project.

The database lives in a **named volume** (`pgdata`), so stopping containers does not lose
your data — only `--clean` does that, and it asks first.

### nginx — why a web server in front

In development, Vite serves the app directly and this is skipped. In **production** nginx
does three jobs that the app cannot do for itself:

1. **Serves the built files.** A production React build is static HTML/CSS/JS. Node is a
   poor choice for shipping static files; nginx does it with far less memory and far more
   throughput. The Node process is left to do only what needs Node — the API.

2. **Puts everything on one origin.** The browser loads the page from
   `https://yourapp.com` and calls `https://yourapp.com/api/...`. nginx forwards `/api` to
   the API container. Because it's all one origin, there is **no CORS in production**, and
   the `sameSite=strict` auth cookie works without exception. Without this the browser sees
   two different origins and cookie handling gets fragile.

3. **Handles the web-serving details.** Gzip compression, long-lived caching for
   hashed asset filenames, `no-cache` on `index.html` (so users are never stranded on a
   build whose assets no longer exist), and the SPA fallback that routes `/dashboard`
   to `index.html` instead of 404. It's also where TLS terminates.

```
Browser ──> nginx :80 ─┬─> /            static React build
                       └─> /api/*  ───> api :4000 ──> postgres :5432
```

### React + Vite — and why not Next.js

RentWise is an interactive calculator. Every number updates live as you drag a slider, and
none of it is content a search engine needs to index. That shapes the choice:

- **The work is client-side.** The affordability math runs on your keystrokes. Server-side
  rendering has nothing useful to contribute to a slider.
- **Vite is fast.** Sub-second cold start and instant HMR. The dev loop is the thing you
  touch most.
- **It deploys as static files.** The build output is HTML/CSS/JS that nginx serves. No
  Node process is needed to render pages, which makes hosting simpler and cheaper.

**Next.js would be the better choice** if RentWise needed SEO-indexed content pages, server
components, image optimisation, or per-request rendering — a marketing site or a blog
alongside the app. It isn't used here because none of those apply, and its server runtime
would add deployment complexity for no benefit. If public, indexable city rent guides ever
get added, revisiting this is reasonable.

### NestJS — why not plain Express

The API shares types directly with the frontend through `@rentwise/shared`, so
`CalculatorInputs` means exactly the same thing on both sides. NestJS adds:

- **Validation from the type definitions.** `class-validator` decorators on DTOs reject bad
  input before it reaches business logic, and the same decorators generate the Swagger docs.
- **Structure that survives growth.** Modules, dependency injection, and guards keep auth
  in one place instead of scattered middleware.
- **Batteries for the boring parts.** JWT, Passport, rate limiting, and OpenAPI are
  first-party rather than five unrelated packages wired together.

Express would work. It just means hand-rolling the validation, DI, and docs that come free
here.

### PostgreSQL — why not MongoDB

Rent data is **relational**: users own scenarios, scenarios have split members, and the
statistics query across users in a city. That's joins.

- **Money needs exactness.** Amounts are stored as `Decimal(14,2)`, never floating point.
  Floats silently lose cents, which is unacceptable when the whole app is about who owes
  what.
- **Transactions.** Replacing a scenario's split members and updating the scenario must
  either both happen or neither, or a failed write leaves a scenario with no members.
- **Aggregate queries.** The city comparison computes medians across many users. SQL is
  built for this.

**Prisma** sits on top and generates TypeScript types from the schema, so a column rename
becomes a compile error rather than a runtime surprise.

### pnpm workspaces — why a monorepo

The single most valuable structural decision here: the calculation engine lives in
`packages/shared` and **both** the browser and the API import it.

The server never stores computed results — only your inputs — and recomputes on read using
that exact same code. A saved scenario therefore cannot disagree with what the calculator
displays. With two codebases, those two implementations drift apart, and you get a bug
where the dashboard and the calculator show different numbers for the same flat.

---

## Project layout

```
rentwise/
├── start.sh                  One-command bootstrap
├── docker-compose.yml        Production stack
├── docker-compose.dev.yml    Dev overlay: bind mounts + hot reload
├── docker/
│   ├── Dockerfile.api        Multi-stage: deps → build → prune → runner
│   ├── Dockerfile.web        Multi-stage: build → nginx
│   └── nginx.conf            Static serving, /api proxy, SPA fallback
├── apps/
│   ├── web/                  React + Vite + Tailwind
│   └── api/                  NestJS + Prisma
└── packages/
    └── shared/               Types, currencies, formatters, calculation engine
```

---

## How the pieces run in each mode

|  | Development | Production |
|---|---|---|
| Frontend | Vite dev server, HMR, port 3000 | Static build served by nginx |
| API | `nest start --watch`, restarts on save | Compiled `dist`, `node main.js` |
| Source | Bind-mounted from your machine | Baked into the image |
| Rebuild needed? | Only when dependencies change | Every deploy |
| nginx | Not used | Serves everything on port 8080/80 |
| devDependencies | Present (tsc, nest, vite CLIs) | Pruned out |

Both modes target the same Dockerfiles — dev stops at the `build` stage, which still has
the CLIs, while production continues through `prune` to a slim non-root runtime image.

---

## Working on the code

### Without Docker

If you'd rather run the apps on your machine:

```bash
pnpm install
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres
export DATABASE_URL="postgresql://rentwise:<password-from-.env>@localhost:5432/rentwise?schema=public"
pnpm --filter @rentwise/api exec prisma migrate dev
pnpm dev:api    # :4000
pnpm dev:web    # :3000
```

### Common commands

| Command | What it does |
|---|---|
| `pnpm test` | Run every test suite |
| `pnpm build` | Build shared, then the web app |
| `pnpm docker:migrate --name add_x` | Create a migration against the dev database |
| `pnpm --filter @rentwise/api exec prisma studio` | Browse the database in a GUI |
| `./start.sh --logs` | Tail all container logs |

### Database changes

Edit `apps/api/prisma/schema.prisma`, then:

```bash
pnpm docker:migrate --name describe_your_change
```

Commit the generated file in `apps/api/prisma/migrations/`. Migrations apply automatically
on container start, so teammates just run `./start.sh`.

---

## API

Base path `/api`. Interactive docs at `/api/docs` when not in production.

| Method | Route | Auth | Purpose |
|---|---|:--:|---|
| POST | `/auth/register` | — | Create an account |
| POST | `/auth/login` | — | Sign in |
| POST | `/auth/refresh` | cookie | Rotate the refresh token |
| POST | `/auth/logout` | cookie | Revoke the refresh token |
| GET | `/auth/me` | Bearer | Current user and optional profile |
| PATCH | `/auth/me` | Bearer | Update the optional profile (partial) |
| GET | `/scenarios` | Bearer | List your saved scenarios |
| POST | `/scenarios` | Bearer | Save a scenario |
| GET · PATCH · DELETE | `/scenarios/:id` | Bearer | Read, update, delete one |
| GET | `/stats` | Bearer | Statistics across your scenarios |
| GET | `/health` | — | Liveness and database probe |

### Auth design

- Passwords hashed with **Argon2id** (19 MiB, t=2, p=1 — OWASP baseline).
- **Access token:** JWT, 15 minutes, held in memory only. Never in `localStorage`, so an
  XSS payload cannot read it back.
- **Refresh token:** opaque 48-byte random value, stored only as a SHA-256 hash, delivered
  as an `httpOnly` + `sameSite=strict` cookie scoped to `/api/auth`.
- **Rotation with reuse detection:** every refresh issues a new token and revokes the old.
  Replaying a revoked token revokes the entire family, so a stolen cookie stops working the
  moment the real user refreshes.
- Login runs an Argon2 verification even for unknown emails, so response timing cannot
  reveal whether an account exists.
- A scenario owned by another user returns **404, not 403** — a 403 would confirm the id
  exists.

---

## The optional profile

**Registration requires only an email and a password.** Name, city, country, occupation,
age group, monthly income and household size are all optional, skippable at sign-up, and
editable later at `/profile`. The calculator behaves identically either way.

Filling them in only makes the statistics richer:

| Field | What it unlocks |
|---|---|
| Monthly income | Every saved scenario **re-scored against what you actually earn**, surfacing any that flip between affordable and over-target |
| Household size | Flags scenarios whose occupancy differs from your usual household |
| City | Anonymous comparison against other renters in the same city |
| Name | A personal greeting |

`GET /stats` never guesses at a missing value. A section depending on an absent field
returns `null` or an object explaining what to fill in, so the UI shows a locked card
rather than a fabricated number.

**Always available:** averages (cost, per-person share, income used, occupancy), the
affordability breakdown, and the cheapest-vs-priciest spread with the annual saving.
Scenarios in a non-dominant currency are excluded from averages and reported separately —
averaging across currencies would be meaningless.

**Privacy of the city comparison:** it exposes medians and a percentile only, never another
user's scenarios, and stays hidden until at least **5 other renters** in that city have
saved data, so a "median" can never describe one identifiable person. Each peer contributes
a single averaged data point, so one prolific user cannot skew it.

---

## Environment variables

`start.sh` generates `.env` for you. Regenerate or hand-edit from `.env.example`.

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | — | Host is `postgres` inside Docker, `localhost` outside |
| `JWT_ACCESS_SECRET` | — | Required, ≥32 chars |
| `JWT_REFRESH_SECRET` | — | Required, ≥32 chars, must differ from the access secret |
| `JWT_ACCESS_TTL` | `15m` | Access token lifetime |
| `REFRESH_TTL_DAYS` | `30` | Refresh token lifetime |
| `CORS_ORIGIN` | `http://localhost:3000` | Comma-separated allowed origins |
| `COOKIE_DOMAIN` | `localhost` | Applied in production only |
| `WEB_PORT` · `API_PORT` · `HTTP_PORT` · `POSTGRES_PORT` | 3000 · 4000 · 8080 · 5432 | Host ports |

Startup fails fast with a readable message if a secret is missing or too short.
**`.env` is gitignored and must never be committed.**

---

## Testing

```bash
pnpm test
```

56 unit tests over `packages/shared`:

- **Calculation engine (35)** — split math, affordability thresholds and their exact
  boundaries, the budget ceiling and deficit case, and hostile input (zero income, negative
  rent, out-of-range targets).
- **Statistics engine (21)** — portfolio aggregates, mixed-currency exclusion, the income
  and household sections correctly returning `null` when the optional field is absent,
  profile completeness, and median/percentile on empty input.

This is the money math, so it's the part that must not silently drift.

---

## Contributing

### Branching

`main` is protected — never commit to it directly. Branch per unit of work:

```bash
git checkout main
git pull
git checkout -b feat/short-description
```

| Prefix | Use for |
|---|---|
| `feat/` | New functionality |
| `fix/` | Bug fixes |
| `refactor/` | Restructuring with no behaviour change |
| `docs/` | Documentation only |
| `chore/` | Tooling, dependencies, CI |

### When to open a pull request

**Open one as soon as the branch does one complete, reviewable thing.** Concretely:

- ✅ A feature works end to end and has tests — even if polish is still to come.
- ✅ A bug is fixed and a test now covers it.
- ✅ You want early feedback on an approach — open it as a **draft PR** and say what you're
  unsure about. Far cheaper than finding out after three days of work.
- ❌ Not when the branch contains two unrelated changes. Split them; reviewing a mixed PR is
  slow and things get missed.
- ❌ Not when tests fail or typechecks are red. CI will reject it anyway.

Aim for PRs a reviewer can hold in their head — roughly under ~400 changed lines where the
work allows. A large PR is not a sign of productivity; it's a sign the work should have
been split.

### Before you open it

```bash
pnpm test                                        # all suites green
pnpm --filter @rentwise/api exec tsc --noEmit    # api typechecks
pnpm --filter @rentwise/web exec tsc --noEmit    # web typechecks
./start.sh                                       # the app actually runs
```

Then:

```bash
git push -u origin feat/short-description
```

GitHub prints a PR link in the output, or use `gh pr create`.

### What a good PR description has

- **What** changed and **why** — the problem, not just the diff.
- How to verify it, so a reviewer can reproduce your result.
- Screenshots for anything visual.
- Anything you deliberately left out, and why.

CI runs typecheck, tests, and builds on every PR. On merge to `main` it pushes images to
GHCR.

---

## Deploying

On a server with Docker installed:

```bash
git clone <repo> && cd RentWise__Affordibility
cp .env.example .env        # fill in production values
./start.sh prod
```

Set `NODE_ENV=production`, a real `COOKIE_DOMAIN`, and `CORS_ORIGIN` for your domain.
Terminate TLS in front of nginx (certbot, Caddy, or Cloudflare) — `secure` cookies require
HTTPS.

Back up nightly:

```bash
docker compose exec -T postgres pg_dump -U rentwise rentwise | gzip > backup-$(date +%F).sql.gz
```

Data lives in the `pgdata` volume. `./start.sh --stop` preserves it; `./start.sh --clean`
destroys it.

---

## Troubleshooting

**Port already in use** — change `WEB_PORT` / `API_PORT` / `HTTP_PORT` / `POSTGRES_PORT` in
`.env` and re-run `./start.sh`.

**API won't start** — `./start.sh --logs` and read the error. Most often a malformed
`DATABASE_URL` or a JWT secret under 32 characters.

**Changes not appearing** — in dev, confirm you're on <http://localhost:3000> (Vite) and not
:8080 (the prod nginx build, which is baked at build time).

**Database looks wrong after a schema change** — `./start.sh --clean` for a fresh start. It
will ask before deleting anything.

**Everything is broken** — `./start.sh --clean` rebuilds from scratch. Nothing outside this
directory and its Docker volumes is touched.
