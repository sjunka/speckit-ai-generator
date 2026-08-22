# Feature Specification: Gallery, Moods, Wall and In-Page Camera

**Feature Branch**: `002-gallery-moods-wall-camera`

**Created**: 2026-08-21

**Status**: Draft

**Input**: Four capabilities layered on top of the shipped product specified in
`specs/001-ai-media-generator/spec.md`: a private gallery of one's own
generations, two new emotions with intensity levels, a publish flag that feeds a
public wall, and a live in-page camera preview replacing the native camera
hand-off.

## Relationship to Feature 001

This specification **extends** `specs/001-ai-media-generator/spec.md`. That file
is not edited; everything new lives here. Where the two disagree, this file wins
for the areas it names below and nowhere else.

**Explicit replacements** — this feature supersedes exactly these parts of 001:

| 001 item | What it said | What replaces it |
|---|---|---|
| User Story 1, Acceptance Scenario 7 | The mood control offers exactly ten fixed moods, first selected by default, no free text | Superseded by US2 of this spec: exactly three fixed emotions, `happy` selected by default, no free text, plus a level selector on the two new emotions |
| FR-006 | The hint MUST be a mood chosen from a fixed list of ten | Superseded by FR-008 and FR-009 of this spec: a fixed list of three emotions, composed with a fixed list of three levels for the two new ones |
| User Story 1, Acceptance Scenario 3 | The capture control opens the native rear camera on mobile and a file picker on desktop | Extended, not replaced, by US4: an in-page live camera preview is added alongside the file picker; the file picker path from 001 keeps working unchanged |
| FR-005 | Capture uses the device's native camera on mobile and file picker on desktop, using one file input rather than a custom camera | Extended by FR-021 to FR-027: an in-page camera preview becomes the primary capture path where a camera is available; the file input remains and remains sufficient on its own |

**Everything else in 001 stands unchanged.** In particular, the spend switch of
001's User Story 4 (FR-017 to FR-020) still governs: while generation is paused,
nothing described in this specification contacts a paid provider.

## User Scenarios & Testing *(mandatory)*

Four journeys, each independently shippable on top of the existing product.

### User Story 1 - The gallery (Priority: P1)

A signed-in user opens a gallery and sees the things they generated, newest
first, and nothing belonging to anybody else. Each entry shows the emotion — and
where one applies, the level — that produced it.

**Why this priority**: The product already produces assets and then forgets
them. Making a user's own output findable is the smallest addition that turns a
one-shot toy into something worth returning to, and it depends on nothing else
in this feature.

**Independent Test**: Sign in as a user with several generations and at least
one generation belonging to a different user. Open the gallery. See only your
own, ordered newest first, with no other user's asset present anywhere.

**Acceptance Scenarios**:

1. **Given** a signed-in user with generations, **When** they open the gallery, **Then** their own generations are listed newest first
2. **Given** generations belonging to other users exist, **When** the gallery renders, **Then** none of them appear and no control reveals them
3. **Given** a signed-in user with no generations, **When** they open the gallery, **Then** an empty state is shown with a route back to capture, and no error
4. **Given** a request with no valid session, **When** it reaches the gallery data, **Then** it is refused and no other user's data is disclosed
5. **Given** a user has generated both images and videos, **When** the gallery renders, **Then** both kinds appear in the same list, each presented as its own kind
6. **Given** a generation carries a stored emotion and level, **When** its gallery entry renders, **Then** that emotion is shown, with the level shown only where the emotion has one
7. **Given** a generation created before this feature and carrying no stored emotion, **When** its gallery entry renders, **Then** the entry renders without an emotion label rather than failing
8. **Given** more generations exist than one page holds, **When** the gallery first loads, **Then** only the first bounded page is fetched, and the rest arrive only when the user asks for more
9. **Given** a video generation that is still pending, **When** the gallery renders, **Then** its entry shows its status rather than a broken player

---

### User Story 2 - Three emotions with levels (Priority: P2)

The mood list shrinks from ten to three: happy, angry, and sad. The two new ones
carry a level — a bit, quite, or very — that is folded into the same hint string
already sent to the provider.

**Why this priority**: It changes the core generation call that every other part
of the product depends on, so it lands early; but the gallery is useful without
it, so it is not first.

**Independent Test**: Open capture, confirm exactly three emotions with happy
preselected and no level selector; pick angry, confirm a level selector appears
with quite preselected; generate; confirm the request carried
`I am feeling quite angry 😠` and that the resulting generation records the
emotion and level.

**Acceptance Scenarios**:

1. **Given** the emotion control renders, **When** the user opens it, **Then** it offers exactly three emotions — happy, angry, sad — with happy selected by default and no free-text alternative
2. **Given** happy is the selected emotion, **When** the capture screen renders, **Then** no level selector is shown
3. **Given** the user selects angry or sad, **When** the control updates, **Then** a level selector appears offering exactly `a bit`, `quite`, `very`, with `quite` preselected
4. **Given** happy is selected, **When** the user generates, **Then** the hint sent to the provider is exactly `I am feeling happy 😊`
5. **Given** angry and `very` are selected, **When** the user generates, **Then** the hint sent to the provider is exactly `I am feeling very angry 😠`
6. **Given** sad and `a bit` are selected, **When** the user generates, **Then** the hint sent to the provider is exactly `I am feeling a bit sad 😢`
7. **Given** the user switches from angry back to happy, **When** the control updates, **Then** the level selector disappears and the hint carries no level
8. **Given** a generation request naming an emotion outside the three, **When** it reaches the generation endpoint, **Then** it is refused and no paid provider is contacted
9. **Given** a generation request naming a level outside the three, **When** it reaches the generation endpoint, **Then** it is refused and no paid provider is contacted
10. **Given** a generation request naming happy together with a level, **When** it reaches the generation endpoint, **Then** it is refused and no paid provider is contacted
11. **Given** a generation succeeds, **When** its record is written, **Then** it carries the emotion used, and the level used where the emotion has one

---

### User Story 3 - The public wall (Priority: P3)

A user publishes one of their finished generations. It appears on a wall that
anyone can see, signed in or not. The owner can unpublish it, and that is the
only way anything leaves the wall.

**Why this priority**: It is the first thing here that exposes a user's output
to strangers, so it lands after the private gallery it builds on and after the
emotion change it displays.

**Independent Test**: Publish a finished generation, open the wall in a browser
with no session and see it there, unpublish it as its owner, reload the
sessionless wall and confirm it is gone.

**Acceptance Scenarios**:

1. **Given** a signed-in owner viewing a ready generation of theirs, **When** they activate publish, **Then** the generation is marked public and the control switches to unpublish
2. **Given** a public generation, **When** its owner activates unpublish, **Then** it is marked not public and disappears from the wall on the next load
3. **Given** a visitor with no session, **When** they open the wall, **Then** it renders without redirecting to sign-in and shows the published generations, newest first
4. **Given** a generation that is not public, **When** the wall renders, **Then** it does not appear there for anyone, including its owner
5. **Given** a signed-in user who is not the owner, **When** they attempt to publish or unpublish a generation, **Then** the attempt is refused and the generation's stored state is unchanged
6. **Given** a request with no valid session, **When** it attempts to publish or unpublish, **Then** it is refused and the generation's stored state is unchanged
7. **Given** a generation that is not yet ready, **When** its owner attempts to publish it, **Then** the attempt is refused and the generation stays not public
8. **Given** a generation created before this feature, **When** it is read anywhere, **Then** it is treated as not public
9. **Given** published images and published videos both exist, **When** the wall renders, **Then** both appear in the same list, each presented as its own kind
10. **Given** more published generations exist than one page holds, **When** the wall first loads, **Then** only the first bounded page is fetched, and the rest arrive only when the viewer asks for more
11. **Given** a generation id that does not exist, **When** a publish or unpublish is attempted on it, **Then** a plain not-found response is returned

---

### User Story 4 - The in-page camera (Priority: P4)

Instead of handing off to the system camera app, the capture screen shows a live
preview in the page. The user frames the shot and takes it without leaving. The
file picker stays available for everyone the camera does not serve.

**Why this priority**: It replaces a capture path that already works, so it
delivers polish rather than new capability, and it is the safest thing to ship
last.

**Independent Test**: Open capture on a device with a camera, grant permission,
see a live preview inside the page, take a photo, and confirm it becomes the
selected photo exactly as a picked file would. Then deny permission on a second
device and confirm the file picker still produces a selected photo with no error
shown.

**Acceptance Scenarios**:

1. **Given** a signed-in user on the capture screen, **When** they turn the camera on, **Then** a live preview renders inside the page and no system camera application opens
2. **Given** a live preview is showing, **When** the user takes the photo, **Then** it becomes the selected photo, the preview shows it, and generate becomes enabled exactly as with a picked file
3. **Given** a live preview is showing, **When** the photo is taken, **Then** the camera is released
4. **Given** a live preview is showing, **When** the user leaves the capture screen, **Then** the camera is released
5. **Given** camera permission is denied, **When** the capture screen renders, **Then** the file picker remains usable, no error is shown, and the paused/enabled state of generation is unaffected
6. **Given** no camera is accessible on the device, **When** the capture screen renders, **Then** the file picker remains usable and no error is shown
7. **Given** a device with more than one camera, **When** the camera turns on, **Then** the rear camera is used by default and a control switches to another
8. **Given** the user switches cameras, **When** the new preview appears, **Then** the previous camera is released
9. **Given** a photo was taken with the camera, **When** the user then picks a file, **Then** the picked file replaces it, matching 001's existing replace behaviour

---

### Edge Cases

- A generation is published and its owner then deletes nothing (there is no delete): the only way off the wall is the owner unpublishing. There is no moderation queue, no report control, and no reviewer role.
- Someone else's published generation is offensive: outside this feature's scope. The single available correction is the owner unpublishing it.
- A video is published while still rendering: refused — only a ready generation can be published.
- A video is published, finishes rendering, and its stored URL arrives later: the wall entry reflects the record as it stands at read time.
- Publish is activated twice in a row: the second is a no-op on an already-public generation, not an error.
- Generation is paused by 001's spend switch: the gallery, the wall, publishing, unpublishing, and the camera preview all keep working. Only new generation is refused, and no paid provider is contacted.
- The gallery is opened while a video job is pending: the entry shows its pending status; the gallery does not poll the render provider.
- A user asks for a page of gallery or wall results beyond the last one: an empty page is returned, not an error.
- Camera permission is granted, then revoked in browser settings while the screen is open: the preview stops and the file picker is still usable, with no error surfaced.
- The camera is on and the user takes no photo before navigating away: the camera is released regardless.

## Requirements *(mandatory)*

### Functional Requirements

**Gallery (US1)**

- **FR-001**: A signed-in user MUST be able to reach a gallery listing the generations they created, ordered newest first
- **FR-002**: The gallery MUST show only the caller's own generations; no request, parameter, or control may surface another user's generation
- **FR-003**: The gallery data MUST require a valid session and MUST check that session itself rather than trusting the route matcher
- **FR-004**: The gallery MUST list both images and videos, each presented as its own kind, and MUST show a pending video's status rather than a player
- **FR-005**: A gallery entry MUST display the emotion its generation recorded, and the level only where the emotion carries one; an entry whose generation records neither MUST still render
- **FR-006**: The gallery MUST load one bounded first page and fetch further results only on demand; it MUST never fetch the whole collection
- **FR-007**: A gallery with no generations MUST show an empty state with a route back to capture, never an error

**Emotions and levels (US2) — replaces 001's FR-006**

- **FR-008**: The hint MUST be an emotion chosen from a fixed list of exactly three — happy, angry, sad — with happy selected by default and no free-text alternative. This replaces 001's FR-006 and its ten-mood list; the nine moods of 001 other than happy are withdrawn
- **FR-009**: Angry and sad MUST each carry a level chosen from a fixed list of exactly three — `a bit`, `quite`, `very` — with `quite` preselected. Happy MUST NOT offer a level selector and MUST NOT accept a level
- **FR-010**: The level MUST be composed into the same single hint string already sent to the provider, in the forms `I am feeling very angry 😠` and `I am feeling a bit sad 😢`; happy's hint MUST remain exactly `I am feeling happy 😊`, unchanged from 001
- **FR-011**: A generation request whose emotion is not one of the three, whose level is not one of the three, or which pairs happy with a level, MUST be refused before any paid provider is contacted
- **FR-012**: A successful generation MUST record the emotion used, and the level used where the emotion carries one, on the generation record
- **FR-013**: Changing the selected emotion away from angry or sad MUST remove the level from the hint

**Wall and publishing (US3)**

- **FR-014**: A generation record MUST carry a published flag; a record without that flag MUST be read as not published
- **FR-015**: Only the owner of a generation MUST be able to publish or unpublish it; any other caller, including one with no session, MUST be refused and the record MUST be left unchanged
- **FR-016**: Only a generation in a ready state MUST be publishable; publishing anything else MUST be refused
- **FR-017**: Unpublishing MUST be available to the owner at any time and MUST be the only mechanism that removes a generation from the wall; no moderation, review queue, reporting, or reviewer role exists
- **FR-018**: The wall MUST be readable with no session, exactly as the landing route is, and MUST NOT redirect a sessionless visitor to sign-in
- **FR-019**: The wall MUST list published generations newest first, MUST include both images and videos, and MUST exclude every generation that is not published
- **FR-020**: The wall MUST load one bounded first page and fetch further results only on demand; it MUST never fetch the whole collection

**In-page camera (US4) — extends 001's FR-005**

- **FR-021**: The capture screen MUST offer a live camera preview rendered inside the page, without opening a system camera application
- **FR-022**: Taking a photo from the preview MUST produce a selected photo indistinguishable, to the rest of the flow, from one chosen through the file picker
- **FR-023**: The file picker of 001's FR-005 MUST remain available and MUST remain sufficient on its own for completing a generation
- **FR-024**: If camera permission is denied or no camera is accessible, the screen MUST fall back to the file picker silently — no error message may be shown
- **FR-025**: The camera MUST be released when a photo is taken and when the user leaves the capture screen
- **FR-026**: Where more than one camera exists, the rear camera MUST be used by default and a control MUST switch between cameras, releasing the previous one
- **FR-027**: Camera access MUST NOT contact any paid provider and MUST work while generation is paused

**Cross-cutting**

- **FR-028**: While 001's generation switch is off, none of the capabilities in this specification may contact a paid provider; the gallery, the wall, publish, unpublish, and the camera MUST all continue to work
- **FR-029**: Every new screen MUST honour 001's cross-cutting design requirements (FR-025 to FR-030 of 001): tokenised palette, documented type classes only, 44px touch targets with visible focus rings, 4.5:1 body contrast, and a 360px-first layout that never scrolls horizontally
- **FR-030**: Every acceptance scenario above MUST have a test that failed before its implementation existed, and the suite MUST continue to pass with no provider credentials, no database, and no network access

### Key Entities

- **Generation** *(extends 001's Generation)*: gains three things — the emotion that produced it, the level of that emotion where one applies, and a published flag. A record predating this feature carries none of them and is read as: no emotion label, no level, not published. Ownership and readiness, both already on the record in 001, are what publish and unpublish check.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A signed-in user opening the gallery sees their own most recent generation first, and across every listing, page, and control no asset belonging to another user is ever reachable
- **SC-002**: The emotion control offers three options and never ten; a generation request naming anything outside the three emotions or three levels is refused with zero paid-provider calls
- **SC-003**: The exact hint string reaching the provider is one of exactly seven values — happy, plus each of angry and sad at each of the three levels
- **SC-004**: A visitor with no session loads the wall and sees published work without ever being sent to sign-in
- **SC-005**: A generation is on the wall only while its owner has published it; a non-owner's publish or unpublish attempt leaves the stored record byte-identical
- **SC-006**: Neither the gallery nor the wall ever fetches more than one bounded page before the viewer asks for more, at any collection size
- **SC-007**: On a device with a camera, a user goes from opening capture to a taken photo without any system camera application appearing; on a device where the camera is denied or absent, the same user still completes a generation through the file picker with no error shown
- **SC-008**: The camera is not held open after a photo is taken or after the user leaves the screen, verifiable by the device's in-use indicator
- **SC-009**: With generation paused, every capability in this specification remains usable and the paid-provider call count stays at zero
- **SC-010**: Every scenario in this specification maps to at least one test, and the git history shows each of those tests failing before the code that satisfies it
- **SC-011**: The full test suite passes with no network interface available and no environment variables set

## Assumptions

- The three-emotion list is final and closed. No free text, no custom emotion, no user-defined levels, and no scaffolding for adding more later — Principle III of the constitution makes that scaffolding a defect, not foresight.
- The nine withdrawn moods of 001 are removed rather than hidden. Existing generations that recorded one of them keep whatever they recorded; the gallery renders such an entry without an emotion label rather than resurrecting a retired option.
- Publishing is a boolean on the existing generation record, not a separate post, caption, or feed entity. There are no likes, comments, follows, or counts.
- The wall shows every published generation from every user. There is no per-user profile page and no filtering.
- Nothing is published retroactively. The flag's absence means not published, so the migration is a read-time default rather than a data backfill.
- Page size and the "load more" affordance are behavioural requirements here; the exact number is pinned in `plan.md`, following 001's convention of keeping precise values out of the spec.
- The in-page camera is an addition to the capture screen, not a new route. The existing single file input of 001's FR-005 stays where it is.
- Users are on a modern mobile browser with a network connection, as assumed in 001. There is no offline mode and no gallery caching.
- 001's owner/spend dashboard, video pipeline, download, and share behaviours are untouched by this feature.
