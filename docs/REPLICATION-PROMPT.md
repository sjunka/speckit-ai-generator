# Replication prompt — AI Media Generator

Feed this file to an agent to rebuild this repository from an empty
directory. It is written to be read by a machine: every contract, token,
string and command it needs is here, and nothing it must invent is left
implicit.

## 0. The exactness contract

The rebuild must produce the **same app**, not a similar one. Two documents
enforce that:

- **This file** is the plan and the reasoning: what to build, in what order,
  with which tests, and which mistakes to avoid.
- **[`REPLICATION-APPENDIX.md`](REPLICATION-APPENDIX.md)** is the target state:
  all 80 source files, verbatim, generated from the repository itself.

Work this file. Use the appendix as the answer key: write each test first and
watch it fail, implement until it passes, then reconcile your file against the
appendix and take the appendix's version wherever they differ. A rebuild is
finished when every file matches byte for byte.

The check is mechanical. Copy `scripts/build-appendix.mjs` into the rebuild,
then:

```sh
npm run docs:appendix
diff docs/REPLICATION-APPENDIX.md <the original appendix>   # must be empty
```

Two things the appendix cannot carry, because they are binary: `public/icon-192.png`,
`public/icon-512.png` and `app/favicon.ico`. Copy them from the original
repository, or regenerate them — a lavender `#5e6ad2` mark on the `#010102`
canvas, square, at 192px and 512px.

**How to run it**

- **OpenSpec** — put this file in the repo, then
  `/opsx:propose Build the app described in docs/REPLICATION-PROMPT.md`.
  The five capabilities in §3 become the delta specs; the five tasks in §9
  become `tasks.md`. Then `/opsx:apply` per task, `/opsx:archive` at the end.
- **Spec Kit** — `/specify` with §1–§8 as the description, `/plan` with §2 and
  §5–§7 as the technical context, `/tasks` with §9 verbatim, `/implement`.
- **Neither** — read it top to bottom and work §9 in order.

Section §9 is the plan. Everything before it is the material §9 needs. The
appendix is the target. Where a prose description here and the appendix
disagree, the appendix wins — it is generated from the running app.

---

## 1. The product

One user, one flow. Sign in, photograph something, get an AI image of it,
turn that image into a short video, download or share it. One owner, one
dashboard: a switch that stops all generation and a video quality tier, plus
counters and an estimated spend.

Five screens: landing, sign-in, capture, result, dashboard. Five API routes.
Roughly a dozen files of application code. If the build produces materially
more than that, it was over-built.

**Out of scope, and not to be scaffolded for:** billing, queues, retries,
provider fallback, a history or gallery, a role hierarchy beyond
owner/everyone, i18n, prompt templates, an error taxonomy, TypeScript, a
state manager, an ORM, a component library.

## 2. Stack and hard constraints

| Thing | Choice |
|---|---|
| Framework | Next.js 16.3 App Router, Turbopack dev server |
| Language | JavaScript. No TypeScript, no `.d.ts`, JSDoc only where a shape is genuinely unclear |
| React | 19.2 |
| Styling | Tailwind v4 — configured in CSS, there is no `tailwind.config.js` |
| Auth | Clerk (`@clerk/nextjs` 7.x), hosted components only |
| Database | MongoDB Atlas via the official `mongodb` driver 7.x. No Mongoose |
| Storage | Vercel Blob (`@vercel/blob`) |
| Generation | Higgsfield, one provider for both image and video |
| Unit tests | Vitest 4 + Testing Library + jsdom + MSW |
| E2E | Playwright, one smoke spec |
| CI | GitHub Actions: lint, `react-doctor` score against a committed baseline, then the suite |

Code style: arrow functions, named exports (`export default` only where Next
demands it — pages, layouts, route handlers use `export const GET/POST`).
No class components. No `useEffect` where an event handler will do. State is
`useState` and `fetch`, nothing more.

Every screen is written for a 360px viewport first and widened with `md:` and
`lg:` prefixes. No `max-width` media queries anywhere — the direction must
stay greppable.

## 3. Capabilities

Five, each with its own spec file under `openspec/specs/`:

- `design-system` — tokens, type scale, shell, primitives, PWA manifest, the CI gate.
- `media-pipeline` — photo in, image out, video out, storage, `generations` records.
- `cost-controls` — the kill switch, the quality tier, the settings route, the dashboard.
- `capture-flow` — landing, sign-in, capture, handoff to video.
- `result-sharing` — polling, playback, download, Web Share, failure states.

Write each as requirements with `#### Scenario:` blocks. Every scenario gets a
test. The scenario list in this file is the minimum; §6 and §7 carry the
detail those scenarios assert.

## 4. Environment

`.env.local.example`, committed verbatim. `.env.local` is the developer's own
and is never committed:

```sh
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Clerk Authentication (get from https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Higgsfield API (for image and video generation) - keys from https://cloud.higgsfield.ai
HIGGSFIELD_API_URL=https://platform.higgsfield.ai
HIGGSFIELD_API_KEY=...
HIGGSFIELD_API_SECRET=...
# Optional - model ids from https://cloud.higgsfield.ai/explore
HIGGSFIELD_IMAGE_MODEL=higgsfield-ai/soul/reference
# Video quality is normally set on the dashboard (lite/standard/turbo).
# Set this to force a specific model regardless of that setting.
# HIGGSFIELD_VIDEO_MODEL=higgsfield-ai/dop/standard

# Vercel Blob (for image/video storage)
BLOB_READ_WRITE_TOKEN=...

# Admin/Owner Access (set your Clerk user ID to access /dashboard)
OWNER_ID=user_...
```

**No test may need any of these.** The whole suite runs offline with none set.

## 5. Contracts

Pin these before writing anything. They are what lets three tasks run in
parallel: a task writes against the signature, the file arrives on another
branch, they meet at merge.

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

The screens call `fetch` and never import `lib/`. This table is the seam.

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

- `POST /{model}` returns `{ request_id }`.
- `GET /requests/{request_id}/status` returns `{ status, images?, video? }`.
  `queued` and `in_progress` mean pending; `completed` means done.
- Image model `higgsfield-ai/soul/reference` — it takes `image_reference_url`.
  The `soul/standard` model is text-to-image and **silently drops the photo**.
- Video models `higgsfield-ai/dop/{lite,standard,turbo}`. Quality is a model
  choice, not a request field.
- Image prompt, built from the mood the user picked:
  `Create a picture ultra realistic, similar to the reference image, mixed with the action of ${hint || "a spontaneous, joyful moment"}. Be random and creative with the result.`
- Video prompt, fixed: `Smooth cinematic camera move, gentle natural motion.`
- The provider takes a **public URL, not bytes**. The user's photo goes to blob
  storage before generation, and the generated image goes to blob storage after.
- Image generation polls inline, every 2s, up to 60 attempts, and returns the
  bytes. Video generation returns a job id and is polled by the client.

## 6. Design system

Dark only. No light mode, no `dark:` variants, no theme toggle — the tokens
are the theme.

`app/globals.css`, whole file shape:

```css
@import "tailwindcss";

@theme {
  --color-canvas: #010102;
  --color-surface-1: #0f1011;
  --color-surface-2: #141516;
  --color-surface-3: #18191a;
  --color-surface-4: #191a1b;
  --color-hairline: #23252a;
  --color-hairline-strong: #34343a;
  --color-ink: #f7f8f8;
  --color-ink-muted: #d0d6e0;
  --color-ink-subtle: #8a8f98;
  --color-ink-tertiary: #62666d;
  --color-primary: #5e6ad2;
  --color-primary-light: #828fff;
  --color-primary-hover: #828fff;
  --color-primary-focus: #5e69d1;
  --color-success: #27a644;

  --font-sans: var(--font-inter);
  --font-mono: var(--font-jetbrains-mono);
}

@layer components { /* the type scale below */ }
```

Type scale, as component classes, all Inter except `.mono`:

| Class | Size | Weight | Line height | Tracking |
|---|---|---|---|---|
| `.display-xl` | 80px | 600 | 1.1 | -3px |
| `.display-lg` | 56px | 600 | 1.1 | -2.4px |
| `.display-md` | 40px | 600 | 1.1 | -1.8px |
| `.display-sm` | 28px | 600 | 1.2 | -0.6px |
| `.heading-xl` | 24px | 600 | 1.2 | -0.2px |
| `.heading` | 20px | 600 | 1.3 | — |
| `.body` | 16px | 400 | 1.5 | — |
| `.body-sm` | 14px | 400 | 1.5 | — |
| `.caption` | 12px | 400 | 1.4 | — |
| `.eyebrow` | 13px | 500 | 1.2 | +0.4px, uppercase |
| `.mono` | — | 400 | 1.5 | JetBrains Mono |

Rules the tests enforce:

- No display weight above 600.
- Lavender `#5e6ad2` appears as a raw hex **only** in `globals.css`. Everywhere
  else it is `bg-primary`, `text-primary-light`, `outline-primary`.
- Hierarchy comes from the surface ladder and 1px hairline borders. No drop
  shadows, no gradients.
- The only other chromatic value is success green `#27a644`.
- Focus: `focus:outline-2 focus:outline-offset-2 focus:outline-primary` at 50%
  opacity, on every interactive element.
- Every control is at least 44px tall — `h-11` is the house height.
- Corner radius 8px on controls and cards, 4px on badges. Never a pill.

Fonts load through `next/font/google` — Inter as `--font-inter`, JetBrains
Mono as `--font-jetbrains-mono`. No external font request, no layout shift.

**Only the classes in the table above exist.** There is no `body-md` or
`body-lg`; body copy is `.body` or `.body-sm`. Weight is `font-medium`, not
`font-500`. A pixel width is `max-w-[1280px]`, not `max-w-1280`. Tailwind
accepts every one of those wrong names in silence — see trap 15.

`components/ui/` holds `Button` (primary / secondary / tertiary), `TextInput`,
`StatusBadge` (success / pending / failed), `Card`, `Spinner`, and a set of
inline 20×20 stroke icons (`CameraIcon`, `DownloadIcon`, `ShareIcon`,
`ImageIcon`, `GaugeIcon`, `CloseIcon`) re-exported from `components/ui/index.js`.
No icon library. The path data is in the appendix — copy it; hand-drawn
replacements will not match.

Each primitive takes `className` as a named prop and appends it to its own
classes. Spreading it through `{...props}` instead replaces them, and the
control renders unstyled — see trap 16.

PWA: `public/manifest.json` with name "AI Media Generator", short name
"AI Media", `display: "standalone"`, `#010102` for both theme and background,
`portrait-primary`, and 192px and 512px icons. Linked from the layout head.

## 7. Screens

Copy is part of the contract — the tests assert these strings.

**Landing** `app/page.jsx`. Public. Centred, `max-w-md`. `.display-lg`
heading "Create videos from photos", one sentence "AI turns your ideas into
reality.", one full-width primary button "Start creating" routing to
`/sign-in`. No features grid, no FAQ, no pricing. A signed-in visitor never
sees it — the proxy redirects them to `/capture` before render.

**Sign-in** `app/sign-in/[[...sign-in]]/page.jsx`. Clerk's hosted `<SignIn>`
with `forceRedirectUrl="/capture"`, centred on the canvas. No hand-written
credential form.

**Capture** `app/capture/page.jsx`, client component, `max-w-md`. Top nav,
`.display-sm` heading "Capture", one `Card` holding:

- `PhotoInput` — a hidden `<input id="photo" type="file" accept="image/*" capture="environment">`
  driven by a visible "Choose photo" button, so mobile opens the rear camera
  and desktop opens an image-restricted picker. The file is read as a data URL
  with `FileReader`.
- `PhotoPreview` — square, `object-contain`, shown until an image is generated.
  A second photo replaces the first.
- `HintInput` — a `<select>` labelled "Mood", not free text, with exactly these
  ten options, the first selected by default:

  ```js
  ["I am feeling happy 😊", "I am feeling adventurous 🌍", "I am feeling playful 🎉",
   "I am feeling calm 🧘", "I am feeling energetic ⚡", "I am feeling curious 🔍",
   "I am feeling confident 💪", "I am feeling dreamy 🌙", "I am feeling grateful 🙏",
   "I am feeling bold 🔥"]
  ```

- A primary "Generate" button, disabled without a photo, while generating, and
  while paused. Generating shows a spinner and `Generating... {n}s`, counted by
  a `useElapsedSeconds(active)` hook.
- On `503`: a banner with a pending `StatusBadge` "Generation paused" and the
  line "Generation is currently paused. Check back later.", and generate stays
  disabled. A `503` is never rendered as an error.
- On other failures: "Image provider is down. Try again shortly." for `502`,
  otherwise "Generation failed. Try again." The photo stays selected so retry
  costs nothing.
- On success: `GeneratedResult` — a two-up grid, eyebrow "Original" beside
  eyebrow "Generated image", the generated one clickable into a fullscreen
  overlay with a close button — and a primary "Make video" button. That button
  does not exist before an image does. It posts to `/api/video` and routes to
  `/result/{jobId}`.

**Result** `app/result/[jobId]/page.jsx`, client component. `.display-sm`
"Your video" over a `Card`.

- Polls `GET /api/video/{jobId}` every 3000ms while pending, through a
  `setTimeout` chain, not `setInterval`. Stops on `ready`, on `failed`, on
  `404`, and on unmount — the effect aborts with an `AbortController` and
  clears the timer.
- A non-404 error response is not a job state: keep polling.
- Pending: a `role="progressbar"` bar and "Rendering your video... {n}s".
- Ready: `<video controls playsInline>` against the URL — inline, never
  fullscreen — a "Download" anchor with the `download` attribute, and a
  "Share" button **only** where `navigator.canShare({ files: [...] })` is true.
  Share fetches `/api/video/{jobId}/file` (same-origin, because the provider's
  URL has no CORS headers) and hands the blob to `navigator.share`.
- Failed: "That render failed. Try again from a new photo." plus a link back
  to capture. No player.
- Unknown job: "We could not find that video." plus the same link.

**Dashboard** `app/dashboard/page.jsx`, server component. Guarded by
`sessionClaims?.publicMetadata?.role === "admin"`; anyone else gets a rendered
404 page that discloses no settings. Loads while generation is off — that is
where the switch lives. Four things and nothing else:

1. The generation switch, reflecting the stored value, PATCHing on change.
2. The video quality selector: Lite (lowest cost, fastest) / Standard / Turbo.
3. Three counters: total images, total videos, generations today.
4. One estimated spend figure, `images × COST_PER_IMAGE + videos × COST_PER_VIDEO`,
   labelled as an estimate.

Counters come from `countDocuments`. Layout is one column at 360px and three
across at `md:`.

**Route protection** lives in `proxy.js` at the repo root — Next 16 renamed
`middleware.js` to `proxy.js` and exports `proxy`, not `middleware`. It uses
`clerkMiddleware` with `createRouteMatcher(["/capture(.*)", "/result(.*)", "/dashboard(.*)"])`,
calls `auth.protect()` on those, and redirects a signed-in visitor from `/` to
`/capture`. The API routes still check `auth()` themselves — a route that
trusted the matcher alone would become a hole the day someone edits it.

## 8. Testing

**Test first, always.** For every scenario: commit the failing test, then the
code that passes it. A behaviour with no test that once failed is not done.

Two seams, because two kinds of test need different ones:

- **Screens** mock HTTP with MSW (`test/msw/handlers.js`, `test/msw/server.js`)
  written to the §5 route table. The component's own `fetch` runs for real.
- **Routes and lib** mock the provider modules with `vi.mock` and Mongo with a
  hand-rolled in-memory collection (`test/mongo-fake.js`: `findOne`,
  `insertOne`, `updateOne`, `countDocuments`, under 40 lines). Not
  `mongodb-memory-server` — it downloads a real database binary for two
  collections that have no interesting queries.

Fixtures in `test/fixtures.js`: a 1×1 transparent PNG as base64 and as a data
URL, `https://blob.test/image-1.png`, `https://blob.test/video-1.mp4`,
`provider-job-1`, `job-12345`.

`vitest.setup.js` imports `@testing-library/jest-dom/vitest`, cleans up after
each test, imports `app/globals.css` so token assertions can read it, and
mocks `next/image` down to a plain `<img>` — jsdom cannot serve Next's image
optimizer, and the tests only care that `src` and `alt` reach the DOM.

`vitest.config.mjs` — the `.mjs` matters, as `.js` Vite warns about ESM loaded
as CommonJS — sets the `@` alias (Vitest does not read `jsconfig.json`),
`jsdom`, `globals: true`, and excludes `e2e/`.

The kill switch and the quality tier are both asserted the same way: check
whether the provider mock was called, and with what.

Target: the full suite green with no API key, no network and no database.

## 9. The five tasks

**Task 1 is a blocker. Tasks 2, 3 and 4 run in parallel against it. Task 5 is
the merge.**

Nothing outside task 1 edits `package.json`, `vitest.config.mjs`,
`vitest.setup.js`, `next.config.mjs`, `jsconfig.json`, `postcss.config.mjs` or
`eslint.config.mjs`. A task that needs a change there raises it instead of
committing it.

---

### Task 1 — Bootstrap: scaffold, tokens, primitives, test doubles, CI

*Owns: everything not owned by 2–4. Nothing else may start until this lands on
the main branch.*

```bash
# create-next-app refuses a directory that already holds openspec/, and npm
# rejects a package name starting with a period — so scaffold into a plain
# subdirectory and move the files up.
npx create-next-app@latest scaffold --js --app --tailwind --eslint \
  --no-src-dir --import-alias "@/*" --use-npm --skip-install
rm -rf scaffold/.git scaffold/AGENTS.md scaffold/CLAUDE.md scaffold/README.md
mv scaffold/app scaffold/public .
mv scaffold/.gitignore scaffold/package.json scaffold/next.config.mjs \
   scaffold/jsconfig.json scaffold/postcss.config.mjs scaffold/eslint.config.mjs .
rm -rf scaffold
mv app/layout.js app/layout.jsx && mv app/page.js app/page.jsx

npm i @clerk/nextjs mongodb @vercel/blob
npm i -D vitest @testing-library/react @testing-library/user-event \
         @testing-library/jest-dom jsdom msw @playwright/test
```

Renaming the two scaffold pages to `.jsx` matters: it means tasks 2 and 4 edit
files that already exist instead of racing to create them.

1.1 Scripts in `package.json`: `dev`, `build`, `start`, `lint`,
`test` (`vitest run`), `test:watch`, `test:e2e`, `docs:appendix`. Write
`vitest.config.mjs` and `vitest.setup.js` per §8 now, not later — tasks 2–4
must be able to run a test from their first minute. Take
`next.config.mjs`, `jsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`,
`playwright.config.js`, `doctor.config.json` and `.gitignore` from the
appendix verbatim; `next.config.mjs` in particular carries the
`images.remotePatterns` entry without which no generated image renders.
→ verify: `npm test` runs and reports no tests; `npm run build` passes.

1.2 Strip the scaffold's placeholder styles and markup. Write the token tests
first — canvas is `#010102`, the surface ladder resolves, no raw lavender hex
outside `globals.css` — then land the `@theme` block from §6.
→ verify: token tests green.

1.3 Load Inter and JetBrains Mono through `next/font`; implement the type scale
from §6 as component classes. Test the tracking values and that no display
weight exceeds 600.

1.4 `app/layout.jsx`: `ClerkProvider`, `<html className="dark …">`, viewport
metadata, manifest link, `bg-canvas text-ink` on the body. Test that a light
`prefers-color-scheme` changes nothing.

1.5 `components/ui/*` per §6, each variant and the focus ring and the 44px
height under test. Plus `components/Nav.jsx` — capture and, for an admin,
dashboard, with Clerk's `UserButton`.

1.6 `public/manifest.json` and the two icons. Test its shape and that the
layout links it.

1.7 The shared doubles other tasks consume: `test/msw/handlers.js` and
`server.js` written to the §5 table, `test/mongo-fake.js`, `test/fixtures.js`,
a 360px viewport render helper, and a contrast check asserting body text clears
4.5:1 on the canvas and on every surface step.

1.8 `.github/workflows/ci.yml`, on push and pull request:
`npm ci` → `npm run lint` → `npx -y react-doctor@latest . --score` compared
against a committed `.react-doctor-baseline` → `npm test`. `--score` prints a
bare number, so the comparison is a shell test. Establish the baseline **after**
the shell exists, not on the bare scaffold. The committed values are
`.react-doctor-baseline` = `55` and `doctor.config.json` turning off
`react-doctor/effect-needs-cleanup` — the polling effect in the result screen
cleans up through an `AbortController`, which the rule cannot see.
→ verify: the workflow passes with no environment variables set, and fails both
when a test fails and when the score drops.

**Done when:** `npm run lint && npm test && npm run build` are green, CI is
green, and the three following tasks can each `npm ci` and run a test.

---

### Task 2 — Front end: landing, sign-in, capture, result

*Owns: `app/page.jsx`, `app/sign-in/[[...sign-in]]/page.jsx`,
`app/capture/page.jsx`, `app/result/[jobId]/page.jsx`, `components/capture/*`,
`components/result/*`, `hooks/*`, `proxy.js`, and the colocated tests.*
*Never touches `lib/`, `app/api/`, `app/dashboard/`.*
*Talks to the API only through `fetch`, against task 1's MSW handlers.*

2.1 Test-drive `proxy.js`: anonymous requests to capture, result and dashboard
are protected; the landing route stays public; a signed-in visitor at `/` is
redirected to `/capture`. Then implement it.

2.2 Landing, at 360px first, then widened. Assert the hero, the single
sentence, exactly one call to action, and that no features grid, FAQ or
pricing exists.

2.3 Sign-in from Clerk's hosted component, `forceRedirectUrl="/capture"`.

2.4 Capture, photo half: the file input's `accept` and `capture` attributes,
the preview appearing, a second photo replacing the first, generate disabled
without a photo.

2.5 Capture, generation half: the progress state, the image appearing in
place, the mood reaching the request body, the failure message with the photo
still selected, and `503` rendering the paused banner rather than an error.
`useState` and `fetch` only — no data-fetching library.

2.6 The handoff: no make-video control before an image exists; once activated,
a job starts and the router pushes `/result/{jobId}`.

2.7 Result: polling with fake timers — 3s between responses, stopping on
`ready`, on `failed`, on `404` and on unmount — then playback, download,
Web Share with its feature detection, and both failure messages.

2.8 Widen every screen to desktop. Run `react-doctor`.

**Done when:** every scenario in `capture-flow` and `result-sharing` has a test
that failed before its implementation, and the suite is green with no network.

---

### Task 3 — Back end: providers, storage, generation routes

*Owns: `lib/db.js`, `lib/blob.js`, `lib/higgsfield.js`, `app/api/image/route.js`,
`app/api/video/route.js`, `app/api/video/[id]/route.js`,
`app/api/video/[id]/file/route.js`, and their tests.*
*Never touches any screen, `app/dashboard/`, `app/api/settings/`.*
*Imports `lib/settings.js` and `lib/models.js` by their §5 signatures — mock
them until task 4 lands.*

3.1 `lib/db.js` test-first: the client is cached on `globalThis` and a second
call constructs nothing. Then implement it and `generations()`.

3.2 `lib/blob.js`: `store` puts to Vercel Blob and returns the public URL, with
a **dev-only** fallback that writes to `public/uploads` when there is no token
and `NODE_ENV !== "production"`, so the app runs locally without one. Comment
the ceiling: Vercel's filesystem is ephemeral, and a photo stored this way is
not reachable by the provider unless the dev server is tunnelled.

3.3 `lib/higgsfield.js` per §5: one `call` helper carrying the auth header and
turning a non-2xx into an `Error` with `.status`, `submit`, `requestStatus`,
`generateImage` (inline polling, then fetch the bytes), `startVideo`,
`getVideo`. Assert the reference model and both prompts.

3.4 `POST /api/image`, every scenario: photo with a mood, photo without one,
the `generations` record and its fields, `401` for an anonymous caller with no
provider touched, and a provider failure producing a non-2xx and no `ready`
record. Order inside the handler: auth, `assertEnabled`, store the photo,
generate, store the result, insert, return.

3.5 `POST /api/video`: `200 { jobId }` with a pending record carrying the
provider job id and the source URL, the quality read from settings, `401`
for an anonymous caller.

3.6 `GET /api/video/[id]`: pending; first completion persisting the URL and
returning it; a second read served from the record **without** re-querying the
provider; failure updating the record; `404` for an unknown job; and a normal
read while the kill switch is off — the switch stops new generations, it does
not hide existing jobs.

3.7 `GET /api/video/[id]/file`: streams the stored video through this origin so
the browser can build a shareable `File` — the provider's URL has no CORS
headers. `404` when the record or its URL is missing.

3.8 Run the whole task's suite with no keys and no network. Confirm green.

**Done when:** every `media-pipeline` scenario has a test that failed first.

---

### Task 4 — Dashboard, settings, and the keys

*Owns: `lib/settings.js`, `lib/models.js`, `app/api/settings/route.js`,
`app/dashboard/page.jsx`, `components/dashboard/*`, `.env.local.example`, and
their tests.*
*Never touches `lib/db.js`, `lib/higgsfield.js`, any generation route, any
screen from task 2.*
*Imports `lib/db.js` by its §5 signature and `components/ui/*` from task 1 —
mock `db` until task 3 lands.*

4.1 `lib/models.js`: the two per-asset cost constants, fixed in the module,
never fetched.

4.2 `lib/settings.js` test-first: `getSettings` returning the stored record and
defaulting to `{ enabled: true, videoQuality: "lite" }` when none exists;
`assertEnabled` throwing a `503 "Generation is paused"` when disabled and
passing through otherwise; `isOwner` comparing against `OWNER_ID`.

4.3 `GET|PATCH /api/settings`: an owner's partial update persisting one field
and leaving the other untouched; the first write creating the record with the
documented default for the other field; `404` for a signed-in non-owner and for
an anonymous caller. `_id` stays out of `$set` — MongoDB rejects updating it.

4.4 The dashboard at 360px first: exactly the four things from §7, the switch
reflecting stored state, a non-owner receiving a 404 page that discloses no
values, and the page still loading while generation is off. Widen to three
columns at `md:`. Run `react-doctor`.

4.5 The keys — the one task that touches real accounts. Write
`.env.local.example` from §4, then set up and document, in the README:

- **Clerk** — application, Google and email sign-in enabled, publishable and
  secret keys. Set `publicMetadata.role = "admin"` on the owner's user for the
  dashboard, and put that user's id in `OWNER_ID` for the settings API.
- **MongoDB Atlas** — a free M0 cluster, database `ia-generator`. Vercel Hobby
  has no fixed egress IP, so network access is `0.0.0.0/0` and the connection
  string is the only credential. Never commit it.
- **Vercel Blob** — a store, and its read-write token.
- **Higgsfield** — key and secret from the cloud console; check the model ids
  against the explore page before trusting them.

→ verify by hand, with `.env.local` filled in: `/dashboard` renders for the
admin user and 404s for a second, non-admin user; toggling the switch off makes
the next generate call return `503`; toggling it back on restores it.

**Done when:** every `cost-controls` scenario has a test that failed first, and
the manual key check above passes.

---

### Task 5 — Merge, reconcile, build

*Runs after 2, 3 and 4. Owns nothing new; its job is to make the four halves
one app.*

5.1 Merge the branches. The only expected conflicts are in `package.json` if a
task added a dependency, and each has an obvious resolution.

5.2 **Reconcile the MSW handlers against the routes that actually shipped.**
This is the one real risk in a parallel build: task 2 tested against handlers,
not against task 3's code, so a handler that disagrees with its route gives
green tests and a broken app. Walk the §5 table field by field.

5.3 Run everything: `npm run lint && npm test && npm run build`. Fix what the
merge broke and nothing else.

5.4 Delete what the merge orphaned — mocks for modules that now exist, stub
files, unused imports. Do not touch code the merge did not orphan.

5.5 Add the Playwright smoke spec (`e2e/landing.spec.js`: the landing page
loads and its call to action reaches sign-in) and `playwright.config.js`
pointing at `npm run dev`.

5.6 `react-doctor` over the merged repository; raise the committed baseline to
the merged score, never lower it. Confirm CI is green.

5.7 Walk the product by hand on a phone: landing → sign-in → photo → image →
video → download, without a keyboard except at sign-in. Install it to the home
screen on iOS and Android and confirm it opens without browser chrome.

5.8 Run the exactness check from §0: `npm run docs:appendix`, then diff against
the original appendix. Every difference is either a file you got wrong or a
deliberate change — there is no third case, so resolve each one explicitly.

5.9 Deploy. Vercel's Git integration handles it — put the eight environment
variables in the project settings and let a green CI run gate the deploy. Do
not hand-roll a deploy step.

**Done when:** lint, tests, `react-doctor` and the build are green on the merge
commit, and the hand walk-through works against real providers.

---

## 10. Traps

Things that cost time the first time round. Read before starting.

1. **`create-next-app` refuses a non-empty directory.** Its allow list covers
   `.git`, `.gitignore` and `docs/` — not `openspec/`. Hence the `scaffold/`
   subdirectory dance in task 1.
2. **Next 16 renamed `middleware.js` to `proxy.js`,** and the export with it.
   A file called `middleware.js` is silently ignored.
3. **Tailwind v4 has no config file.** Tokens go in an `@theme` block in CSS.
   Anything that tells you to write `tailwind.config.js` is out of date.
4. **Higgsfield's `soul/standard` ignores your photo.** It is text-to-image.
   Only `soul/reference` reads `image_reference_url`.
5. **The provider needs a public URL, not bytes.** Store the photo first. On
   localhost with the disk fallback, the provider cannot reach it — tunnel the
   dev server or set a real blob token.
6. **The provider's video URL has no CORS headers,** so the browser cannot
   `fetch` it to build a `File` for Web Share. That is the whole reason
   `/api/video/[id]/file` exists.
7. **`next/image` cannot render in jsdom.** Mock it to a plain `<img>` in the
   Vitest setup, and drop the `fill`, `sizes` and `priority` props so React
   does not warn about unknown DOM attributes.
8. **Vitest ignores `jsconfig.json`.** Set the `@` alias in `vitest.config.mjs`
   as well, or every aliased import fails to resolve.
9. **MongoDB rejects `_id` inside `$set`.** Destructure it out before upserting
   the settings document.
10. **A `503` is not an error.** The paused state has its own banner. Rendering
    it as a failure is the most common way to get this app's UX wrong.
11. **Do not poll with `setInterval`.** A `setTimeout` chain keeps exactly one
    request in flight and stops cleanly on unmount.
12. **`react-doctor` scores a near-empty repository generously.** Set the
    baseline after the shell exists, or the gate catches nothing.
13. **`next/image` refuses an unlisted host.** Generated images live on
    `*.public.blob.vercel-storage.com`; without that entry in
    `next.config.mjs` the result never renders and the error is easy to
    misread as a generation failure.
14. **The `proxy.js` matcher is not a route list.** It is the long negative
    regex in the appendix, which skips `_next` and static file extensions.
    Writing a simpler one changes which requests Clerk sees.
15. **A wrong Tailwind class never errors.** `body-md`, `font-500` and
    `outline-opacity-50` emit no rule at all; `max-w-1280` emits
    `max-width: 320rem`, which constrains nothing. All four look right in the
    markup. This build shipped with them until the appendix made them
    visible — grep the generated CSS for any class you are unsure of.
16. **`{...props}` after `className` silently wins.** A primitive written as
    `<button className={own} {...props}>` loses every one of its own classes
    the moment a caller passes a `className`. React does not warn; the button
    simply renders as unstyled text. Destructure `className` and append it.
17. **`params` on a dynamic route is a Promise, even in a client component,**
    under Next 16 / React 19. `use(params)` is the documented way to unwrap
    it, but it suspends the render — without a `<Suspense>` boundary around
    the page it renders nothing. Resolve it with
    `useEffect` + `Promise.resolve(params).then(setJobId)` instead and gate
    anything that needs it (polling, fetches) on that state being set.
18. **`react-hooks/set-state-in-effect` rejects a synchronous `setState` in an
    effect body**, including the natural way to reset a counter. Move the
    reset into that same effect's cleanup function (`return () => { ...;
    setSeconds(0); }`) — that pattern is accepted by the rule.

## 11. Definition of done

- `npm run docs:appendix` in the rebuild produces a file identical to the
  original `REPLICATION-APPENDIX.md`. This is the exactness check; run it last.
- Every scenario in the five specs has a test that failed before its code existed.
- `npm run lint`, `npm test`, `npm run build` and `react-doctor` are green, with
  no provider credentials present.
- The suite runs with no network access.
- No raw palette hex outside `globals.css`.
- No screen scrolls horizontally at 360px.
- The app installs to the home screen on iOS and Android.
- The owner can pause all generation from the dashboard and unpause it, without
  a redeploy.
