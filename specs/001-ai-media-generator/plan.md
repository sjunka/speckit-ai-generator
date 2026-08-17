# Implementation Plan: AI Media Generator

**Branch**: `001-ai-media-generator` | **Date**: 2026-08-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-ai-media-generator/spec.md`

**Note**: Converted by hand from `docs/REPLICATION-PROMPT.md` §2 and §5–§7. Do not
regenerate this file from the spec — the contracts below are what let four tasks
run in parallel, and a regenerated plan would re-derive them differently.

## Required reading before any task

`/speckit.implement` loads the constitution, the spec, this plan and the tasks.
It does not load the source documents. Three sections of
`docs/REPLICATION-PROMPT.md` are not reproduced here and you **MUST** read them
before writing code:

| Section | What it pins | Why it is not inlined |
|---|---|---|
| §6 Design system | Every token value, the eleven type classes with their tracking, the primitive list, the PWA manifest | A value table that must not exist in two places and drift |
| §7 Screens | Every copy string the tests assert, the ten moods verbatim, the failure messages, the dashboard's four elements | Same — the strings are the contract |
| §10 Traps | Sixteen mistakes that each cost an hour | Highest value per line in the source document; read it before starting, not after |

`docs/REPLICATION-APPENDIX.md` is the answer key: all 80 source files verbatim.
Use it to reconcile after each test passes. Where it and any prose disagree, it
wins.

## Summary

One user photographs something, gets an AI image of it, turns that image into a
short video, and downloads or shares it. One owner has a switch that halts all
generation and a video quality tier, plus counters and an estimated spend.

Five screens, five API routes, roughly a dozen files of application code, one
generation provider serving both jobs. Built test-first behind two mocking seams
so the entire suite runs offline. Delivered in six phases: a scaffold, a
blocking foundation, three builds separated by file ownership that run in
parallel, and a merge.

## Technical Context

**Language/Version**: JavaScript on Node. No TypeScript, no `.d.ts`, JSDoc only where a shape is genuinely unclear

**Primary Dependencies**: Next.js 16.3 App Router with Turbopack, React 19.2, Tailwind v4 (configured in CSS — there is no `tailwind.config.js`), `@clerk/nextjs` 7.x hosted components only, `mongodb` driver 7.x with no Mongoose, `@vercel/blob`, Higgsfield as the single generation provider

**Storage**: MongoDB Atlas, database `ia-generator`, two collections. Binary assets in Vercel Blob

**Testing**: Vitest 4 with Testing Library, jsdom and MSW for screens; `vi.mock` plus a hand-rolled in-memory collection for routes and library modules. Playwright for one smoke spec

**Target Platform**: Mobile web first, 360px viewport, installable to the home screen on iOS and Android. Deployed on Vercel

**Project Type**: Single Next.js application. No separate backend — the API routes are part of it

**Performance Goals**: First generated image on screen within 90 seconds of opening the product on a phone. Full test suite green in under 60 seconds

**Constraints**: The suite runs with no credentials, no database and no network. Every control at least 44px tall. Body text clears 4.5:1 on every surface. No screen scrolls horizontally at 360px. No `max-width` media queries anywhere

**Scale/Scope**: One user at a time, one owner, roughly a dozen files of application code and 80 files in total. No queues, no concurrency story, no multi-tenancy

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Verdict | How this plan satisfies it |
|---|---|---|
| I. Test-First | **PASS** | Every numbered task in `tasks.md` states its test before its implementation, and each task's done-condition names a test that failed first |
| II. The Suite Runs Offline | **PASS** | Two seams: MSW at the HTTP boundary for screens, `vi.mock` plus `test/mongo-fake.js` for routes and lib. `.env.local` is never read by a test |
| III. Build Only What Is Listed | **PASS** | Five screens, five routes, six primitives. The spec's out-of-scope list is restated in the task ownership blocks as "never touches" |
| IV. Tokens Are The Theme | **PASS** | T003 lands the `@theme` block and its test asserts no raw lavender hex outside `globals.css`. Only the eleven documented type classes exist |
| V. File Ownership Defines Parallelism | **PASS** | Phases 3, 4 and 5 of `tasks.md` have disjoint ownership lists. Every cross-phase call is pinned in Contracts below before either side is written |
| VI. The Appendix Wins | **PASS** | T038 runs `npm run docs:appendix` and diffs against the original as the final gate |

Re-check after design: no principle moved.

## Contracts

Pinned before anything is written. These are what let three tasks run in
parallel: a task writes against the signature, the file it calls arrives later
on another branch, they meet at the merge.

### Modules

```js
// lib/db.js
export const db = async () => Db                  // MongoClient cached on globalThis
export const generations = async () => Collection // db("ia-generator").collection("generations")

// lib/settings.js
export const getSettings = async () => ({ enabled: boolean, videoQuality: string })
export const assertEnabled = async () => void     // throws Error with .status = 503, message "Generation is paused"
export const isOwner = (userId) => boolean        // userId === process.env.OWNER_ID

// lib/models.js
export const COST_PER_IMAGE = 0.02
export const COST_PER_VIDEO = 0.1

// lib/higgsfield.js
export const generateImage = async (photoUrl, hint) => ({ buffer, contentType })
export const startVideo = (imageUrl, quality = "lite") => Promise<requestId>
export const getVideo = async (requestId) => ({ status: "pending"|"ready"|"failed", videoUrl? })

// lib/blob.js
export const store = async (buffer, contentType, forceRemote = false) => string  // public URL
```

### HTTP

The screens call `fetch` and never import `lib/`. This table is the seam, and
it is what the MSW handlers are written against.

| Route | Method | Request | Response |
|---|---|---|---|
| `/api/image` | POST | `{ photo, hint? }`, `photo` a `data:` URL | `200 { imageUrl }` · `401` · `503 "Generation is paused"` · `500` |
| `/api/video` | POST | `{ imageUrl }` | `200 { jobId }` · `401` · `502` · `503` |
| `/api/video/[id]` | GET | — | `200 { status, videoUrl? }` · `404` |
| `/api/video/[id]/file` | GET | — | the video bytes, same-origin · `404` |
| `/api/settings` | GET, PATCH | `{ enabled?, videoQuality? }` | `200 { enabled, videoQuality }` · `404` for non-owner and anonymous |

### Data

One database, `ia-generator`, two collections.

`generations` — one document per asset:

```js
{ userId, kind: "image", status: "ready",   url, createdAt }
{ userId, kind: "video", status: "pending", jobId, sourceUrl, createdAt }
// video documents gain url and become status "ready" or "failed" on the first
// status read that sees a terminal provider state
```

`settings` — exactly one document, `_id: "config"`, holding `enabled` and
`videoQuality`. Absent means enabled and `lite`.

### Provider

Higgsfield, `https://platform.higgsfield.ai`, header
`Authorization: Key ${HIGGSFIELD_API_KEY}:${HIGGSFIELD_API_SECRET}`.

- `POST /{model}` returns `{ request_id }`. `GET /requests/{request_id}/status` returns `{ status, images?, video? }`; `queued` and `in_progress` mean pending, `completed` means done.
- Image model `higgsfield-ai/soul/reference`, which takes `image_reference_url`. `soul/standard` is text-to-image and silently drops the photo.
- Video models `higgsfield-ai/dop/{lite,standard,turbo}`. Quality is a model choice, not a request field.
- The provider takes a **public URL, not bytes**. The photo goes to blob storage before generation and the generated image goes to blob storage after.
- Image generation polls inline every 2s up to 60 attempts and returns bytes. Video generation returns a job id the client polls.
- Both prompts are fixed strings — copy them from `docs/REPLICATION-PROMPT.md` §5 character for character; the tests assert them.

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-media-generator/
├── plan.md              # This file
├── spec.md              # The WHAT and WHY
└── tasks.md             # The five tasks, converted from REPLICATION-PROMPT.md §9

docs/
├── REPLICATION-PROMPT.md    # §6, §7 and §10 are required reading — see above
├── REPLICATION-APPENDIX.md  # 80 source files verbatim; the answer key
└── PROMPT-NOTES.md          # Why the prompt is shaped this way; read if adapting it
```

No `research.md`: the source document already resolved every open question, and
a generated one would only restate it less precisely. No `data-model.md` or
`contracts/`: both are inlined above, where the tasks can see them.

### Source Code (repository root)

```text
app/
├── layout.jsx                     # ClerkProvider, fonts, manifest link
├── globals.css                    # the ONLY place a palette hex appears
├── page.jsx                       # landing
├── sign-in/[[...sign-in]]/page.jsx
├── capture/page.jsx
├── result/[jobId]/page.jsx
├── dashboard/page.jsx             # server component
└── api/
    ├── image/route.js
    ├── video/route.js
    ├── video/[id]/route.js
    ├── video/[id]/file/route.js
    └── settings/route.js

components/
├── ui/                            # Button, TextInput, StatusBadge, Card, Spinner, inline icons
├── capture/                       # PhotoInput, PhotoPreview, HintInput, GeneratedResult
├── dashboard/
├── result/
└── Nav.jsx

hooks/                             # useElapsedSeconds
lib/                               # db, settings, models, higgsfield, blob
test/                              # msw/, mongo-fake.js, fixtures.js, render helpers
e2e/                               # one Playwright smoke spec
proxy.js                           # route protection — NOT middleware.js, see trap 2
scripts/build-appendix.mjs         # regenerates the appendix
```

**Structure Decision**: One Next.js application at the repository root, not a
frontend/backend split. The API routes are the backend and live under `app/api/`,
which is why task 2 and task 3 can own screens and routes separately without
owning separate deployables. Test doubles live in `test/` rather than beside
each suite because task 1 must ship them once for tasks 2 through 4 to consume.

## Complexity Tracking

> Two deliberate ceilings. Both are commented at the point they are taken.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| `lib/blob.js` writes to `public/uploads` when there is no blob token and `NODE_ENV !== "production"` | The application must run locally without a paid storage account | Requiring a token to run `npm run dev` blocks every new contributor on account setup. Ceiling: Vercel's filesystem is ephemeral and the provider cannot reach a localhost file, so a real generation still needs a token or a tunnel |
| `doctor.config.json` disables `react-doctor/effect-needs-cleanup` | The result screen's polling effect cleans up through an `AbortController` and a cleared timer, which the rule cannot see | Restructuring the effect to satisfy the rule would mean polling with `setInterval`, which keeps multiple requests in flight — see trap 11 |
