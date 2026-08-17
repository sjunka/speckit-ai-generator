# Feature Specification: AI Media Generator

**Feature Branch**: `001-ai-media-generator`

**Created**: 2026-08-16

**Status**: Draft

**Input**: Converted by hand from `docs/REPLICATION-PROMPT.md` §1–§8 and the five
capability specs it describes. The source document is the build contract; this
file is its WHAT and WHY, restated in the Spec Kit shape with the technology
moved to `plan.md`.

## User Scenarios & Testing *(mandatory)*

Four journeys. The first is a shippable product on its own; each later one adds
a capability without breaking the ones before it.

The design system is not a user story. It is a cross-cutting requirement, and it
appears below under Functional Requirements and in the Foundational phase of
`tasks.md`.

### User Story 1 - A photo becomes a generated image (Priority: P1)

Someone opens the product, signs in, photographs whatever is in front of them,
picks a mood from a short list, and watches an AI image of that photo appear on
the same screen. Nothing else is needed for the product to be worth using.

**Why this priority**: This is the whole promise in one screen. Every later
story starts from an image that this story produced, so nothing ships before
it does.

**Independent Test**: Sign in on a phone, take a photo, pick a mood, activate
generate, and see a generated image appear without leaving the screen. No video,
no dashboard, no sharing needed.

**Acceptance Scenarios**:

1. **Given** a visitor with no session, **When** they open the root route, **Then** the page renders without redirecting and offers exactly one call to action, which leads to sign-in
2. **Given** a visitor with a valid session, **When** they open the root route, **Then** they are sent to the capture screen instead of seeing the landing page
3. **Given** a signed-in user on a mobile device, **When** they activate the capture control, **Then** the native rear camera opens; on a desktop browser the same control opens a file picker restricted to images
4. **Given** a photo has been selected, **When** the user selects a second photo, **Then** the preview shows the second photo
5. **Given** no photo has been selected, **When** the capture screen renders, **Then** the generate control is disabled
6. **Given** a photo and a mood are selected, **When** the user activates generate, **Then** a progress state appears, the picked mood reaches the generation request, and the generated image then appears on the same screen
7. **Given** the mood control is rendered, **When** the user opens it, **Then** it offers exactly ten fixed moods with the first selected by default, and no free-text alternative
8. **Given** generation fails, **When** the failure is reported, **Then** a plain message is shown and the selected photo is still selected, so retrying costs nothing
9. **Given** a request carries no valid session, **When** it reaches the generation endpoint, **Then** it is refused and no paid provider is contacted

---

### User Story 2 - The image becomes a video (Priority: P2)

Having got an image worth keeping, the user turns it into a short video and
waits on a screen that tells them it is still working, then plays the clip.

**Why this priority**: The video is what the product is named for, but it is
worthless without US1's image to render from, and the image alone already
delivers value.

**Independent Test**: From a generated image, activate the make-video control,
land on a result screen showing a progress state, and watch the finished clip
play inline once the render completes.

**Acceptance Scenarios**:

1. **Given** no image has been generated, **When** the capture screen renders, **Then** no make-video control is shown
2. **Given** a generated image is on screen, **When** the user activates make-video, **Then** a render job starts and the user arrives at the result screen for that job
3. **Given** a job is still rendering, **When** the result screen is open, **Then** a progress indicator and a "Rendering your video" message are shown, and the status is requested again three seconds after each response
4. **Given** a job reports finished, **When** the next status response arrives, **Then** polling stops and the clip plays inline with user controls rather than opening full-screen
5. **Given** a job reports failed, **When** the result screen receives it, **Then** polling stops, a plain message is shown with a link back to capture, and no player is rendered
6. **Given** the user navigates away while a job is pending, **When** the screen unmounts, **Then** no further status requests are made
7. **Given** a job id that does not exist, **When** the result screen opens for it, **Then** a plain not-found message is shown with a link back to capture
8. **Given** a job has already been recorded as finished, **When** its status is read again, **Then** the stored result is returned without contacting the render provider a second time

---

### User Story 3 - The video leaves the device (Priority: P3)

The finished clip is saved to the phone, or handed to the native share sheet
where the platform offers one.

**Why this priority**: A video that cannot leave the device is a demo. But
US2's playback is independently useful, so this is a separate slice.

**Independent Test**: With a finished video on screen, save it to the device
with the download control; on a platform that supports file sharing, open the
native share sheet carrying the video as an attachment.

**Acceptance Scenarios**:

1. **Given** a finished video, **When** the result screen renders, **Then** a download control saves the file to the device without going through a share sheet
2. **Given** a platform that supports sharing files, **When** the user activates the share control, **Then** the native share sheet opens carrying the video as a file attachment with a title
3. **Given** a platform that does not support sharing files, **When** the result screen renders, **Then** the share control is absent and the download control still works

---

### User Story 4 - The owner stops the spend (Priority: P4)

One owner has a screen with a switch that halts all generation, a quality tier
that trades cost against fidelity, counters, and an estimated bill.

**Why this priority**: It protects against a runaway provider bill rather than
delivering the product's value, so it comes after the pipeline works. It is
also the only story that touches real accounts and keys.

**Independent Test**: As the owner, open the dashboard, turn generation off,
confirm the next generation attempt is refused, turn it back on, confirm
generation resumes — all without a redeploy.

**Acceptance Scenarios**:

1. **Given** the switch is off, **When** a generation request arrives, **Then** it is refused with a paused response and no paid provider is contacted
2. **Given** the switch is off, **When** the capture screen loads, **Then** a paused banner is shown and the generate control is disabled — the paused state is never presented as an error
3. **Given** no settings record exists, **When** the product is used, **Then** generation is treated as enabled and video rendering uses the lowest-cost tier, so it works before the dashboard is ever opened
4. **Given** the switch is off, **When** the dashboard, the job status read, or any page render is requested, **Then** each works normally — the switch stops new generation only
5. **Given** the owner sends a partial settings update, **When** it is applied, **Then** the named field persists, the other is left untouched, and the full current settings are returned
6. **Given** a signed-in user who is not the owner, **When** they open the dashboard or call the settings endpoint, **Then** they receive a not-found response that discloses no settings values
7. **Given** the dashboard renders, **When** the owner reads it, **Then** it shows total images, total videos, generations today, and one estimated spend figure computed from those counters and fixed per-asset costs, labelled as an estimate
8. **Given** the owner selects a quality tier, **When** a render then starts, **Then** it is submitted at that tier, chosen from exactly three fixed options

---

### Edge Cases

- The switch is turned off while a video is already rendering: the job keeps rendering and its status stays readable. The switch gates new generation, not existing work.
- A user picks a second photo after generating an image: the preview replaces, and the previously generated image stays until the next generation replaces it.
- A status read returns a server error that is not "not found": this is not a job state, so polling continues rather than treating it as a failure.
- A generated video's stored URL is missing when the file is requested: not found, rather than an empty stream.
- The first settings write happens when no record exists: the record is created with the written field and the documented default for the other.
- A user reaches the result screen for a job belonging to someone else: the job is addressed by an unguessable id; no enumeration is offered anywhere.

## Requirements *(mandatory)*

### Functional Requirements

**Capture and generation**

- **FR-001**: The root route MUST be public and MUST present a hero, one sentence, and exactly one call to action, with no features grid, FAQ, or pricing
- **FR-002**: A visitor with a valid session MUST be redirected from the root route to capture before the landing page renders
- **FR-003**: Sign-in MUST be delegated to a hosted authentication provider offering Google and email; no credential form may be hand-written
- **FR-004**: Capture, result, and dashboard routes MUST require a session; the generation endpoints MUST additionally check the session themselves rather than trusting the route matcher
- **FR-005**: The capture screen MUST take a photo through the device's native camera on mobile and its file picker on desktop, using one file input rather than a custom camera
- **FR-006**: The hint MUST be a mood chosen from a fixed list of ten, not free text, so the prompt sent to the provider is always well formed
- **FR-007**: Generation MUST happen without leaving the capture screen, showing a progress state with elapsed seconds while it runs
- **FR-008**: The system MUST store the user's photo before generation and the generated image after it, and MUST return the stored image's public URL
- **FR-009**: A successful generation MUST write one record carrying the caller's user id, the kind of asset, its status, its stored URL, and a creation timestamp
- **FR-010**: A provider failure MUST produce a plain message and MUST NOT leave a record marked ready

**Video and result**

- **FR-011**: Starting a video MUST return a job id the client can poll, and MUST record the job as pending with the provider's job id and the source image URL
- **FR-012**: The result screen MUST poll a pending job every three seconds and MUST stop on finished, on failed, on not-found, and on unmount
- **FR-013**: The first observation of a finished render MUST persist the output URL; later reads MUST be served from that record without contacting the provider again
- **FR-014**: A finished video MUST play inline with user controls, never opening full-screen
- **FR-015**: A finished video MUST be downloadable directly, and MUST be shareable through the native share sheet only where the platform supports sharing files
- **FR-016**: The stored video MUST be readable through the product's own origin, so a browser can read its bytes to build a shareable file

**Cost controls**

- **FR-017**: Generation MUST be gated on a single persisted flag; when it is off the system MUST refuse to generate and MUST NOT contact any paid provider
- **FR-018**: An absent settings record MUST mean enabled, at the lowest-cost video tier
- **FR-019**: Turning the flag off MUST take effect on the next request, with no redeploy or restart
- **FR-020**: A refused-because-paused response MUST be rendered as a paused banner, never as an error
- **FR-021**: The persisted quality setting MUST select which video model renders the clip and MUST affect no other step
- **FR-022**: Reading and writing settings MUST be restricted to the owner, identified by comparing the caller's user id to a configured owner id; everyone else receives not-found
- **FR-023**: The dashboard MUST carry exactly four things — the switch, the quality selector, three counters, and one estimated spend figure — and MUST remain reachable while generation is off
- **FR-024**: Dashboard access and settings-endpoint access MUST be two independent checks

**Cross-cutting**

- **FR-025**: The palette MUST be defined once as tokens; no raw palette value may appear elsewhere, and a test MUST assert its absence
- **FR-026**: Only the documented type classes MUST exist; body copy uses the two documented body classes and nothing else
- **FR-027**: Every interactive element MUST be at least 44px tall and MUST carry a visible focus ring
- **FR-028**: Body text MUST clear 4.5:1 contrast on the canvas and on every surface step
- **FR-029**: Every screen MUST be built for a 360px viewport first and widened upward; no screen may scroll horizontally at 360px
- **FR-030**: The product MUST install to the home screen on iOS and Android and open without browser chrome
- **FR-031**: Every scenario above MUST have a test that failed before its implementation existed
- **FR-032**: The whole test suite MUST pass with no provider credentials, no database, and no network access
- **FR-033**: Continuous integration MUST run lint, a code-health score against a committed baseline, and the suite, and MUST fail when a test fails or the score drops

### Key Entities

- **Generation**: one record per produced asset. Carries who made it, whether it is an image or a video, its status, the URL it was stored at, and when it was created. A video record additionally carries the provider's job id and the image it was rendered from, and gains its URL on the first read that observes a terminal provider state.
- **Settings**: exactly one record for the whole product. Carries whether generation is enabled and which video quality tier is selected. Its absence means enabled at the lowest tier.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user goes from opening the product to a generated image on screen in under 90 seconds on a phone, without a keyboard except at sign-in
- **SC-002**: A user goes from a generated image to a playing video without any manual refresh, with the screen never showing a blank or ambiguous state while the render runs
- **SC-003**: The full test suite passes in under 60 seconds with no network interface available and no environment variables set
- **SC-004**: Every scenario in this specification maps to at least one test, and the git history shows each of those tests failing before the code that satisfies it
- **SC-005**: The owner turns generation off and the very next generation attempt is refused, with no redeploy and no restart
- **SC-006**: Application code totals roughly a dozen files; a build that produces materially more has over-built
- **SC-007**: No screen scrolls horizontally at a 360px viewport width
- **SC-008**: Regenerating the source appendix from the finished repository and diffing it against the original produces an empty diff
- **SC-009**: Continuous integration passes on a fork with no secrets configured

## Assumptions

- One user role beyond signed-in: the owner. There is no team, no organisation, and no permission hierarchy, and none is scaffolded for.
- One generation provider serves both the image and the video job. The original plan assumed three providers and a four-tier model selector; the shipped product uses one provider and selects video quality instead. That earlier plan has been deleted rather than kept, because a stale document describing a pipeline the product does not have is a trap for the next reader.
- Users have a network connection and a modern mobile browser. There is no offline mode.
- Status codes, module signatures, route shapes, colour values, and copy strings are deliberately absent from this file and pinned in `plan.md` and in `docs/REPLICATION-PROMPT.md` §5–§7. The tests assert those exact values; this file states the behaviour they encode.
- The out-of-scope list in `docs/REPLICATION-PROMPT.md` §1 is binding and is restated as Principle III of the constitution.
- Tests were a stated non-goal of the original product spec. That was overridden deliberately, and the override is recorded in the constitution rather than applied quietly.

## Clarifications

### Questions this file answers

| # | Question | Section | Source | Answer |
|---|---|---|---|---|
| Q1 | Who uses this and what are they trying to finish? | User Scenarios | Answered | One user photographing something and wanting an AI video of it; one owner watching the bill. |
| Q2 | What is the smallest shippable slice? | User Story 1 | Answered | Sign in, photo, mood, generated image on the same screen. No video needed. |
| Q3 | Is the design system a user story? | User Scenarios | Answered | No — a cross-cutting requirement (FR-025 to FR-030) and a Foundational phase in tasks.md. |
| Q4 | What is explicitly out of scope? | Assumptions | Answered | Billing, queues, retries, provider fallback, history, role hierarchy, i18n, error taxonomy, TypeScript, state manager, ORM, component library. |
| Q5 | How is success measured in numbers? | Success Criteria | Answered | Under 90s to first image, suite green offline in under 60s, empty appendix diff, roughly a dozen application files. |
| Q6 | What happens when generation is paused mid-flight? | Edge Cases | Answered | Existing jobs keep rendering and stay readable; only new generation is refused. |
| Q7 | Should status codes and copy strings live here? | Assumptions | Answered | No. Behaviour here, exact values in plan.md and REPLICATION-PROMPT.md §5–§7, because the tests assert those values. |
| Q8 | Are dashboard access and settings access the same check? | FR-024 | Answered | No — two independent checks, one on a role claim and one on a configured owner id. |
| Q9 | Were tests always required? | Assumptions | Answered | No. The original spec listed them as a non-goal; the override is deliberate and recorded. |
| Q10 | What defines done for the whole feature? | Success Criteria | Answered | SC-008: regenerate the appendix, diff against the original, and get nothing. |
