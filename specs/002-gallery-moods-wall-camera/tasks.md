---
description: "Task list for Gallery, Moods, Wall and In-Page Camera — grouped by the ownership blocks plan.md defines"
---

# Tasks: Gallery, Moods, Wall and In-Page Camera

**Input**: Design documents from `/specs/002-gallery-moods-wall-camera/`

**Prerequisites**: [plan.md](./plan.md) (required — Contracts, Data, Ownership and Merge order), [spec.md](./spec.md) (required — the four user stories), `docs/REPLICATION-PROMPT.md` §6, §7 and §10 (required reading — see the plan)

**Tests**: Test tasks are **mandatory**. Constitution Principle I is non-negotiable here, and FR-030 and SC-010 make the ordering checkable in the git history: **every task below commits its failing test first, on its own commit, with a message starting `test:`**, then the code that turns it green.

## Do not regenerate this file

These groups are the **ownership blocks** of `plan.md`, not user stories, and
that is deliberate. The blocks are what make five people on five branches safe:
no file appears in two ownership lists, and every cross-block call is pinned in
the plan's Contracts section before either side is written. Regenerating the
split from `spec.md` would produce a story-shaped breakdown that loses the
ownership lists, and the parallelism with it.

Each task still carries its `[US#]` tag, so traceability back to `spec.md` is
intact. The five blocks run **in parallel with each other** once the shared work
below is in `develop`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: runs in parallel with the other `[P]` tasks **inside its own block** — different files, no dependency between them
- **[Story]**: `[US1]` gallery, `[US2]` emotions and levels, `[US3]` wall and publishing, `[US4]` in-page camera
- Every task names exact file paths

## The test-first rule, concretely

Each task is two commits, in this order:

```bash
git commit -m "test: <what the test asserts>"   # red — the suite fails here
git commit -m "feat: <what makes it pass>"      # green
```

A task whose test was written after its code asserts what the code happens to
do, not what the spec requires. It does not count as done, and the git log shows
it.

## Path Conventions

Single Next.js application at the repository root: `app/`, `components/`,
`hooks/`, `lib/`, `test/`, `e2e/` and `proxy.js`. See the plan's Project
Structure.

---

## En `develop`, antes de ramificar

**⚠️ BLOQUEA A LOS CINCO BLOQUES.** Nobody branches until every task here is
merged into `develop`. This lands the two shared modules `plan.md` names — the
only application code more than one block imports — plus the test doubles four
blocks consume and the one-line route change.

**After this merges, `lib/emotions.js` and `lib/generations.js` are frozen. No
block adds a symbol to either.** A block that needs something more from them
stops and agrees it in `develop`.

*Owns*: `lib/emotions.js`, `lib/emotions.test.js`, `lib/generations.js`,
`lib/generations.test.js`, `test/mongo-fake.js`, `test/mongo-fake.test.js`,
`test/msw/handlers.js`, `test/msw/handlers.test.js`, `test/fixtures.js`,
`proxy.js`.

- [X] T001 [P] [US2] Test-drive `lib/emotions.js` in `lib/emotions.test.js`: `EMOTIONS` is exactly `["happy","angry","sad"]` in that order, `LEVELS` is exactly `["a bit","quite","very"]` in that order, `LEVELLED` is exactly `["angry","sad"]`; `buildHint` returns each of the **seven** strings in the plan's table character for character; and it throws `Unknown emotion`, `Unknown level` and `happy takes no level`, each carrying `.status === 400`. Assert an eighth hint string is unreachable (SC-003). Commit red as `test: emotions module composes seven hints and rejects everything else`, then implement the module. The three emoji live in this file and nowhere else
- [X] T002 [P] [US1] [US3] Extend `test/mongo-fake.js` behind tests in `test/mongo-fake.test.js`: a chainable `find(filter).sort(spec).skip(n).limit(n).toArray()`, and `insertOne` assigning a real `ObjectId` with `_id` compared through `.equals()` rather than `===`. **Stay backward compatible** — 001's dashboard still calls `countDocuments` with an exact-match and a `{ $gte }` filter, and those tests must not move. Commit red as `test: mongo fake supports sorted paged reads and ObjectId ids`, then extend the fake. Without the `.equals()` change every `findOne({ _id })` silently misses and `setPublished` answers `"not-found"` for documents that exist (plan trap 4)
- [X] T003 [US1] [US3] Test-drive `lib/generations.js` in `lib/generations.test.js` against the fake from T002 — depends on T002. Cover: `PAGE_SIZE === 12`; `listByUser` returns only the given user's documents, newest first, and never another user's (SC-001); the `{ createdAt: -1, _id: -1 }` sort; `limit = PAGE_SIZE + 1` producing `hasMore`; a page past the last one returning `{ items: [], hasMore: false }` and **not** an error; `listPublic` returning only `isPublic: true` documents and excluding every other one; the `Item` mapper's read-time defaults — a pre-002 document maps to `emotion: null`, `level: null`, `isPublic: false`, a pending video maps to `url: null`, `createdAt` is an ISO string, and **`userId` never appears on an `Item`**; and `setPublished` returning `"ok"`, `"not-found"` for an unknown id, an unparseable id **and a document owned by somebody else** (asserting that document is left byte-identical, SC-005), `"not-ready"` when publishing a non-`ready` document, and `"ok"` when unpublishing one at any status. Commit red as `test: generations module pages by user, pages public, and flips the published flag`, then implement it
- [X] T004 [P] [US1] [US2] [US3] Extend `test/fixtures.js` with three fixtures matching the plan's `Item` shape: a ready image carrying an emotion and a level, a pending video with `url: null`, and a pre-002 record with no emotion and no flag. No test of its own — the fixtures are asserted by every block that consumes them
- [X] T005 [P] [US1] [US2] [US3] Extend `test/msw/handlers.js` and `test/msw/handlers.test.js` with handlers for `GET /api/gallery`, `GET /api/wall` and `POST /api/generation/:id/publish`, and change the `POST /api/image` handler to read `{ photo, emotion, level }` instead of `{ photo, hint }`. Write them **field by field against the plan's HTTP table**, including the status codes — Bloques A and B test against these handlers and never against the routes, so a handler that disagrees with its contract gives green tests and a broken app. Commit red as `test: msw handlers cover the gallery, wall and publish contracts`, then write the handlers
- [X] T006 [P] [US1] Test-drive the one-line change in `proxy.js`: an anonymous request to `/gallery` is protected, `/wall` stays public exactly like the landing route and is **never** added to the protected matcher (FR-018), and 001's three protected routes are unchanged. Commit red as `test: gallery requires a session and the wall does not`, then add `"/gallery(.*)"` to `isProtectedRoute`

**Checkpoint**: `npm run lint && npm test && npm run build` green on `develop`.
The two module surfaces are now frozen. The five blocks may branch and start.

---

## Bloque A — Pantallas de listado

**Goal**: `/gallery` and `/wall`, each rendering its first page on the server and
asking for the next only when the viewer does.

**Independent Test**: with `@/lib/generations.js` mocked and every HTTP call
served by MSW, both screens render their first page, "Load more" appends the
second, and no backend code from this feature exists.

*Owns*: `app/gallery/page.jsx`, `app/gallery/page.test.jsx`, `app/wall/page.jsx`,
`app/wall/page.test.jsx`, `components/gallery/GenerationCard.jsx`,
`components/gallery/GenerationCard.test.jsx`, `components/gallery/GalleryList.jsx`,
`components/gallery/GalleryList.test.jsx`, `components/gallery/PublishToggle.jsx`,
`components/gallery/PublishToggle.test.jsx`, `components/gallery/index.js`,
`components/wall/WallList.jsx`, `components/wall/WallList.test.jsx`,
`components/wall/index.js`, `components/Nav.jsx`, `components/Nav.test.jsx`.

*Never touches*: `app/api/`, `app/capture/`, `components/capture/`, `e2e/`,
`lib/`, `test/`, `app/globals.css`.

*Imports*: `lib/generations.js` (Server Components, **first page only**) and
`components/ui/*`. **Imports nothing from `app/api/` and no symbol from any other
block.** Pages two and beyond go through the plan's HTTP contract, mocked with
MSW until Bloque C merges.

- [X] T007 [P] [US1] Test-drive `components/gallery/GenerationCard.jsx` in its colocated test: an image entry renders its `url` as its own kind, a `pending` video entry renders `StatusBadge variant="pending"` reading `Rendering` and **no player** (FR-004), an entry with an emotion and a level renders both verbatim in separate elements, an entry with an emotion and no level renders no level, and a pre-002 entry with neither **renders without an emotion label rather than failing** (FR-005). Commit red as `test: generation card renders images, pending videos and missing emotions`, then implement it. Render the stored strings verbatim — no emoji, no lookup table, no import of `lib/emotions.js`
- [X] T008 [P] [US3] Test-drive `components/gallery/PublishToggle.jsx`: it reads `Publish` when the item is not public and `Unpublish` when it is; activating it posts `{ isPublic }` to `/api/generation/{id}/publish` and flips its label on a `200`; a non-`200` leaves the label where it was, re-enables the control and **shows no message**; and it renders nothing for an item whose status is not `ready` (FR-016). Commit red as `test: publish toggle posts the flag and flips on success`, then implement it against the MSW handler from T005
- [X] T009 [US1] Test-drive `components/gallery/GalleryList.jsx` — depends on T007. It is seeded from props and **fetches nothing on mount** (assert zero requests reached MSW after render); clicking `Load more` calls `GET /api/gallery?page=1` and appends the result; the control disappears when `hasMore` is false; and it renders `Nothing here yet.` with a link `Capture something` to `/capture` when there are no items (FR-007). `useState` and `fetch` only — no data-fetching library, no state manager, no `useEffect` that fetches. Commit red as `test: gallery list loads more on demand and never on mount`, then implement it. It renders `PublishToggle` for each item
- [X] T010 [US1] Test-drive `app/gallery/page.jsx` as an **async Server Component** — depends on T009. `vi.mock` both `@/lib/generations.js` and `@clerk/nextjs/server`, then `render(await GalleryPage())` (plan trap 2). Assert the heading `Gallery`, that `listByUser` was called with the session's `userId` and page `0`, that **no HTTP request left the render** (FR-006, SC-006), and that the empty state appears when the module returns no items. Commit red as `test: gallery renders its first page on the server`, then implement it
- [X] T011 [P] [US3] Test-drive `components/wall/WallList.jsx`: seeded from props, nothing on mount, `Load more` calling `GET /api/wall?page=1` and appending, the control disappearing when `hasMore` is false, the empty state reading `Nothing published yet.`, and **no `PublishToggle` anywhere on the wall**. It reuses `GenerationCard` from `components/gallery/` rather than duplicating it — both directories are this block's. Commit red as `test: wall list loads more on demand and shows no publish control`, then implement it
- [X] T012 [US3] Test-drive `app/wall/page.jsx` as an async Server Component — depends on T011. Assert the heading `Wall`, that it calls `listPublic(0)` directly, that it **never calls `auth()` and never redirects** (FR-018, SC-004), that a render with no session produces the same output as one with a session, and the empty state. Commit red as `test: wall renders its first page on the server with no session`, then implement it
- [X] T013 [P] [US1] [US3] Test-drive `components/Nav.jsx` in the new `components/Nav.test.jsx`: a `Gallery` link to `/gallery` and a `Wall` link to `/wall` sit beside the existing `Capture` link, and the admin-only `Dashboard` link still appears only for an admin. Commit red as `test: nav links to the gallery and the wall`, then add the two links. 001 shipped this file with no colocated test — this task creates one
- [X] T014 [US1] [US3] Re-export this block's components from `components/gallery/index.js` and `components/wall/index.js`, then widen both screens to `md:` and `lg:`. Assert what FR-029 requires and 001 already tests elsewhere: no horizontal scroll at 360px, every control at least 44px tall with a visible focus ring, body text clearing 4.5:1 on every surface step, and **no raw palette hex outside `app/globals.css`** — this block does not edit that file. Run `react-doctor`

**Checkpoint**: every scenario in User Stories 1 and 3 that lives on a screen has
a test that failed before its implementation, and the suite is green with no
network.

---

## Bloque B — Pantallas de captura

**Goal**: the ten moods become three emotions with levels, and the capture screen
grows a live camera preview beside the file picker that still works.

**Independent Test**: open capture against MSW, confirm three emotions with
`happy` preselected and no level selector, pick `angry`, confirm `quite` is
preselected, generate, and confirm the request body carried
`{ emotion: "angry", level: "quite" }`. Then stub a denied camera and confirm the
file picker still completes a generation with no error shown.

*Owns*: `app/capture/page.jsx`, `app/capture/page.test.jsx`, `app/phase2.test.jsx`,
`components/capture/EmotionPicker.jsx`, `components/capture/EmotionPicker.test.jsx`,
`components/capture/CameraCapture.jsx`, `components/capture/CameraCapture.test.jsx`,
`components/capture/HintInput.jsx` (deleted), `components/capture/PhotoInput.jsx`,
`components/capture/PhotoPreview.jsx`, `components/capture/GeneratedResult.jsx`,
`components/capture/index.js`.

*Never touches*: `app/api/`, `app/gallery/`, `app/wall/`, `components/gallery/`,
`components/wall/`, `components/Nav.jsx`, `e2e/`, `lib/`, `test/`,
`app/globals.css`.

*Imports*: `lib/emotions.js` (`EMOTIONS`, `LEVELS`, `LEVELLED` — the defaults are
`EMOTIONS[0]` and `LEVELS[1]`) and `components/ui/*`. **`buildHint` is never
called on the client**: the screen posts `emotion` and `level` and the server
composes the string. `POST /api/image` is mocked with MSW until Bloque D merges.

- [ ] T015 [P] [US2] Test-drive `components/capture/EmotionPicker.jsx`: it offers exactly three emotions with `happy` selected by default and **no free-text alternative**; `happy` shows **no** level selector; selecting `angry` or `sad` reveals a level selector offering exactly `a bit`, `quite`, `very` with `quite` preselected; switching back to `happy` removes the level selector **and clears the level** (FR-013); the labels are `Emotion` and `Level`; and each option's value equals its label. Assert the lists come from `lib/emotions.js` rather than being retyped. Commit red as `test: emotion picker offers three emotions and a level on two of them`, then implement it
- [ ] T016 [P] [US4] Test-drive `components/capture/CameraCapture.jsx` with a stubbed `navigator.mediaDevices` (plan trap 1 — the property is **absent** in jsdom, so define it, and give the fake `MediaStream` tracks a `stop()` spy): turning the camera on calls `getUserMedia` with `facingMode: "environment"` and renders a live preview **inside the page**; taking the photo produces a `File` (plan trap 3 — `canvas.toBlob` gives a `Blob`, convert it at the boundary) and **stops every track**; unmounting stops every track (FR-025, SC-008); switching cameras stops the previous stream's tracks before the new preview appears (FR-026); and a rejected `getUserMedia` or an absent `mediaDevices` renders **no error text at all** (FR-024). Controls read `Turn camera on`, `Take photo`, `Switch camera`, `Turn camera off`. Commit red as `test: camera previews in page, hands back a file and always releases`, then implement it. The release-on-unmount is a `useEffect` cleanup — the one place this feature takes that ceiling, and it is commented where it is taken
- [ ] T017 [US2] Change `app/capture/page.test.jsx` first, then `app/capture/page.jsx` — depends on T015. The existing assertion that the mood string reaches `body.hint` becomes: the request body is `{ photo, emotion, level }`, `level` is **omitted** when the emotion is `happy`, and `hint` is gone from the body entirely. Then delete `components/capture/HintInput.jsx` and update `components/capture/index.js` to drop `HintInput` and export `EmotionPicker`. The ten withdrawn moods are **deleted, not hidden** (Principle III). Commit red as `test: capture posts an emotion and a level instead of a hint`, then make it pass
- [ ] T018 [US4] Wire `CameraCapture` into `app/capture/page.jsx` — depends on T016 and T017. Test first: a photo taken from the preview becomes the selected photo through **the same handler `PhotoInput` uses**, so the preview shows it and `Generate` enables exactly as with a picked file (FR-022); picking a file afterwards replaces it, matching 001's existing replace behaviour (US4 scenario 9); and the file picker alone still completes a generation (FR-023). Commit red as `test: a taken photo is indistinguishable from a picked file`, then wire it
- [ ] T019 [US2] Update `app/phase2.test.jsx` — depends on T017. Its capture-flow case asserts the ten-mood selector and `I am feeling happy 😊` as a select value; it becomes the three-emotion control. Its landing-screen case is untouched. Commit red as `test: phase 2 integration asserts the three-emotion control`, then confirm green with no further source change — if this needs code, T017 was incomplete
- [ ] T020 [US2] [US4] Test the paused path in `app/capture/page.test.jsx`, then fix `app/capture/page.jsx` if it catches anything — depends on T018. With `POST /api/image` answering `503`, the paused banner still renders (001's behaviour, unchanged), **and** the camera still turns on, the preview still works, a photo can still be taken and the file picker still works (FR-027, FR-028, SC-009). Assert zero requests left the page while the camera was used. Commit red as `test: the camera works while generation is paused`, then fix whatever it catches
- [ ] T021 [US2] [US4] Widen the new controls in `app/capture/page.jsx`, `components/capture/EmotionPicker.jsx` and `components/capture/CameraCapture.jsx` to `md:` and `lg:`, and assert FR-029 for them: no horizontal scroll at 360px, 44px minimum height and a visible focus ring on the emotion select, the level select and every camera control, body text clearing 4.5:1. Run `react-doctor`

**Checkpoint**: every scenario in User Stories 2 and 4 that lives on a screen has
a test that failed before its implementation, and the suite is green with no
camera and no network.

---

## Bloque C — API de lectura

**Goal**: the two paged read endpoints the listing screens call for pages two and
beyond.

**Independent Test**: both routes pass with no keys, no network and no database,
against a mocked `lib/generations.js` and a mocked Clerk.

*Owns*: `app/api/gallery/route.js`, `app/api/gallery/route.test.js`,
`app/api/wall/route.js`, `app/api/wall/route.test.js`.

*Never touches*: any screen, any component, `app/api/image/`, `app/api/video/`,
`app/api/settings/`, `app/api/generation/`, `lib/`, `test/`, `e2e/`.

*Imports*: `lib/generations.js` (`listByUser`, `listPublic`) and
`@clerk/nextjs/server` (`auth`, in the gallery route only). **No symbol from any
other block.** Both routes are thin: validate `page`, check the session where the
contract says to, call the module, serialise. **No query logic lives in these
files** — it is all in `lib/generations.js`, already in `develop`.

- [ ] T022 [P] [US1] Test-drive `app/api/gallery/route.js`: `200 { items, hasMore, page }` with `page` defaulting to `0`; `?page=2` reaching `listByUser` as the integer `2`; `400 Invalid page` for `?page=abc` and for a negative page (plan trap 6 — a `NaN` that becomes `skip: NaN` returns an empty page that looks like the end of the list); `401 Unauthorized` when `auth()` yields no `userId`, **checked by the route itself and not trusted to the route matcher** (FR-003); `listByUser` always called with the session's own `userId` and never with one from the request (FR-002, SC-001); and a page past the last one returning `200` with an empty `items` array rather than an error. Commit red as `test: gallery endpoint pages the caller's own generations and refuses anonymous callers`, then implement it
- [ ] T023 [P] [US3] Test-drive `app/api/wall/route.js`: `200 { items, hasMore, page }` **with no session at all** — assert the route never calls `auth()`, never returns `401` and never redirects (FR-018, SC-004); `?page=N` and the same `400 Invalid page` rule; `listPublic` called with the page and nothing else; only published generations in the response; and an empty page past the end. Commit red as `test: wall endpoint serves published generations to a caller with no session`, then implement it
- [ ] T024 [US1] [US3] Run this block's whole suite with no keys, no network and no database, and confirm green. Then confirm by inspection what the tests cannot: neither route imports `lib/db.js`, neither builds a Mongo filter, and neither contains a `sort`, `skip` or `limit` — a query that has drifted into a route belongs in `lib/generations.js`, which is frozen, so it stops and gets raised in `develop`

**Checkpoint**: both read endpoints match the plan's HTTP table row for row.

---

## Bloque D — API de escritura

**Goal**: the publish flag, and the one 001 endpoint this feature changes.

**Independent Test**: every route passes with no keys, no network and no
database, against mocked providers, a mocked `lib/generations.js` and the
in-memory collection. Publishing as a non-owner leaves the stored record
byte-identical.

*Owns*: `app/api/generation/[id]/publish/route.js`,
`app/api/generation/[id]/publish/route.test.js`, `app/api/image/route.js`,
`app/api/image/route.test.js`, `app/api/phase3.test.js`.

*Never touches*: any screen, any component, `app/api/gallery/`, `app/api/wall/`,
`app/api/video/`, `app/api/settings/`, `lib/`, `test/`, `e2e/`.

*Imports*: `lib/emotions.js` (`buildHint`), `lib/generations.js`
(`setPublished`), and 001's `lib/db.js`, `lib/settings.js`, `lib/higgsfield.js`
and `lib/blob.js` — all already in `develop`, all mocked in its tests. **No
symbol from any other block.**

- [ ] T025 [US2] Change `app/api/image/route.test.js` first, then `app/api/image/route.js`. Fix the handler order — `auth` → parse → `buildHint(emotion, level)` → `assertEnabled()` → store the photo → generate → store the result → insert → respond — and assert it: the request body is `{ photo, emotion, level? }` and `hint` is no longer read; `400` carrying `Unknown emotion`, `Unknown level` or `happy takes no level` **with zero calls to any paid provider** (FR-011, SC-002); **a `400` wins over a `503`** when generation is paused, and that path contacts no provider either (FR-028); a happy request sends exactly `I am feeling happy 😊` to the provider, unchanged from 001; and `200 { imageUrl }`, `401`, `503` and `500` are otherwise untouched. Commit red as `test: image endpoint validates the emotion before it spends anything`, then implement it
- [ ] T026 [US2] Assert in `app/api/image/route.test.js` the record `app/api/image/route.js` writes: it gains `emotion`, `isPublic: false` at insert, and `level` **only** when the emotion is in `LEVELLED` — a happy record carries no `level` key at all (FR-012, FR-014). Commit red as `test: a generation records its emotion, its level and a false published flag`, then make it pass
- [ ] T027 [P] [US3] Test-drive `app/api/generation/[id]/publish/route.js`: `200 { id, isPublic }` for an owner publishing a `ready` generation; **idempotent** — publishing an already-public one is a `200` no-op, not an error; `400 Invalid isPublic` when the field is missing or not a boolean; `401 Unauthorized` with no session; `404 Not found` for an unknown id, an unparseable id **and a generation owned by somebody else**, asserting in that last case that the stored document is unchanged (FR-015, SC-005); `409 Generation is not ready` when publishing something whose status is not `ready` (FR-016); and unpublishing succeeding at any status (FR-017). Commit red as `test: publish endpoint flips the flag only for the owner of a ready generation`, then implement it. The route holds **no ownership check of its own** — the check is the `userId` inside `setPublished`'s filter, and the route only maps `"ok"` → `200`, `"not-found"` → `404`, `"not-ready"` → `409`. A `404` for a non-owner is the same non-disclosure pattern 001's `/api/settings` uses; do not "fix" it to a `403` (plan trap 5)
- [ ] T028 [US2] [US3] Update `app/api/phase3.test.js` — depends on T025. Its image case posts `hint: "happy"`; it becomes `{ emotion: "happy" }`. The video, status and file cases are untouched, because this feature does not change those routes. Then run this block's whole suite with no keys, no network and no database and confirm green. Commit red as `test: phase 3 integration posts an emotion`, then confirm no further source change is needed

**Checkpoint**: every write path matches the plan's HTTP table, and no invalid
input reaches a paid provider.

---

## Bloque E — Extremo a extremo

**Goal**: the two claims no unit test can make — that a stranger reaches the wall
and that a stranger does not reach the gallery.

**Independent Test**: `npm run test:e2e` against a dev server, with **no
credentials of any kind**.

*Owns*: `e2e/landing.spec.js` (001's existing smoke spec, unchanged),
`e2e/wall.spec.js`, `e2e/gallery-requires-session.spec.js`.

*Never touches*: anything outside `e2e/`. `playwright.config.js` is unchanged and
owned by nobody.

**The test-first rule applies literally here, and it is not a formality**: these
specs are written and committed **red** during the parallel window, because the
routes they drive do not exist in `develop` yet. They go green at the merge. That
is exactly the ordering Principle I asks for, and the git log will show it.

Both specs are credential-free by design. Signing a Playwright browser into Clerk
needs real keys, and Principle II's spirit — a suite that runs on a fork with no
secrets — is worth more here than an authenticated journey the Vitest suite
already covers at the component level.

- [ ] T029 [P] [US3] Write `e2e/wall.spec.js` and commit it red: a browser with **no session** opens `/wall`, the `Wall` heading is visible, the URL is still `/wall`, and it was never redirected to `/sign-in` (SC-004). Commit as `test: a visitor with no session reaches the wall`
- [ ] T030 [P] [US1] Write `e2e/gallery-requires-session.spec.js` and commit it red: a browser with no session opens `/gallery` and lands on `/sign-in`, proving the route side of FR-003 in a real browser rather than against a mocked matcher. Commit as `test: a visitor with no session is sent from the gallery to sign-in`
- [ ] T031 [US1] [US2] [US3] [US4] After the last block merges, run `npm run test:e2e` against `develop` for `e2e/landing.spec.js`, `e2e/wall.spec.js` and `e2e/gallery-requires-session.spec.js`. All three specs — 001's landing spec included, unchanged — must be green on the merge commit. A failure here is a merge defect, not an e2e defect: fix it where it belongs, not in `e2e/`

**Checkpoint**: three green Playwright specs on the merge commit, with no
environment variables set.

---

## Dependencies & Execution Order

### Block order

- **En `develop`, antes de ramificar**: no dependencies — start immediately. **BLOCKS all five blocks**
- **Bloques A, B, C, D and E**: all depend on that shared work and on nothing else. They run fully in parallel, on five branches, because their ownership lists are disjoint

### Cross-block dependencies

There are none at build time, only at merge time. That is the point of the
plan's Contracts section:

- **A** imports `lib/generations.js` for its two server renders — already in `develop` before it branches — and mocks `GET /api/gallery`, `GET /api/wall` and `POST /api/generation/:id/publish` with MSW for everything else
- **B** imports `lib/emotions.js` — already in `develop` — and mocks `POST /api/image` with MSW
- **C** and **D** import `lib/generations.js` and `lib/emotions.js` — already in `develop` — and import nothing from each other
- **E** imports nothing at all; it drives the running application

**No block imports a symbol from another block.** A screen that needs an endpoint
mocks it against the plan's HTTP table until the merge.

### Within each block

- The failing test is committed before the code that passes it, always, on its own `test:` commit
- Presentational components before the lists that compose them, lists before the server pages that seed them
- The library module before the route that calls it — which is why both modules are in `develop` before anyone branches

### Parallel Opportunities

- T001, T002, T004, T005 and T006 run in parallel in the shared work; only T003 waits, on T002
- T007, T008, T011 and T013 run in parallel inside Bloque A
- T015 and T016 run in parallel inside Bloque B
- T022 and T023 run in parallel inside Bloque C
- T027 runs in parallel with T025 inside Bloque D
- T029 and T030 run in parallel inside Bloque E
- **The five blocks in full**, one agent each, is the design of this plan

## Merge order into `develop`

Fixed by `plan.md` and repeated here because it is what the last three tasks
depend on:

**shared work → C → D → A → B → E**

The rule is: **`develop`'s HEAD must be a runnable application after every
merge.**

1. **The shared work first, alone.** Two blocks import each module and four
   import the test doubles. Branching earlier means five people writing against a
   moving surface
2. **C before A.** A's `Load more` passes on MSW alone, but the moment A is in
   `develop` a real click needs `/api/gallery` and `/api/wall` to exist
3. **D before B.** B posts `{ photo, emotion, level }`. If B merged first,
   `develop`'s `/api/image` would still be reading `hint` and every generation in
   the merged app would fail
4. **C before D.** Both are independent, so the order is ours to pick: C touches
   no 001 file at all, while D edits `app/api/image/route.js` and
   `app/api/phase3.test.js`. The first API merge should not be the one that can
   conflict
5. **A before B.** Their files are disjoint, so either order is safe; A goes
   first because A owns `components/Nav.jsx` and the two routes it links to
6. **E last, always.** Run before A, C and the proxy change are in `develop`, the
   e2e specs fail for reasons that are not theirs

After E merges: `npm run lint && npm test && npm run test:e2e && npm run build`,
then `npm run docs:appendix` and commit the regenerated appendix (Principle VI).
Raise `.react-doctor-baseline` to the merged score; never lower it.

## Parallel Example: five agents, one per block

```bash
git worktree add ../bloque-a -b 002-bloque-a
git worktree add ../bloque-b -b 002-bloque-b
git worktree add ../bloque-c -b 002-bloque-c
git worktree add ../bloque-d -b 002-bloque-d
git worktree add ../bloque-e -b 002-bloque-e

# then, one per worktree:
/speckit-implement T007    # agente A — pantallas de listado
/speckit-implement T015    # agente B — pantallas de captura
/speckit-implement T022    # agente C — API de lectura
/speckit-implement T025    # agente D — API de escritura
/speckit-implement T029    # agente E — extremo a extremo
```

Every worktree branches from `develop` **after** the shared work has merged into
it. No file appears in two ownership lists, so no two agents can conflict.

## Implementation Strategy

### MVP First

1. The shared work — the two frozen modules
2. Bloques C and A — the gallery and the wall, read-only
3. **STOP and VALIDATE**: a signed-in user sees their own generations newest
   first, and a stranger sees the wall. That is User Story 1 delivered, and it is
   useful with nothing else in this feature built

### Incremental Delivery

Bloque D adds publishing, which is what puts anything on the wall at all.
Bloque B adds the three emotions and the camera. Bloque E is the gate before any
deploy of a parallel build — T031 is the only place a merge defect between a
screen and the route it mocked gets caught in a real browser.

### Solo Strategy

Working alone, run the blocks in the merge order above and ignore the worktrees.
The ownership lists cost nothing when one person holds all of them, and they
still document what a change is allowed to touch.

## Notes

- `[P]` means different files and no dependency, **inside one block**. When in doubt, leave it off
- The `[US#]` tags map each task to `spec.md`; the blocks map to file ownership. Both are load-bearing
- Two commits per task: `test:` red, then the code green. Verify the test fails before implementing
- No block edits `app/globals.css`, `package.json`, `vitest.config.mjs` or anything in the plan's "owned by nobody" list. A block that needs a change there **raises it in `develop`. It does not commit it**
- Read `docs/REPLICATION-PROMPT.md` §10 and the plan's own six traps before starting, not after
