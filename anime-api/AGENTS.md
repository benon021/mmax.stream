# AGENTS.md — hianime-api

Bun + Hono + TypeScript REST API that scrapes **zangetsu.cc** (cheerio + its JSON ajax APIs) and returns JSON. No database.

## Commands (use `bun`, not npm/node)

- Install: `bun install` (lockfile: `bun.lock`, use `--frozen-lockfile` in CI/Docker)
- Dev (hot reload): `bun run dev` | Prod local: `bun start`
- Lint (auto-fixes): `bun run lint` | Format: `bun run format` | Check: `bun run format:check`
- Typecheck: `bun run type-check` (`tsc --noEmit`)
- Tests: `bun run test` (vitest, `scripts/tests/vitest/**`) · `bun run test:jest` (jest, `scripts/tests/jest/**`) · `bun run test:all` (both — this is what CI runs)
- Single test file: `bunx vitest run scripts/tests/vitest/controllers/comprehensive.test.ts`
- CI gate (`.github/workflows/release.yml`): `bun run lint` + prettier check + `bun run test:all` on push to `main`/`master` (docs-only changes skipped). Prettier check is `continue-on-error`; lint and tests are blocking.
- WARNING: `bun run lint`/`format` rewrite files in place — never run them repo-wide to "check" things; scope to changed files (`bunx eslint <files>`, `bunx prettier --check <files>`) or you will dirty unrelated files.

## Entrypoints — keep in sync

- `index.ts` → `src/app.ts` : local/Docker (`Bun.serve`). `api/index.ts` : Vercel serverless (`handle(app)` from `hono/vercel`, rewritten via `vercel.json`). Both wire CORS + `src/routes/routes.ts` + error handling; editing one usually means editing the other.
- Port truth is `src/config/config.ts` (`port: 5000`). README (3030) and Dockerfile `EXPOSE 3000` are stale — trust the config file.

## Architecture

`src/routes/routes.ts` → `src/controllers/*.controller.ts` → `src/extractor/extract*.ts` (cheerio or JSON mapping) → `src/types/anime.ts`

- Scrape target is hardcoded in `src/config/config.ts` (`baseurl: https://zangetsu.cc`, plus `cdnApi`, `embedCdn`, `flixera` hosts). No `.env` loading — edit the file directly.
- Two fetch paths:
  - `src/services/axiosInstance.ts` — plain `fetch` (despite the name, not the `axios` package) with retry/backoff, 10s timeout, 429 handling. Used for HTML pages and token-free ajax (`/ajax/search`, `/ajax/schedule`, `/ajax/schedules`, `/ajax/filter`).
  - `src/services/zangetsu.ts` — `zangetsuAjax()` bootstraps a session (GET any page → scrape `window.AJAX_TOKEN` + session cookies) then calls token-protected JSON endpoints (`/ajax/episodes`, `/ajax/server`). Never call those two paths without it — they return `Forbidden`.
- `buildEmbedUrl()` in `zangetsu.ts` mirrors the watch page's `loadPlayer()` JS: `s-1`/default → flixera, `s-2` → `cdn.4animo.xyz/embed/hd-1`, `s-3` → `.../hd-2`. If site embed logic changes, re-read the watch page script.
- Controllers return **raw data only**; `src/utils/handler.ts` wraps every route result into `{ success: true, data }`. Don't double-wrap.
- Errors: throw `AppError`/`NotFoundError`/`validationError` (note lowercase `v`) from `src/utils/errors.ts`; they map to `{ success: false, message, details }` via `src/utils/response.ts`.

## Source quirks (zangetsu.cc specifics)

- Numeric site ids are always the last `-` segment (`one-piece-12` → `12`); `animeNumId()` helper does this. Episode ids from `/ajax/episodes` are global numerics (e.g. `"1"`), used as `:episodeId` for `/servers/:episodeId`.
- Characters full list comes from a different host: `GET https://cdnanimo.xyz/anime/<numId>/characters` (public, no token), paginated client-side in the controller. Character/VA ids are numeric (`character:1480`, `people:7111`); `/character/:id` maps `:` → `/`.
- `/filter` page renders results client-side: no-keyword filtering must use `GET /ajax/filter?...` JSON (`extractFilterResults`), but `keyword` searches still scrape the `/search` HTML page. Genre values are display names (`genres=Action,Martial Arts` — see `genreNames` in `src/utils/filter.ts`), dates split into `sy/sm/sd` + `ey/em/ed`.
- Homepage: trending is the custom `#tl-trending` widget (not `#trending-home`); featured blocks are `.anif-blocks .row .anif-block` with no `#anime-featured` ancestor; spotlight "Watch Now" links are `/watch/<id>?ep=N` — always strip the query and prefer the Detail link for the anime id.
- zangetsu HTML is pretty-printed — trim text nodes in extractors (selectors mostly mirror the old aniwatch theme, with `src`/`data-src` fallbacks).

## Route pitfalls

- All API routes live under `/api/v2` (`app.route('/api/v2', hiAnimeRoutes)`); health check is `GET /ping` at root.
- Specific routes must stay before generic ones in `routes.ts`: `/filter/options` before `/filter`, and `/animes/:query/:category?` catches anything under `/animes/`.
- New endpoint recipe: extractor in `src/extractor/` + controller in `src/controllers/` + `router.get(...)` in `routes.ts` wrapped with `handler(...)`.

## Tests

- All tests mock network (`axiosInstance`, `zangetsuAjax`, or global `fetch`) with fixtures from `scripts/tests/data/mocks.ts` — no live network needed. Never hit the real scrape target from tests.
- Vitest and jest suites mirror each other (`extractors/comprehensive`, `controllers/comprehensive`); if you add coverage, add it in both `scripts/tests/vitest/` and `scripts/tests/jest/`.
- NOTE: jest runs as ESM — `jest.mock()` module factories do NOT apply; mock at the `global.fetch` level with `mockResolvedValueOnce` chains instead (see episodes/servers tests).

## Style

- Prettier: single quotes, semicolons, 100-char width, 2-space, `arrowParens: avoid` (`bun run format` before PRs — but scope it to your files, see warning above).
- ESLint: `no-console` is off (logging is idiomatic here), `no-explicit-any` and unused vars are warnings (`_`-prefixed args ignored).
