# AI Media Generator Constitution

## Core Principles

### I. Test-First (NON-NEGOTIABLE)

Commit the failing test, then the code that passes it. Every scenario in the
specification gets a test that failed before its implementation existed, and
that ordering is checkable in the git history.

A behaviour whose test was written after the code asserts what the code
happens to do, not what the specification requires. It does not count as done.

The original plan for this product listed tests as a non-goal. This principle
overrides that deliberately and on the record.

### II. The Suite Runs Offline (NON-NEGOTIABLE)

No test may require an API key, a network connection, or a database. The whole
suite passes on a fork with no secrets.

Two mocking seams enforce this: screens mock HTTP at the route boundary,
routes and library modules mock the provider clients and the database. A test
that needs a credential is a test nobody runs.

### III. Build Only What Is Listed

The specification's out-of-scope list is binding, not advisory. No billing, no
queues, no retries, no provider fallback, no history, no role hierarchy beyond
owner and everyone, no i18n, no error taxonomy, no TypeScript, no state
manager, no ORM, no component library.

The whole application is roughly a dozen files of code. A pull request that
adds materially more than the plan lists is over-built and gets sent back.
Scaffolding for a future need counts as over-building.

### IV. Tokens Are The Theme

The palette exists once, in `app/globals.css`, as `@theme` custom properties.
A raw palette hex anywhere else is a defect and a test asserts its absence.
Only the type classes named in the design system exist; a class not on that
list emits no CSS and Tailwind will not warn you.

Dark only. No light mode, no `dark:` variants, no theme toggle.

### V. File Ownership Defines Parallelism

Every task declares the files it owns and the files it must never touch. No
file appears in two ownership lists. Two agents in two worktrees cannot
conflict when the lists are disjoint, and every cross-task call is pinned to a
signature before either side is written.

A task that needs a change in a file it does not own raises it. It does not
commit it.

A task boundary that is not also a file boundary produces merge conflicts, so
a proposed new split must pin its new seams first.

### VI. The Appendix Wins

`docs/REPLICATION-APPENDIX.md` holds all 80 source files verbatim, generated
from the repository by `npm run docs:appendix`. Where a prose description and
the appendix disagree, the appendix wins — it is generated from the running
app and cannot drift.

The rebuild is finished when regenerating the appendix and diffing against the
original produces an empty diff. Every difference is either a file that is
wrong or a deliberate change. There is no third case.

## Additional Constraints

The stack is fixed and is not a task-time decision: Next.js 16.3 App Router on
Turbopack, JavaScript with no TypeScript, React 19.2, Tailwind v4 configured
in CSS, Clerk for auth, MongoDB Atlas through the official driver with no
Mongoose, Vercel Blob for storage, Higgsfield as the single generation
provider, Vitest with Testing Library and MSW, Playwright for one smoke spec.

Code style: arrow functions and named exports, `export default` only where the
framework demands it. No class components. No `useEffect` where an event
handler will do. State is `useState` and `fetch`, nothing more.

Every screen is written for a 360px viewport first and widened with `md:` and
`lg:` prefixes. No `max-width` media queries anywhere — the direction stays
greppable.

Accessibility floors that are not negotiable: every control at least 44px
tall, a visible focus ring on every interactive element, and body text
clearing 4.5:1 contrast on the canvas and on every surface step.

## Development Workflow

CI runs on every push and pull request: `npm ci`, then lint, then a
`react-doctor` score compared against the committed baseline, then the suite.
The baseline is raised to the merged score and never lowered.

Deliberate ceilings are commented where they are taken, naming the ceiling and
the upgrade path. Two exist today and are recorded in the plan's complexity
table.

Review checks the diff against Principle III first. The most common failure in
this codebase is not a bug, it is code that should not exist.

## Governance

This constitution supersedes any other practice, habit, or preference,
including the defaults an agent brings with it.

Amendments require a pull request that states which principle changes, why,
and what in the repository has to change with it. A principle that cannot be
checked by a reviewer or a test does not belong here.

Every pull request verifies compliance. Complexity must be justified in the
plan's complexity table before it is written, not after.

**Version**: 1.0.0 | **Ratified**: 2026-08-16 | **Last Amended**: 2026-08-16
