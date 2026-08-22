# Implementation Plan: Gallery, Moods, Wall and In-Page Camera

**Branch**: `002-gallery-moods-wall-camera` | **Date**: 2026-08-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-gallery-moods-wall-camera/spec.md`

**Note**: This plan **reuses the architecture of
[`specs/001-ai-media-generator/plan.md`](../001-ai-media-generator/plan.md)** and
does not propose a different one. Same Next.js app at the repository root, same
Clerk, same `generations` collection in Mongo, same Vercel Blob, same Vitest and
Playwright. No data-fetching library and no state library are added. `develop`
already carries the complete 001 MVP.

Do not regenerate this file from the spec. The Contracts and the Ownership
sections below are what let five people work in parallel without a merge
conflict, and a regenerated plan would re-derive them differently.

## Required reading before any task

Everything 001's plan listed as required reading still applies. Read it before
writing code:

| Source | What it pins |
|---|---|
| `docs/REPLICATION-PROMPT.md` §6 | Token values, the eleven type classes, the primitive list |
| `docs/REPLICATION-PROMPT.md` §7 | Every copy string the 001 tests assert |
| `docs/REPLICATION-PROMPT.md` §10 | Sixteen traps that each cost an hour |
| `specs/001-ai-media-generator/plan.md` | The module and HTTP contracts this feature extends |

New screens use **only** the eleven type classes and the tokens already in
`app/globals.css`. No block edits `app/globals.css`. A block that believes it
needs a new token stops and raises it in `develop` (Principle IV plus the
shared-file rule below).

## Summary

Four capabilities on top of the shipped product: a private gallery, three
emotions with levels replacing 001's ten moods, a publish flag feeding a public
wall, and an in-page camera preview beside the existing file picker.

Two new screens (`/gallery`, `/wall`), three new API routes, one changed API
route, one changed capture screen. Delivered as **one blocking phase in
`develop`** that lands the two modules more than one block imports, then **five
disjoint ownership blocks** — one owner each — merged back in a fixed order.

The listing screens render their **first page on the server**, calling the query
module directly. Only pages two and beyond are HTTP calls.

## Technical Context

**Language/Version**: JavaScript on Node. No TypeScript. Unchanged from 001

**Primary Dependencies**: Unchanged from 001 — Next.js 16.3 App Router on
Turbopack, React 19.2, Tailwind v4 in CSS, `@clerk/nextjs` 7.x, `mongodb` 7.x
driver with no Mongoose, `@vercel/blob`, Higgsfield. **No dependency is added by
this feature.** `package.json` is not edited by any block

**Storage**: MongoDB Atlas, database `ia-generator`, collection `generations`
gains three fields (see Data). No new collection. Binary assets stay in Vercel
Blob

**Testing**: Vitest 4 with Testing Library, jsdom and MSW for screens; `vi.mock`
plus `test/mongo-fake.js` for routes and library modules. Playwright for the
end-to-end specs. The browser camera API is stubbed on `navigator.mediaDevices`
— jsdom does not implement it

**Target Platform**: Mobile web first, 360px viewport. Unchanged from 001

**Project Type**: Single Next.js application at the repository root. Unchanged

**Performance Goals**: A listing screen's first page is one database round trip
inside the server render — no client fetch on mount, at any collection size.
Full Vitest suite green in under 60 seconds

**Constraints**: The suite runs with no credentials, no database and no network.
Every control at least 44px tall. Body text clears 4.5:1. No screen scrolls
horizontally at 360px. No `max-width` media queries

**Scale/Scope**: Page size is **12**. Two new screens, three new routes, one
changed route, one changed screen, two new library modules

**Unknowns**: none. The spec closed every decision, and this plan pins the rest
(page size, field names, copy strings, error codes). There is no
NEEDS CLARIFICATION in this document.

## Constitution Check

*GATE: passed before design. Re-checked after design — no principle moved.*

| Principle | Verdict | How this plan satisfies it |
|---|---|---|
| I. Test-First | **PASS** | Every block's tasks state the failing test before the code. FR-030 and SC-010 make the git ordering checkable |
| II. The Suite Runs Offline | **PASS** | Same two seams as 001. Screens mock the HTTP contract below with MSW and never import `app/api/`. Routes mock `lib/` and use `test/mongo-fake.js`. The camera is a `navigator.mediaDevices` stub, not a device |
| III. Build Only What Is Listed | **PASS** | Three routes, two screens, no moderation, no likes, no profiles, no delete, no backfill, no free-text emotion, no scaffolding for a fourth emotion. The ten moods are **deleted**, not hidden |
| IV. Tokens Are The Theme | **PASS** | No block edits `app/globals.css`. New screens reuse existing tokens and the eleven type classes |
| V. File Ownership Defines Parallelism | **PASS** | Five blocks, disjoint file-by-file ownership lists below. Everything more than one block imports lands in `develop` before anyone branches, and its surface is frozen at that moment |
| VI. The Appendix Wins | **PASS** | `npm run docs:appendix` is re-run and committed after the last merge |

## Contracts

Pinned before anything is written. These are what let five people work in
parallel: a block writes against the signature, the file it calls arrives later
on another branch, they meet at the merge.

### Shared modules — land in `develop` BEFORE anyone branches

Exactly two application modules are imported by more than one block. Both are
written, tested and merged into `develop` **first**. **After branching, no block
adds a symbol to either module.** A block that needs something more from them
stops and agrees it in `develop`.

#### `lib/emotions.js` — imported by Bloque B and Bloque D

```js
export const EMOTIONS = ["happy", "angry", "sad"];  // render order; EMOTIONS[0] is preselected
export const LEVELS   = ["a bit", "quite", "very"]; // render order; LEVELS[1] ("quite") is preselected
export const LEVELLED = ["angry", "sad"];           // the emotions that take a level

// Composes the single hint string sent to the provider.
// Throws Error with .status = 400 on every invalid combination.
export const buildHint = (emotion, level) => string;
```

`buildHint` is the **only** validator. Its rules and its exact outputs:

| Input | Result |
|---|---|
| `("happy")` or `("happy", undefined)` | `"I am feeling happy 😊"` |
| `("angry", "a bit" \| "quite" \| "very")` | `"I am feeling a bit angry 😠"` etc. |
| `("sad", "a bit" \| "quite" \| "very")` | `"I am feeling a bit sad 😢"` etc. |
| emotion not in `EMOTIONS` | throws `Error("Unknown emotion")`, `.status = 400` |
| emotion in `LEVELLED`, level not in `LEVELS` (including absent) | throws `Error("Unknown level")`, `.status = 400` |
| `("happy", anything not undefined)` | throws `Error("happy takes no level")`, `.status = 400` |

Seven hint strings exist and no eighth is reachable (SC-003). The three emoji
live inside this module and nowhere else.

#### `lib/generations.js` — imported by Bloque A, Bloque C and Bloque D

> The spec's division of labour named C and D as its importers. Bloque A also
> imports it, because its two Server Components render the first page by calling
> it directly rather than over HTTP (see Server-first rendering). That is why the
> module lands in `develop` before anyone branches, and why its surface is frozen
> there.

```js
export const PAGE_SIZE = 12;

// Newest first. page is a 0-based integer. Returns { items, hasMore }.
export const listByUser = async (userId, page = 0) => ({ items: Item[], hasMore: boolean });
export const listPublic = async (page = 0)         => ({ items: Item[], hasMore: boolean });

// Flips the published flag. Returns one of exactly three strings.
export const setPublished = async (id, userId, isPublic) => "ok" | "not-found" | "not-ready";
```

`Item` — the one shape every listing produces, on the server and over HTTP
alike:

```js
{
  id: string,        // the document _id, stringified
  kind: "image" | "video",
  status: "pending" | "ready" | "failed",
  url: string | null,     // null while a video is still rendering
  emotion: string | null, // null on every record created before this feature
  level: string | null,   // null when the emotion carries no level
  isPublic: boolean,      // always present; a document without the field reads false
  createdAt: string       // ISO 8601
}
```

`Item` **never carries `userId`**. The wall discloses no author and there is no
profile page.

Pagination, fixed here so both endpoints and both server renders behave
identically: sort `{ createdAt: -1, _id: -1 }` (the `_id` tiebreaker keeps paging
stable), `skip = page * PAGE_SIZE`, `limit = PAGE_SIZE + 1`; `hasMore` is
`docs.length > PAGE_SIZE`; `items` is the first `PAGE_SIZE` mapped through the
shape above. A page past the last one returns `{ items: [], hasMore: false }` —
an empty page, never an error.

`listByUser` filters `{ userId }`. `listPublic` filters `{ isPublic: true }`.
Neither ever reads the whole collection.

`setPublished` resolves in this order, and non-existence and non-ownership are
deliberately indistinguishable:

```js
const _id = toObjectId(id);                       // invalid id shape → "not-found", never a 500
if (!_id) return "not-found";
const doc = await collection.findOne({ _id, userId });  // wrong owner → "not-found"
if (!doc) return "not-found";
if (isPublic && doc.status !== "ready") return "not-ready";
await collection.updateOne({ _id }, { $set: { isPublic } });
return "ok";
```

The `userId` in the `findOne` filter is what makes a non-owner's attempt leave
the record byte-identical (SC-005). Unpublishing is allowed at any status —
readiness is checked only when publishing (FR-016 and FR-017).

### HTTP

**Screens call `fetch` and never import `lib/` or anything under `app/api/`.**
This table is the seam, and it is what the MSW handlers are written against.
Bloques A and B program against this table and mock it; they do not wait for
Bloques C or D.

#### New: `GET /api/gallery` — Bloque C

| | |
|---|---|
| Query | `?page=N`, `N` a 0-based integer. Absent means `0` |
| Auth | **Required.** The route calls `auth()` itself and does not trust the route matcher (FR-003) |
| `200` | `{ items: Item[], hasMore: boolean, page: number }` — the caller's own generations only |
| `400` | body `Invalid page` — `page` present and not a non-negative integer |
| `401` | body `Unauthorized` — no session |
| `500` | body is the error message |

#### New: `GET /api/wall` — Bloque C

| | |
|---|---|
| Query | `?page=N`, same rule |
| Auth | **None. There is no `401` row and its absence is deliberate** (FR-018). A sessionless visitor gets `200` |
| `200` | `{ items: Item[], hasMore: boolean, page: number }` — published generations only, from every user |
| `400` | body `Invalid page` |
| `500` | body is the error message |

#### New: `POST /api/generation/[id]/publish` — Bloque D

| | |
|---|---|
| Body | `{ isPublic: boolean }` — one route serves publish and unpublish |
| Auth | **Required**, self-checked |
| `200` | `{ id, isPublic }`. Idempotent: publishing an already-public generation is a `200` no-op, not an error |
| `400` | body `Invalid isPublic` — the field is missing or not a boolean |
| `401` | body `Unauthorized` |
| `404` | body `Not found` — unknown id, unparseable id, **or a generation belonging to somebody else**. The two cases are not distinguished on purpose |
| `409` | body `Generation is not ready` — publishing something whose status is not `ready` |
| `500` | body is the error message |

#### Changed: `POST /api/image` — Bloque D

The **only** change to a 001 endpoint.

| | 001 | 002 |
|---|---|---|
| Request | `{ photo, hint? }` | `{ photo, emotion, level? }` — `photo` is still a `data:` URL. **`hint` is removed from the request and is no longer read** |
| Response `200` | `{ imageUrl }` | `{ imageUrl }` — unchanged |
| `400` | — | **new.** Body is `Unknown emotion`, `Unknown level` or `happy takes no level`, straight from `buildHint` |
| `401` / `503` / `500` | unchanged | unchanged |

Handler order, fixed: `auth` → parse body → `buildHint(emotion, level)` →
`assertEnabled()` → store the photo → generate → store the result → insert →
respond. **Validation precedes the spend switch**: an invalid emotion is a `400`
even while generation is paused, and neither path contacts a paid provider
(FR-011, FR-028).

The inserted record gains `emotion`, `level` (written only when the emotion
carries one) and `isPublic: false` — see Data.

#### Untouched

`POST /api/video`, `GET /api/video/[id]`, `GET /api/video/[id]/file` and
`GET|PATCH /api/settings` are unchanged and appear in no ownership list. A video
record therefore carries **no** emotion, and its gallery entry renders without an
emotion label — which is exactly the behaviour FR-005 already requires of every
pre-002 record.

### Data

One database, `ia-generator`. **No new collection.** `settings` is unchanged.

`generations` — one document per asset. The three new fields are the last three:

```js
// image, created by POST /api/image after this feature
{
  userId, kind: "image", status: "ready", url, createdAt,
  emotion: "happy" | "angry" | "sad",   // NEW — always written
  level:   "a bit" | "quite" | "very",  // NEW — written only when emotion is in LEVELLED
  isPublic: false                       // NEW — written false at insert
}

// video, created by POST /api/video — unchanged by this feature
{ userId, kind: "video", status: "pending", jobId, sourceUrl, createdAt }
// gains url and becomes "ready" or "failed" on the first status read that sees
// a terminal provider state, exactly as in 001

// created before this feature — no migration, no backfill
{ userId, kind, status, url, createdAt }
```

The read-time defaults are the whole migration story (FR-014, and the spec's
Assumptions):

| Field | Absent from the document | Read as |
|---|---|---|
| `emotion` | pre-002 records, every video record | `null` — the entry renders with no emotion label, never an error |
| `level` | happy records, pre-002 records, video records | `null` — no level is displayed |
| `isPublic` | every pre-002 record | `false` — not published, and therefore never on the wall |

Nothing is published retroactively and no document is rewritten to add a field.
The defaults live in `lib/generations.js`'s mapper and nowhere else.

**Indexes**: none is added. The collection is small enough that the two sorted
paged reads run without one, and adding an index the product cannot yet justify
is scaffolding (Principle III). This is a deliberate ceiling — see Complexity
Tracking.

### Server-first rendering

**A listing screen reads its first page on the server. Nothing fetches on
mount.** This is what decides which part of Bloque A depends on Bloque C and
which part does not.

| Screen | First page | Pages 2..n |
|---|---|---|
| `/gallery` | `app/gallery/page.jsx` is an **async Server Component**. It calls `auth()` from `@clerk/nextjs/server` for the `userId` and then `listByUser(userId, 0)` **directly** — no `fetch`, no HTTP, no `/api/gallery` | The client list component calls `GET /api/gallery?page=N` **on the "Load more" click only** |
| `/wall` | `app/wall/page.jsx` is an **async Server Component** calling `listPublic(0)` **directly**. It requires no session and does not call `auth()` | The client list component calls `GET /api/wall?page=N` on the click only |

So: **Bloque A depends on `lib/generations.js` (already in `develop`) for the
first page, and on Bloque C's contract — not Bloque C's code — for the rest.** A
mocks `GET /api/gallery` and `GET /api/wall` with MSW and imports nothing from
`app/api/`. Its server components are tested by `vi.mock`ing `@/lib/generations.js`
and `@clerk/nextjs/server`, awaiting the page function and rendering what it
returns.

There is no `useEffect` that fetches, on either screen. The client list holds
`items`, `page` and `hasMore` in `useState`, seeded from the server component's
props, and appends on each successful load. `useState` and `fetch`, nothing more
— no data-fetching library and no state manager (Principle III).

### Copy strings the tests assert

Pinned here so five people write the same strings.

| Where | String |
|---|---|
| Gallery heading | `Gallery` |
| Gallery empty state | `Nothing here yet.` plus a link `Capture something` to `/capture` |
| Wall heading | `Wall` |
| Wall empty state | `Nothing published yet.` |
| Load-more control, both screens | `Load more` |
| Publish control | `Publish` when not public, `Unpublish` when public |
| Pending video entry | `StatusBadge variant="pending"` reading `Rendering` |
| Emotion field label | `Emotion` |
| Level field label | `Level` |
| Emotion options | `happy`, `angry`, `sad` — the option value equals its label |
| Level options | `a bit`, `quite`, `very` — the option value equals its label |
| Camera controls | `Turn camera on`, `Take photo`, `Switch camera`, `Turn camera off` |

A gallery or wall entry displays `item.emotion` verbatim in one element and, when
`item.level` is not null, `item.level` verbatim in a second one. No emoji, no
capitalisation, no lookup table — which is why the listing screens do **not**
import `lib/emotions.js`.

Publishing failure shows no message: the control returns to its previous state
and re-enables. The spec requires no error copy there, so none is written.

## Ownership

Five blocks, one owner each. **No file appears in two lists.** These lists are
complete and explicit: a file not named below is owned by nobody and is not
edited by anybody after the branch point.

### Fase 0 — En `develop`, antes de ramificar

**⚠️ BLOQUEA A LOS CINCO.** Nobody branches until this is merged into `develop`.
It lands everything more than one block touches, and freezes it.

Files:

- `lib/emotions.js` — new
- `lib/emotions.test.js` — new
- `lib/generations.js` — new
- `lib/generations.test.js` — new
- `test/mongo-fake.js` — extended: `find(filter).sort().skip().limit().toArray()`, and `insertOne` assigns a real `ObjectId` with `_id` compared through `.equals()`. Both paged reads and `setPublished` depend on it
- `test/mongo-fake.test.js` — extended for the above
- `test/msw/handlers.js` — extended: handlers for `GET /api/gallery`, `GET /api/wall`, `POST /api/generation/:id/publish`, and the changed body of `POST /api/image`. Bloques A and B both consume these
- `test/msw/handlers.test.js` — extended for the above
- `test/fixtures.js` — extended: a ready image item, a pending video item, a pre-002 item with no emotion and no flag
- `proxy.js` — one line: `"/gallery(.*)"` joins the protected matcher. `/wall` stays public, like the landing route, and is not added to it

After this merges, `lib/emotions.js` and `lib/generations.js` are **frozen**. No
block adds a symbol to either.

---

### Bloque A — Pantallas de listado

*Owns, file by file:*

- `app/gallery/page.jsx`
- `app/gallery/page.test.jsx`
- `app/wall/page.jsx`
- `app/wall/page.test.jsx`
- `components/gallery/GenerationCard.jsx`
- `components/gallery/GenerationCard.test.jsx`
- `components/gallery/GalleryList.jsx`
- `components/gallery/GalleryList.test.jsx`
- `components/gallery/PublishToggle.jsx`
- `components/gallery/PublishToggle.test.jsx`
- `components/gallery/index.js`
- `components/wall/WallList.jsx`
- `components/wall/WallList.test.jsx`
- `components/wall/index.js`
- `components/Nav.jsx` — adds a `Gallery` link and a `Wall` link
- `components/Nav.test.jsx` — new; 001 shipped `Nav.jsx` with no colocated test

*Never touches*: `app/api/`, `app/capture/`, `components/capture/`, `e2e/`,
`lib/`, `test/`, `app/globals.css`.

*Imports*: `lib/generations.js` (server components, first page only),
`components/ui/*`. **Imports nothing from `app/api/`.** Pages 2..n go through the
HTTP contract, mocked with MSW.

`components/wall/WallList.jsx` imports `GenerationCard` from
`components/gallery/` rather than duplicating it. Both directories are Bloque A's,
so that crosses no ownership line. `PublishToggle` is rendered by `GalleryList`
only — it never appears on the wall.

---

### Bloque B — Pantallas de captura

*Owns, file by file:*

- `app/capture/page.jsx` — composition only: it wires `EmotionPicker` and `CameraCapture` in and posts `{ photo, emotion, level }`
- `app/capture/page.test.jsx`
- `app/phase2.test.jsx` — a 001 integration test that asserts the mood selector; its emotion assertions move to the three-emotion control
- `components/capture/EmotionPicker.jsx` — new; the three emotions plus the conditional level selector
- `components/capture/EmotionPicker.test.jsx`
- `components/capture/CameraCapture.jsx` — new; live preview, `facingMode: "environment"` by default, camera switch, release on take and on unmount
- `components/capture/CameraCapture.test.jsx`
- `components/capture/HintInput.jsx` — **deleted.** It holds the ten withdrawn moods
- `components/capture/PhotoInput.jsx` — kept and unchanged; the file picker must keep working (FR-023)
- `components/capture/PhotoPreview.jsx` — kept
- `components/capture/GeneratedResult.jsx` — kept
- `components/capture/index.js` — re-exports change: `HintInput` out, `EmotionPicker` and `CameraCapture` in

*Never touches*: `app/api/`, `app/gallery/`, `app/wall/`, `components/gallery/`,
`components/wall/`, `components/Nav.jsx`, `e2e/`, `lib/`, `test/`,
`app/globals.css`.

*Imports*: `lib/emotions.js` (`EMOTIONS`, `LEVELS`, `LEVELLED` for the control;
the defaults are `EMOTIONS[0]` and `LEVELS[1]`), `components/ui/*`.
**`buildHint` is not called on the client** — the screen posts `emotion` and
`level` and the server composes the string. Bloque B mocks `POST /api/image`
with MSW and asserts the request body.

No new file under `hooks/`. The camera's release-on-unmount is an effect cleanup
inside `CameraCapture.jsx` — see Complexity Tracking.

---

### Bloque C — API de lectura

*Owns, file by file:*

- `app/api/gallery/route.js`
- `app/api/gallery/route.test.js`
- `app/api/wall/route.js`
- `app/api/wall/route.test.js`

*Never touches*: any screen, any component, `app/api/image/`, `app/api/video/`,
`app/api/settings/`, `app/api/generation/`, `lib/`, `test/`, `e2e/`.

*Imports*: `lib/generations.js` (`listByUser`, `listPublic`) and
`@clerk/nextjs/server` (`auth`, in the gallery route only). Both routes are thin:
parse and validate `page`, check the session where the contract says to, call the
module, serialise. **No query logic lives in these files** — it is all in
`lib/generations.js`, which is already in `develop`.

---

### Bloque D — API de escritura

*Owns, file by file:*

- `app/api/generation/[id]/publish/route.js`
- `app/api/generation/[id]/publish/route.test.js`
- `app/api/image/route.js`
- `app/api/image/route.test.js`
- `app/api/phase3.test.js` — a 001 integration test that posts `hint`; its image case moves to `{ emotion, level }`

*Never touches*: any screen, any component, `app/api/gallery/`, `app/api/wall/`,
`app/api/video/`, `app/api/settings/`, `lib/`, `test/`, `e2e/`.

*Imports*: `lib/emotions.js` (`buildHint`), `lib/generations.js`
(`setPublished`), and the 001 modules `lib/db.js`, `lib/settings.js`,
`lib/higgsfield.js`, `lib/blob.js` — all already in `develop`, all mocked in its
tests.

The publish route maps the module's three return strings onto the contract:
`"ok"` → `200`, `"not-found"` → `404`, `"not-ready"` → `409`. It contains no
ownership check of its own — the check is the `userId` in the module's filter.

---

### Bloque E — Extremo a extremo

*Owns, file by file:*

- `e2e/landing.spec.js` — the existing 001 smoke spec, unchanged
- `e2e/wall.spec.js` — new: a browser with no session opens `/wall`, sees the heading, is **not** redirected to `/sign-in` (SC-004)
- `e2e/gallery-requires-session.spec.js` — new: a browser with no session opens `/gallery` and lands on `/sign-in`

*Never touches*: anything outside `e2e/`. `playwright.config.js` is unchanged and
is owned by nobody.

Both new specs are **credential-free by design**. Signing a Playwright browser
into Clerk needs real keys, and Principle II's spirit — a suite that runs on a
fork with no secrets — is worth more here than an authenticated journey the
Vitest suite already covers at the component level.

### Files owned by nobody

Every other file in the repository, including `package.json`, `vitest.config.mjs`,
`vitest.setup.js`, `next.config.mjs`, `app/globals.css`, `app/layout.jsx`,
`components/ui/*`, `hooks/*`, `lib/db.js`, `lib/blob.js`, `lib/higgsfield.js`,
`lib/settings.js`, `lib/models.js`, `app/api/video/*`, `app/api/settings/*`,
`app/page.jsx`, `app/dashboard/*`, `app/result/*` and `playwright.config.js`.

A block that needs a change in one of them **raises it in `develop`. It does not
commit it.**

## Merge order into `develop`

Fase 0 first, then the five blocks branch from `develop` in parallel. They merge
back in this fixed order:

**Fase 0 → C → D → A → B → E**

The rule is: **`develop`'s HEAD must be a runnable application after every
merge.** That is what fixes the order, not convenience.

1. **Fase 0 first, alone.** Two blocks import each of its modules and four blocks
   import its test doubles. Branching before it lands means five people writing
   against a moving surface.
2. **C before A.** A's "Load more" is written against the contract and passes on
   MSW alone — but the moment A is in `develop`, a real click needs
   `/api/gallery` and `/api/wall` to exist. Merging C first means the button
   never ships broken. C waits for nothing: it depends only on Fase 0.
3. **D before B.** B's capture screen posts `{ photo, emotion, level }`. If B
   merged first, `develop`'s `/api/image` would still be reading `hint`, and
   every generation in the merged app would fail on a body it does not
   understand. D first keeps that window closed. D also owns the only 001
   endpoint this feature changes, so landing it early puts the riskiest edit in
   front of the most eyes.
4. **C before D** among the two API blocks. Both are independent, so the order is
   ours to pick: the read side touches no 001 file at all, while D edits
   `app/api/image/route.js` and `app/api/phase3.test.js`. Putting the
   zero-conflict block first means the first API merge cannot be the one that
   conflicts.
5. **A before B** among the two screen blocks. Their files are disjoint, so
   either order is safe; A goes first because A owns `components/Nav.jsx` and the
   two routes it links to. Merging A first means `develop` never carries a
   navigation link to a route that does not exist.
6. **E last, always.** The end-to-end specs drive a real dev server against real
   routes and real screens. Run before A, C and this feature's proxy change are
   in `develop`, they fail for reasons that are not theirs. E writes its specs
   during the parallel window and merges them when there is something to drive.

After E merges: `npm run lint && npm test && npm run test:e2e && npm run build`,
then `npm run docs:appendix` and commit the regenerated appendix (Principle VI).

## Project Structure

### Documentation (this feature)

```text
specs/002-gallery-moods-wall-camera/
├── plan.md              # This file
├── spec.md              # The WHAT and WHY
└── tasks.md             # Generated by /speckit-tasks — NOT created by /speckit-plan
```

No `research.md`: there is nothing to research. The spec closed every product
question and this plan closed every technical one — page size, field names,
status codes, copy strings, merge order. A generated research file would restate
them less precisely.

No `data-model.md` and no `contracts/`: both are inlined above, in Contracts and
Data, where the five blocks can see them alongside the ownership lists they
constrain. This follows 001's convention deliberately — a contract that exists in
two files drifts, and Principle VI says the generated artefact wins over the
prose that describes it.

### Source code touched by this feature (repository root)

```text
lib/
├── emotions.js                              # NEW — Fase 0, frozen after it merges
└── generations.js                           # NEW — Fase 0, frozen after it merges

app/
├── gallery/page.jsx                         # NEW — Bloque A, Server Component
├── wall/page.jsx                            # NEW — Bloque A, Server Component
├── capture/page.jsx                         # CHANGED — Bloque B
└── api/
    ├── gallery/route.js                     # NEW — Bloque C
    ├── wall/route.js                        # NEW — Bloque C
    ├── generation/[id]/publish/route.js     # NEW — Bloque D
    └── image/route.js                       # CHANGED — Bloque D

components/
├── gallery/                                 # NEW — Bloque A
├── wall/                                    # NEW — Bloque A
├── capture/                                 # CHANGED — Bloque B (HintInput deleted)
└── Nav.jsx                                  # CHANGED — Bloque A

e2e/                                         # Bloque E
test/                                        # CHANGED — Fase 0 only
proxy.js                                     # CHANGED — Fase 0 only, one line
```

**Structure Decision**: unchanged from 001. One Next.js application at the
repository root, API routes under `app/api/`, no frontend/backend split, no new
top-level directory. The two new component directories sit beside the existing
`components/capture/`, `components/result/` and `components/dashboard/` and follow
the same convention: colocated tests, named exports, an `index.js` barrel.

## Traps specific to this feature

Beyond `docs/REPLICATION-PROMPT.md` §10, which still applies in full:

1. **`navigator.mediaDevices` does not exist in jsdom.** Not `undefined` on an
   existing object — the property is absent. Tests stub it with
   `Object.defineProperty(navigator, "mediaDevices", …)` and a fake
   `MediaStream` whose tracks expose `stop()`. Asserting the release means
   asserting `stop()` was called, on take and on unmount.
2. **An async Server Component is not rendered by `render()`.** Await the page
   function and render what it returns:
   `render(await GalleryPage())`, with `@/lib/generations.js` and
   `@clerk/nextjs/server` both `vi.mock`ed.
3. **A `data:` URL from the camera is not a `File`.** `canvas.toBlob` gives a
   `Blob`; the rest of the flow expects what `PhotoInput` produces. Convert it to
   a `File` at the boundary so FR-022's "indistinguishable to the rest of the
   flow" holds literally.
4. **`test/mongo-fake.js` compares `_id` with `===`.** Once ids are `ObjectId`s
   the comparison must go through `.equals()`, or every `findOne({ _id })`
   silently misses and `setPublished` answers `"not-found"` for documents that
   exist. This is why the fake's extension is Fase 0 work and not a block's.
5. **A `404` for a non-owner looks like a bug in review.** It is not — it is the
   same non-disclosure pattern 001's `/api/settings` uses for a signed-in
   non-owner. Do not "fix" it to a `403`.
6. **`page` arrives as a string.** `?page=abc` must be a `400`, not a `NaN` that
   turns into `skip: NaN` and an empty page that looks like the end of the list.

## Complexity Tracking

> Two deliberate ceilings, on top of 001's two. Both are commented where they are
> taken.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| `test/mongo-fake.js` grows a chainable `find().sort().skip().limit().toArray()` and `ObjectId` ids, past the "under 40 lines" of 001's fake | Both paged reads and `setPublished` are unreachable offline without it, and Principle II forbids a test that needs a database | `mongodb-memory-server` downloads a real MongoDB binary on first run — a network dependency in the one suite that must pass with no network. Ceiling: the fake implements only the operators these two queries use, and a query needing a seventh operator extends the fake rather than working around it |
| `components/capture/CameraCapture.jsx` holds a `useEffect` whose cleanup stops the media tracks, against the house rule "no `useEffect` where an event handler will do" | FR-025 requires release when the user *leaves the screen*, and unmount is not an event any handler sees. `doctor.config.json` already disables `react-doctor/effect-needs-cleanup` for exactly this shape | Releasing only in the take-photo handler leaves the camera lit whenever the user navigates away without shooting, which SC-008 measures directly with the device's in-use indicator |

No index is added to `generations`, and that is a third ceiling recorded here
rather than in the table because it is an omission, not a complexity: at this
collection's size the two sorted paged reads run without one, and an index the
product cannot yet justify is scaffolding under Principle III. The upgrade path
is a compound index on `{ userId: 1, createdAt: -1 }` and
`{ isPublic: 1, createdAt: -1 }`, added when a measurement asks for it.
