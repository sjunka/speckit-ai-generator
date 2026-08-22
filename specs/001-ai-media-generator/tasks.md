---
description: "Task list for AI Media Generator — converted from REPLICATION-PROMPT.md §9"
---

# Tasks: AI Media Generator

**Input**: Design documents from `/specs/001-ai-media-generator/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), `docs/REPLICATION-PROMPT.md` §6, §7 and §10 (required reading — see the plan)

**Tests**: Test tasks are included and are **mandatory** here. Constitution Principle I makes test-first non-negotiable for this feature: commit the failing test, then the code that passes it.

## Do not regenerate this file

These phases are grouped by **file ownership**, not by user story, and that is
deliberate. The ownership blocks are what make three agents on three branches
safe: no file appears in two lists, and every cross-phase call is pinned in the
plan's Contracts section before either side is written. Regenerating the split
from `spec.md` would produce a story-shaped breakdown that loses the ownership
tables, and the parallelism with it.

Each task still carries its `[US#]` tags, so traceability back to the spec is
intact. Fases 2, 3 and 4 run **in parallel with each other** after Fase 1
lands. Fase 5 is the merge.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task serves (US1–US4), or blank for foundational work
- Include exact file paths in descriptions

## Path Conventions

Single Next.js application at the repository root. `app/`, `components/`,
`hooks/`, `lib/`, `test/`, `e2e/`, and `proxy.js` at the root. See the plan's
Project Structure section.

---

## Fase 1 — La base

**Sergio.** Crea el proyecto y las piezas compartidas que las demás fases
necesitan. **⚠️ BLOQUEA A TODOS**: ninguna otra fase puede empezar hasta que
esta esté en `main`.

*Owns: everything not owned by Fases 2, 3 and 4.*

Nothing outside this phase edits `package.json`, `vitest.config.mjs`,
`vitest.setup.js`, `next.config.mjs`, `jsconfig.json`, `postcss.config.mjs` or
`eslint.config.mjs`. A later phase that needs a change there raises it instead
of committing it.

- [X] T001 Scaffold into a subdirectory and move the files up — `create-next-app` refuses a directory holding `docs/`, and npm rejects a package name starting with a period (see trap 1):

  ```bash
  npx create-next-app@latest scaffold --js --app --tailwind --eslint \
    --no-src-dir --import-alias "@/*" --use-npm --skip-install
  rm -rf scaffold/.git scaffold/AGENTS.md scaffold/CLAUDE.md scaffold/README.md
  mv scaffold/app scaffold/public .
  mv scaffold/.gitignore scaffold/package.json scaffold/next.config.mjs \
     scaffold/jsconfig.json scaffold/postcss.config.mjs scaffold/eslint.config.mjs .
  rm -rf scaffold
  mv app/layout.js app/layout.jsx && mv app/page.js app/page.jsx

  # create-next-app deja "name": "scaffold" en package.json — corrígelo
  npm pkg set name=ia-generator

  npm i @clerk/nextjs mongodb @vercel/blob
  npm i -D vitest @testing-library/react @testing-library/user-event \
           @testing-library/jest-dom jsdom msw @playwright/test
  ```

  Renaming the two scaffold pages to `.jsx` matters: it means Fase 2 and Fase 4 edit files that already exist instead of racing to create them.

- [X] T002 Add `dev`, `build`, `start`, `lint`, `test` (`vitest run`), `test:watch`, `test:e2e` and `docs:appendix` scripts to `package.json`. Write `vitest.config.mjs` and `vitest.setup.js` per the plan **now, not later** — Fases 2–5 must be able to run a test from their first minute. Take `next.config.mjs`, `jsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`, `playwright.config.js`, `doctor.config.json` and `.gitignore` from `docs/REPLICATION-APPENDIX.md` verbatim; `next.config.mjs` carries the `images.remotePatterns` entry without which no generated image renders (trap 13). The `.mjs` extension on the Vitest config matters, and the `@` alias must be set there because Vitest ignores `jsconfig.json` (trap 8). → verify: `npm test` runs and reports no tests; `npm run build` passes
- [X] T003 Strip the scaffold's placeholder styles and markup from `app/globals.css` and `app/page.jsx`. Write the token tests **first** — canvas is `#010102`, the surface ladder resolves, no raw lavender hex outside `globals.css` — then land the `@theme` block from REPLICATION-PROMPT.md §6 in `app/globals.css`. → verify: token tests green
- [X] T004 Load Inter and JetBrains Mono through `next/font/google` and implement the eleven type-scale classes from §6 as component classes in `app/globals.css`. Test the tracking values and that no display weight exceeds 600
- [X] T005 Write `app/layout.jsx`: `ClerkProvider`, `<html className="dark …">`, viewport metadata, manifest link, `bg-canvas text-ink` on the body. Test that a light `prefers-color-scheme` changes nothing
- [X] T006 Build `components/ui/*` per §6 — `Button` (primary/secondary/tertiary), `TextInput`, `StatusBadge`, `Card`, `Spinner`, and the six inline 20×20 stroke icons — re-exported from `components/ui/index.js`, plus `components/Nav.jsx`. Each variant, the focus ring and the 44px height under test. Copy the icon path data from the appendix; hand-drawn replacements will not match. Destructure `className` and append it — never spread `{...props}` after it (trap 16)
- [X] T007 [P] Write `public/manifest.json`. The three icons are **binary and cannot come from the appendix** — copy them from `assets/` in this repo: `cp assets/icon-192.png assets/icon-512.png public/ && cp assets/favicon.ico app/`. Test the manifest shape and that `app/layout.jsx` links it
- [X] T008 [P] Write the shared doubles the later phases consume: `test/msw/handlers.js` against the plan's HTTP table (there is **no** `test/msw/server.js` — each test that needs MSW builds its own server from `handlers`), `test/mongo-fake.js` (`findOne`, `insertOne`, `updateOne`, `countDocuments`, under 40 lines — not `mongodb-memory-server`), `test/fixtures.js`, a 360px viewport render helper, and a contrast check asserting body text clears 4.5:1 on the canvas and every surface step
- [X] T009 Write `.github/workflows/ci.yml` on push and pull request: `npm ci` → `npm run lint` → `npx -y react-doctor@latest . --score` compared against a committed `.react-doctor-baseline` → `npm test`. Establish the baseline **after** the shell exists, not on the bare scaffold (trap 12). Committed values are `.react-doctor-baseline` = `55` and `doctor.config.json` turning off `react-doctor/effect-needs-cleanup`. → verify: the workflow passes with no environment variables set, and fails both when a test fails and when the score drops

**Checkpoint**: `npm run lint && npm test && npm run build` green, CI green, and Fases 2, 4 and 5 can each `npm ci` and run a test. They may now start in parallel.

---

## Fase 2 — Las pantallas

**Goal**: Every screen the user touches, talking to the API only through `fetch` against Fase 1's MSW handlers.

**Independent Test**: The whole capture-to-result journey works against mock handlers with no backend code written and no network available.

*Owns: `app/page.jsx`, `app/sign-in/[[...sign-in]]/page.jsx`, `app/capture/page.jsx`, `app/result/[jobId]/page.jsx`, `components/capture/*`, `components/result/*`, `hooks/*`, `proxy.js`, and the colocated tests.*
*Never touches: `lib/`, `app/api/`, `app/dashboard/`.*

- [ ] T010 [US1] Test-drive `proxy.js` at the repository root: anonymous requests to capture, result and dashboard are protected, the landing route stays public, and a signed-in visitor at `/` is redirected to `/capture`. Then implement it with `clerkMiddleware` and `createRouteMatcher(["/capture(.*)", "/result(.*)", "/dashboard(.*)"])`. Next 16 renamed `middleware.js` to `proxy.js` and the export with it — a file called `middleware.js` is silently ignored (trap 2). Take the matcher regex from the appendix; it is a long negative pattern, not a route list (trap 14)
- [ ] T011 [US1] Build `app/page.jsx` at 360px first, then widened. Assert the hero, the single sentence, exactly one call to action, and that no features grid, FAQ or pricing exists
- [ ] T012 [P] [US1] Build `app/sign-in/[[...sign-in]]/page.jsx` from Clerk's hosted `<SignIn>` with `forceRedirectUrl="/capture"`, centred on the canvas. No hand-written credential form
- [ ] T013 [US1] Build the photo half of `app/capture/page.jsx` and `components/capture/PhotoInput.jsx`, `PhotoPreview.jsx`, `HintInput.jsx`: the file input's `accept` and `capture` attributes, the preview appearing, a second photo replacing the first, generate disabled without a photo, and the ten moods from §7 verbatim with the first selected by default. `userEvent.upload` doesn't wait for jsdom's async `FileReader.readAsDataURL` — wrap the preview assertion in `waitFor` (trap 19)
- [ ] T014 [US1] Build the generation half of `app/capture/page.jsx` plus `hooks/useElapsedSeconds.js`: the progress state, the image appearing in place, the mood reaching the request body, the failure message with the photo still selected, and a `503` rendering the paused banner rather than an error (trap 10). `useState` and `fetch` only — no data-fetching library. Reset the counter in the effect's cleanup, not its body (trap 18)
- [ ] T015 [US2] Build `components/capture/GeneratedResult.jsx` and the handoff: no make-video control before an image exists; once activated, a job starts and the router pushes `/result/{jobId}`
- [ ] T016 [US2] [US3] Build `app/result/[jobId]/page.jsx` and `components/result/*`: polling with fake timers — 3s between responses, stopping on `ready`, on `failed`, on `404` and on unmount — then playback, download, Web Share with its `navigator.canShare` feature detection, and both failure messages. Poll with a `setTimeout` chain, never `setInterval` (trap 11), and abort with an `AbortController` on unmount. A non-404 error response is not a job state: keep polling. `params` on a dynamic route arrives as a Promise even in a client component (trap 17) — don't `use(params)` here, it suspends and needs a `<Suspense>` boundary this page doesn't have; resolve it with `useEffect` + `Promise.resolve(params).then(setJobId)` and hold the polling until `jobId` is set. `<video>` has no implicit ARIA role in Testing Library — `getByRole("video")` never matches; give it a `data-testid` instead (trap 20)
- [ ] T017 Widen every screen in this phase to desktop with `md:` and `lg:` prefixes. Run `react-doctor`

**Checkpoint**: every scenario in User Stories 1, 2 and 3 has a test that failed before its implementation, and the suite is green with no network.

---

## Fase 3 — El backend

**Goal**: The pipeline behind the screens: photo in, image out, video out, stored and recorded.

**Independent Test**: Every route and library module passes with no keys, no network and no database, against mocked providers and the in-memory collection.

*Owns: `lib/db.js`, `lib/blob.js`, `lib/higgsfield.js`, `app/api/image/route.js`, `app/api/video/route.js`, `app/api/video/[id]/route.js`, `app/api/video/[id]/file/route.js`, and their tests.*
*Never touches: any screen, `app/dashboard/`, `app/api/settings/`.*
*Imports `lib/settings.js` and `lib/models.js` by their Contracts signatures — mock them until Fase 4 lands. Vitest resolves ES imports against the real filesystem before `vi.mock` runs, so "mock it" means: create a physical stub file at that exact path with the Contracts signature (comment it `// stub, Fase 4 replaces this`), and let every test override it with `vi.mock`. This is expected to collide with Fase 4's real file in T031 — see that task.*

- [X] T018 [P] Test-drive `lib/db.js`: the client is cached on `globalThis` and a second call constructs nothing. Then implement it and `generations()`
- [X] T019 [P] Implement `lib/blob.js`: `store` puts to Vercel Blob and returns the public URL, with a **dev-only** fallback writing to `public/uploads` when there is no token and `NODE_ENV !== "production"`. Comment the ceiling — Vercel's filesystem is ephemeral and a photo stored this way is unreachable by the provider unless the dev server is tunnelled (trap 5)
- [X] T020 Implement `lib/higgsfield.js` per the plan's Contracts: one `call` helper carrying the auth header and turning a non-2xx into an `Error` with `.status`, plus `submit`, `requestStatus`, `generateImage` (inline polling every 2s up to 60 attempts, then fetch the bytes), `startVideo` and `getVideo`. Two details the prose used to leave out and that both rehearsal agents got wrong: the provider **wraps its assets** — read `status.images?.[0]?.url` and `status.video?.url`, never the bare element (trap 21) — and the poll **throws on exhaustion** (`Image provider timed out`) and on a missing URL (`Image provider returned no image`), because reading `images` after a loop that never completed crashes as `fetch(undefined)` and blames the wrong thing (trap 22). Whatever stands in for the provider in these tests answers with that same wrapped shape — a mock returning `images: ["url"]` makes the suite green against a provider that does not exist, which is exactly how this reached a real API key. Cover both throws with a test. Assert the reference model and both prompt strings — `soul/standard` is text-to-image and silently drops the photo (trap 4)
- [X] T021 [US1] Implement `app/api/image/route.js`, every scenario: photo with a mood, photo without one, the `generations` record and its fields, `401` for an anonymous caller with no provider touched, and a provider failure producing a non-2xx and no `ready` record. Order inside the handler: auth, `assertEnabled`, store the photo, generate, store the result, insert, return.
- [X] T022 [US2] Implement `app/api/video/route.js`: `200 { jobId }` with a pending record carrying the provider job id and the source URL, the quality read from settings, `401` for an anonymous caller
- [X] T023 [US2] Implement `app/api/video/[id]/route.js`: pending; first completion persisting the URL and returning it; a second read served from the record **without** re-querying the provider; failure updating the record; `404` for an unknown job; and a normal read while the kill switch is off — the switch stops new generation, it does not hide existing jobs
- [X] T024 [US3] Implement `app/api/video/[id]/file/route.js`: stream the stored video through this origin so the browser can build a shareable `File` — the provider's URL has no CORS headers, which is the entire reason this route exists (trap 6). `404` when the record or its URL is missing
- [X] T025 Run this phase's whole suite with no keys and no network. Confirm green

**Checkpoint**: every media-pipeline scenario has a test that failed first.

---

## Fase 4 — El dashboard

**Goal**: The owner's two levers against a runaway bill, plus the accounts that make the product run for real.

**Independent Test**: As the owner, toggle generation off and confirm the next generation call is refused; toggle it back on and confirm it resumes — no redeploy.

*Owns: `lib/settings.js`, `lib/models.js`, `app/api/settings/route.js`, `app/dashboard/page.jsx`, `components/dashboard/*`, `.env.local.example`, and their tests.*
*Never touches: `lib/db.js`, `lib/higgsfield.js`, any generation route, any screen from Fase 2.*
*Imports `lib/db.js` by its Contracts signature and `components/ui/*` from Fase 1 — mock `db` until Fase 3 lands. Same rule as Fase 3's stubs: Vitest needs the file to physically exist before `vi.mock` can replace it, so write a real stub at `lib/db.js` (Contracts signature, comment it as replaceable) rather than relying on an in-memory-only mock.*

- [ ] T026 [P] [US4] Write `lib/models.js`: the two per-asset cost constants, fixed in the module, never fetched
- [ ] T027 [US4] Test-drive `lib/settings.js`: `getSettings` returning the stored record and defaulting to `{ enabled: true, videoQuality: "lite" }` when none exists; `assertEnabled` throwing a `503 "Generation is paused"` when disabled and passing through otherwise; `isOwner` comparing against `OWNER_ID`
- [ ] T028 [US4] Implement `app/api/settings/route.js` for `GET` and `PATCH`: an owner's partial update persisting one field and leaving the other untouched; the first write creating the record with the documented default for the other field; `404` for a signed-in non-owner and for an anonymous caller. Keep `_id` out of `$set` — MongoDB rejects updating it (trap 9)
- [ ] T029 [US4] Build `app/dashboard/page.jsx` and `components/dashboard/*` at 360px first: exactly the four things from §7, the switch reflecting stored state, a non-owner receiving a 404 page that discloses no values, and the page still loading while generation is off. Guard on `sessionClaims?.publicMetadata?.role === "admin"`. Counters come from `countDocuments`. "Generations today" needs `test/mongo-fake.js` to support a `{ $gte }` range filter (it only did exact-match) — extend it, stay backward compatible. Widen to three columns at `md:`. Run `react-doctor`
- [ ] T030 [US4] Set up the real accounts — the one task that touches them. Write `.env.local.example` from §4 verbatim (the appendix's `.gitignore` already carries `!.env.local.example`/`!.env*.example` so it commits cleanly — if your `.gitignore` doesn't have those two lines, T002 didn't copy the appendix verbatim; fix that first), then set up and document in the README: **Clerk** (application, Google and email sign-in, keys, `publicMetadata.role = "admin"` on the owner and that user's id in `OWNER_ID`), **MongoDB Atlas** (free M0 cluster, database `ia-generator`, network access `0.0.0.0/0` because Vercel Hobby has no fixed egress IP — never commit the connection string), **Vercel Blob** (a store and its read-write token), **Higgsfield** (key and secret, model ids checked against the explore page). → verify by hand with `.env.local` filled in: `/dashboard` renders for the admin user and 404s for a second non-admin user; toggling the switch off makes the next generate call return `503`; toggling it back on restores it

**Checkpoint**: every cost-controls scenario has a test that failed first, and the manual key check passes.

---

## Fase 5 — Juntar todo

**Santiago.** Junta las cuatro mitades en una sola aplicación.

**Purpose**: Make the four halves one application. This is where a parallel build actually fails, so it is a real phase and not a formality.

*Runs after Fases 2, 4 and 5. Owns nothing new.*

- [ ] T031 Merge the branches. Expected conflicts: `package.json` where a phase added a dependency (obvious resolution), plus `lib/settings.js`, `lib/models.js` and `lib/db.js` — each exists twice, once as the other phase's stub and once as its real implementation. Keep the real implementation (Fase 4's `settings.js`/`models.js`, Fase 3's `db.js`), discard the stub
- [ ] T032 **Reconcile `test/msw/handlers.js` against the routes that actually shipped.** This is the one real risk in a parallel build: Fase 2 tested against handlers, not against Fase 3's code, so a handler that disagrees with its route gives green tests and a broken app. Walk the plan's HTTP table field by field
- [ ] T033 Run `npm run lint && npm test && npm run build`. Fix what the merge broke and nothing else
- [ ] T034 Delete what the merge orphaned — mocks for modules that now exist, stub files, unused imports. Do not touch code the merge did not orphan
- [ ] T035 [P] Add `e2e/landing.spec.js` (the landing page loads and its call to action reaches sign-in) and `playwright.config.js` pointing at `npm run dev`
- [ ] T036 Run `react-doctor` over the merged repository and raise the committed `.react-doctor-baseline` to the merged score. Never lower it. Confirm CI is green
- [ ] T037 Walk the product by hand on a phone: landing → sign-in → photo → image → video → download, without a keyboard except at sign-in. Install it to the home screen on iOS and Android and confirm it opens without browser chrome
- [ ] T038 Run the exactness check: copy `scripts/build-appendix.mjs` into the repository, run `npm run docs:appendix`, then `diff docs/REPLICATION-APPENDIX.md <the original appendix>`. Every difference is either a file that is wrong or a deliberate change — there is no third case, so resolve each one explicitly. An empty diff is the definition of done
- [ ] T039 Deploy. Vercel's Git integration handles it — put the eight environment variables in the project settings and let a green CI run gate the deploy. Do not hand-roll a deploy step

**Checkpoint**: lint, tests, `react-doctor` and the build are green on the merge commit, and the hand walk-through works against real providers.

---

## Dependencies & Execution Order

### Orden de las fases

- **Fase 1 (la base)**: no dependencies — start immediately. **BLOCKS everything below**
- **Fases 2, 3 and 4**: all depend on Fase 1 and on nothing else. They may run fully in parallel, on separate branches, because their ownership lists are disjoint
- **Fase 4 (el merge)**: depends on Fases 2, 3 and 4 all being complete

### Cross-phase dependencies

There are none at build time, only at merge time. That is the point of the
plan's Contracts section:

- Fase 3 imports `lib/settings.js` and `lib/models.js` by signature and mocks them until Fase 4 lands
- Fase 4 imports `lib/db.js` by signature and mocks it until Fase 3 lands
- Fase 2 never imports `lib/` at all — it only calls `fetch`, against Fase 1's handlers

### Within each phase

- The failing test is committed before the code that passes it, always
- Library modules before the routes that use them
- Routes before the screens are reconciled against them (at T032, not before)

### Parallel Opportunities

- T007 and T008 run in parallel inside Fase 1
- T012 runs in parallel with T011 inside Fase 2
- T018 and T019 run in parallel at the start of Fase 3
- T026 runs in parallel with T027 at the start of Fase 4
- **Fases 2, 3 and 4 in full**, one agent each, is the design of this plan

## Parallel Example: three agents after Fase 1

```bash
git worktree add ../frontend  -b 001-frontend
git worktree add ../backend   -b 001-backend
git worktree add ../dashboard -b 001-dashboard

# then, one per worktree:
/speckit-implement T010    # agent A works Fase 2
/speckit-implement T018    # agent B works Fase 3
/speckit-implement T026    # agent C works Fase 4
```

No file appears in two ownership lists, so no two agents can conflict.

## Implementation Strategy

### MVP First

1. Fase 1 — the shell
2. Fases 2 and 3 — capture through result, front and back
3. **STOP and VALIDATE**: a user can photograph something, get an image, get a video, and download it
4. Deploy. The product is useful without the dashboard

### Incremental Delivery

Fase 4 adds the owner's cost controls on top of a working product. Fase 5 is
required before any deploy of a parallel build, because T032 is the only place
the handler-versus-route mismatch gets caught.

### Solo Strategy

Working alone, run the phases in numeric order and ignore the worktrees. The
ownership blocks cost nothing when one person holds all of them, and they still
document what a change is allowed to touch.

## Notes

- `[P]` means different files and no dependency. When in doubt, leave it off
- The `[US#]` tags map each task to `spec.md`; the phases map to file ownership. Both are load-bearing
- Commit after each task, or after a logical group within one task
- Verify tests fail before implementing
- Read `docs/REPLICATION-PROMPT.md` §10 before starting. Sixteen traps, each of which cost an hour the first time
