# Agile Testing Tool

A single-user web app that enforces a disciplined testing checklist for two
workflows: **Bug Tickets** and **New Implementation Tests**.

> A new ticket never opens a blank form. It instantiates the **full checklist,
> pre-populated**, so skipping a step is always a deliberate "N/A" — never an
> accident.

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Neon Postgres** (pooled connection) via **Prisma**
- **Tailwind CSS** + shadcn-style UI components
- **SheetJS (`xlsx`)** for data-only Excel exports
- Single-user **password gate** (Next.js middleware + httpOnly session cookie)

## The discipline (server-enforced validation)

1. A bug ticket can't be **FIXED**/**CLOSED** unless **both** gates
   (User Error / Parameter, and RD) are resolved *and* a root cause is set.
2. An implementation test can't be **PASSED** if any test case is **FAIL** or
   **NOT_RUN**.
3. An implementation test can't be **PASSED** without at least one
   **Negative / Boundary** test case (forces edge testing).

These are enforced in `src/lib/validation.ts` and surfaced as inline errors.

## Local setup

```bash
cp .env.example .env         # fill in DATABASE_URL, APP_PASSWORD, SESSION_SECRET
npm install
npx prisma migrate dev       # creates tables (needs a reachable Postgres)
npm run dev
```

Open http://localhost:3000 and sign in with `APP_PASSWORD`.

## Environment variables

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Neon **pooled** connection string (host contains `-pooler`). Required. |
| `DIRECT_URL` | Neon non-pooled URL, used only by `prisma migrate`. |
| `APP_PASSWORD` | The single-user login password. **Required — the app is public without it.** |
| `SESSION_SECRET` | Long random string used to sign the session cookie. |

## Deploying to Vercel + Neon

1. Push this repo to GitHub and import it into **Vercel**.
2. In the Vercel dashboard: **Storage → Marketplace → Neon**, create a database.
   Vercel injects the connection strings — set **`DATABASE_URL` to the pooled
   URL** (the one whose host contains `-pooler`). Serverless functions exhaust
   direct connections, so the pooled URL is required.
3. Set `DIRECT_URL` to the non-pooled Neon URL (for migrations), plus
   `APP_PASSWORD` and `SESSION_SECRET`.
4. Run migrations against the database once:
   ```bash
   DATABASE_URL=... DIRECT_URL=... npx prisma migrate deploy
   ```
   (or `npx prisma db push` for the initial schema).
5. Deploy. `npm run build` runs `prisma generate` automatically.

## Data model

- `BugTicket` — flat; bug checks live on the row (single user, no need to normalize).
- `ImplementationTest` — parent.
- `TestCase` — child (one-to-many). The three on-screen grids (progression /
  regression / negative-boundary) are this table filtered by `type`.

## Exports (data-only `.xlsx`)

- **Single bug ticket** → one sheet, field/value layout (`/api/export/bug/[id]`).
- **Single implementation test** → summary sheet + one sheet per test-case type
  (`/api/export/test/[id]`).
- **Bulk report** → one Summary sheet listing all bugs and all tests
  (`/api/export/bulk`).

## Project layout

```
src/
  app/
    (app)/            # authenticated pages (nav layout)
      page.tsx        # home
      bugs/           # bug list + editor
      tests/          # implementation test list + editor
      dashboard/      # counts
    login/            # password gate page
    api/
      auth/           # login / logout
      bugs/           # bug CRUD
      tests/          # implementation test CRUD (+ nested test cases)
      export/         # xlsx exports
  components/         # forms + shadcn-style ui
  lib/                # prisma, enums, validation, export, auth, parsing
  middleware.ts       # auth gate
prisma/schema.prisma  # models + enums
```
