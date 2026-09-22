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
2. An implementation test can't be **PASSED** if any scenario is **FAIL**.
3. An implementation test can't be **PASSED** without at least one
   **Negative / Boundary** scenario (forces edge testing).
4. **Completeness:** an implementation test can't be **PASSED** while any
   scenario is still **Not run**, and any scenario marked **N/A** must record a
   reason — so skipping a scenario is always deliberate, never forgotten.

These are enforced in `src/lib/validation.ts` and surfaced as inline errors.

## Checklist-driven testing (not just data entry)

Implementation tests are a guided checklist, not a blank grid:

- **Built-in QA checklist** — every new test auto-seeds the standard scenario
  types (happy path, boundary min/max, empty/null, invalid format, duplicates,
  permissions, concurrency, inclusion/exclusion rules, …) from
  `src/lib/checklist.ts`. Each seeded row starts as *Not run* and must be
  resolved.
- **Guided "run" mode** (`/tests/[id]/run`) — steps through one scenario at a
  time with a progress bar and one-click verdicts (Pass / Fail / Blocked / N/A),
  saving each verdict as you go.
- **AI suggestions** (optional) — the *Suggest scenarios* button reads the
  feature description and proposes extra feature-specific edge cases to add.
  Requires `ANTHROPIC_API_KEY`; disabled gracefully without it.

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
| `DATABASE_URL_UNPOOLED` | Neon non-pooled URL, used only by `prisma migrate`. Auto-injected by Neon's Vercel integration. |
| `APP_PASSWORD` | The single-user login password. **Required — the app is public without it.** |
| `SESSION_SECRET` | Long random string used to sign the session cookie. |
| `ANTHROPIC_API_KEY` | Optional. Enables the AI *Suggest scenarios* button. |
| `ANTHROPIC_MODEL` | Optional. Model for AI suggestions (default `claude-opus-5`). |

## Deploying to Vercel + Neon

1. Push this repo to GitHub and import it into **Vercel**.
2. In the Vercel dashboard: **Storage → Marketplace → Neon**, create a database
   and **Connect** it to the project. This auto-injects `DATABASE_URL` (pooled)
   and `DATABASE_URL_UNPOOLED` (direct) as environment variables.
3. Add two more environment variables: `APP_PASSWORD` and `SESSION_SECRET`.
4. Deploy. The build runs `prisma generate && prisma migrate deploy && next build`,
   so the schema is created/updated automatically on every deploy — no manual
   migration step needed.

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
