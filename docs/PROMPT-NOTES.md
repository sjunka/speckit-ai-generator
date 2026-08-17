# How the replication prompt was written

[`REPLICATION-PROMPT.md`](REPLICATION-PROMPT.md) rebuilds this app from an
empty directory. This file explains why it is shaped that way, so you can bend
it to a different product instead of copying it blind.

## The problem it solves

An agent handed "build an AI media generator" invents. It picks a provider, a
folder layout, a colour, a status code, and every one of those guesses is a
place the rebuild diverges from the original. A prompt that reproduces a
specific app has to remove the invention, not the work.

So the prompt is built from one rule: **anything the agent would otherwise
guess is written down, and everything else is left to it.** Tokens, copy
strings, status codes, module signatures, collection names — written down.
How to lay out a component, name a local variable, order the JSX — not
written down, because guessing there is harmless.

## Why there is an appendix

Prose gets you a faithful app, not an identical one. Behaviour can be pinned by
tests, and colour by hex codes, but nothing in a description pins the SVG path
of an icon, the order of props on a component, or a regex in a route matcher.
Three teammates working from prose alone would produce three apps that pass the
same tests and do not look the same.

So the target state is a generated file:
[`REPLICATION-APPENDIX.md`](REPLICATION-APPENDIX.md) holds all 80 source files
verbatim, produced by `npm run docs:appendix` from the repository itself. It
cannot drift, because regenerating it is one command and CI-checkable.

That splits the two documents cleanly. The prompt says what to build, in what
order, with which tests, and which sixteen mistakes not to make — the part a
copy of the source cannot teach. The appendix says exactly what the result
looks like. Work the prompt, use the appendix as the answer key, and finish by
regenerating it and diffing: an empty diff is the definition of done.

It also earns its keep as a review surface. Writing it turned up six
classNames that Tailwind accepts and does nothing with — `body-md`, `body-lg`,
`font-500`, `outline-opacity-50`, `max-h-3xl`, and `max-w-1280`, which emits a
5120px maximum. Two tests asserted a dead class by name and passed. All six are
fixed now, and the appendix inherited the fix on the next regenerate — which is
the property worth having: one source of truth, one command, no second copy to
update.

Re-shooting the screenshots afterwards found a seventh: every primitive
spread `{...props}` after its own `className`, so any caller passing one
replaced the component's styles wholesale and the primary buttons rendered as
plain text. Tests asserting class names on a default-props render could not see
it. Two habits caught what the suite could not — regenerate the appendix, and
look at the app.

## Why it is ordered the way it is

Sections 1–8 are material. Section 9 is the plan. An agent reads top to bottom
and hits the tasks with every contract already in context, so a task can say
"implement `POST /api/image`" in one line instead of re-describing the route.

The three sections that carry the most weight:

- **§5 Contracts.** Module signatures and the HTTP table. These exist so that
  parallel tasks never wait on each other — a task writes against the
  signature, and the file it calls arrives later on another branch.
- **§6 Design system.** Written as a value table, not as adjectives. "Dark and
  minimal" reproduces nothing; `--color-canvas: #010102` and `-3px` tracking at
  80px reproduce exactly.
- **§10 Traps.** Sixteen things that each cost an hour the first time. This is
  the section with the highest value per line in the whole file, and the one
  you can only write *after* building the thing.

## Why five tasks in that shape

The constraint was: one bootstrap, three in parallel, one merge.

**Parallelism comes from file ownership, not from good intentions.** Each task
lists what it owns and what it must never touch. Two agents in two worktrees
cannot conflict if no file appears in two lists. Every cross-task call is
pinned in §5, so the seams are agreed before anyone writes a line.

The splits worth explaining:

- **Bootstrap is not one of the parallel tasks.** Three tasks cannot each
  create `package.json`. It is the one ordering constraint in the plan, and
  keeping it explicit is what keeps the rest genuinely parallel.
- **The Vitest config lands in bootstrap,** not in the design-system task. If
  it landed later, three tasks could write tests but not run them until it
  merged — one wait, reintroduced for no reason.
- **Front end (T2) versus back end (T3).** The screens only ever call `fetch`.
  That is what lets them be tested against MSW handlers while the routes they
  describe do not exist yet.
- **The dashboard is its own task (T4), not part of either.** It straddles
  both — it has a screen and a route — and it is the only task that touches
  real accounts and keys. Isolating it means one agent does the account setup
  once while the other two keep working offline.
- **T5 is a real task, not a formality.** The merge is where a parallel build
  actually fails: T2 tested against handlers, not against T3's routes. Step 5.2
  reconciling those two is the single most important instruction in the plan.

## Why test-first is stated as a rule, not a preference

The original spec for this app listed tests as a non-goal. That was overridden
deliberately, and the prompt records the override rather than quietly
disagreeing with its source.

An agent told "write tests" writes them after the code, asserting what the
code happens to do. The prompt therefore states the loop as a sequence —
commit the failing test, then the code that passes it — and the definition of
done says "a test that failed before its implementation existed." That phrasing
is checkable in the git history, which is the point.

The two mocking seams (§8) exist for the same reason: a test that needs an API
key is a test nobody runs. Everything runs offline, so CI runs it on every
push, including on forks with no secrets.

## Reading the specs alongside it

[`openspec/specs/`](../openspec/specs/) holds the five capability specs as
requirements and scenarios. They are the behaviour contract; the prompt is the
build order. If the two ever disagree, the specs win — they are what the tests
assert.

The original plan for this app assumed three providers — one for prompt
enhancement, one for images, one for video — and a four-tier model selector on
the dashboard. The provider turned out to do both generation jobs, so the
shipped app uses one, and the dashboard selects video quality instead. That
plan has been deleted rather than kept as history: a stale document describing
a pipeline the app does not have is a trap for the next reader, and for any
agent given the repository to work in.

The lesson is in the prompt's shape. It documents the app as built, and its
provider-specific parts are quarantined in §5 and traps 4–6 so the next
substitution costs one file.

## Using it with OpenSpec

The [OpenSpec](../openspec/) loop is propose → apply → archive:

```
/opsx:propose  Build the app in docs/REPLICATION-PROMPT.md
/opsx:apply    # per task
/opsx:sync     # fold delta specs into openspec/specs/
/opsx:archive
```

The prompt is written to feed that loop directly: §3 becomes the capability
list, §5–§7 become the requirement scenarios, §9 becomes `tasks.md` almost
verbatim. Review the generated `design.md` before applying — that is where
guesses would show up.

## Using it with Spec Kit

```
/specify    # §1–§8 as the description
/plan       # §2 and §5–§7 as the technical context
/tasks      # §9 verbatim — do not let it re-derive the split
/implement
```

Spec Kit likes to regenerate the task breakdown. Paste §9 as-is: the ownership
tables are what make the parallelism safe, and a regenerated split loses them.

## Adapting it

- **Different provider.** §5's provider block and §10's traps 4–6 are the only
  provider-specific parts. Replace them and `lib/higgsfield.js`; nothing else
  moves.
- **Different look.** Replace §6 wholesale. Keep the shape — token table, type
  table, enforcement rules — because that shape is what makes the design
  testable.
- **More parallelism.** Split by file ownership again, and pin every new seam
  in §5 first. A task boundary that is not also a file boundary will produce
  merge conflicts.
- **Less scope.** Delete whole tasks, not parts of them. The tasks are sized so
  that dropping one leaves a working app minus a capability.
