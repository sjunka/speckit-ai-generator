# AI Media Generator — Spec Kit build

Clone this and start building. The constitution, the specification, the plan,
the 39 tasks and Spec Kit's own machinery are all committed, so an agent has
everything in context from the first command.

```bash
git clone git@github.com:sjunka/speckit-ai-generator.git && cd speckit-ai-generator
/speckit-implement T001
```

That is the whole setup. No `specify init`, no `uv`, nothing to configure.

> **Guía en español:** [`docs/GUIA-SPEC-KIT.md`](docs/GUIA-SPEC-KIT.md) — el paso
> a paso completo, fase por fase, con los comandos y cómo verificar cada uno.
> También en [PDF](docs/GUIA-SPEC-KIT.pdf) (8 páginas) para repartir impreso.
> Si editas el `.md`, regenera el PDF con `node scripts/build-guide-pdf.mjs`.

## What is here

```
.specify/memory/constitution.md          six principles, all enforceable
.specify/feature.json                    points Spec Kit at the feature below
.specify/scripts/                        Spec Kit helper scripts
.claude/skills/speckit-*/                the /speckit-* commands
specs/001-ai-media-generator/
  spec.md                                WHAT and WHY — no technology
  plan.md                                HOW — stack, contracts, structure
  tasks.md                               39 tasks in 6 phases
docs/REPLICATION-PROMPT.md               §6, §7 and §10 are required reading
docs/REPLICATION-APPENDIX.md             80 source files verbatim — the answer key
docs/PROMPT-NOTES.md                     why the source document is shaped this way
```

The four Spec Kit files were converted **by hand** from
`docs/REPLICATION-PROMPT.md`. They were not generated, and `tasks.md` in
particular must not be regenerated — see the warning at the top of that file.

## Building it

**Solo, in order:**

```
/speckit-implement T001
```

Then work forward. Each task is one line in `tasks.md` with its file paths and
its verify step.

**As a team, after Phase 2 lands on main:**

Phases 3, 4 and 5 have disjoint file-ownership lists, so three people — or three
agents — can run them at once without conflicting.

```bash
git worktree add ../frontend  -b 001-frontend     # then: /speckit-implement T010
git worktree add ../backend   -b 001-backend      # then: /speckit-implement T018
git worktree add ../dashboard -b 001-dashboard    # then: /speckit-implement T026
```

Phase 6 (T031–T039) is the merge, and T032 is the step that catches the one
failure mode a parallel build actually has.

## If you want real ticket numbers

`tasks.md` converts straight into GitHub issues, dependency-ordered:

```
/speckit-taskstoissues
```

After that, `T012` and issue `#12` are the same work, and a teammate runs
`/speckit-implement` against whichever number they were handed.

## Two things that are not the default

**`.specify/feature.json` is committed.** Spec Kit gitignores it as per-machine
state, because a repo normally holds many features and the file tracks which one
you are on. This repo holds exactly one, forever, so it is force-added — without
it every teammate hits *"Feature directory not found"* after cloning and nothing
runs. If you ever add a second feature, stop committing it.

**The `.claude/skills/` commands are committed.** That means a clone works with
no setup, but it also pins the agent to Claude. On a different agent, run:

```bash
uvx --from git+https://github.com/github/spec-kit.git specify init --here --integration <your-agent> --force
```

`--integration`, not `--ai`. It leaves `.specify/memory/constitution.md` alone.

## Before the presentation

- [ ] Repo pushed and everyone can clone it
- [ ] `bash .specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` prints a FEATURE_DIR
- [ ] `/speckit-analyze` reports no drift between spec, plan and tasks
- [ ] One person has run `/speckit-implement T001` end to end and it produced a scaffold
- [ ] Everyone has Claude Code installed and a working API key

## Reading order for a human

`docs/PROMPT-NOTES.md` first — it explains why the build is split the way it is,
and it is the shortest of the three. Then `spec.md` for what the product does,
`plan.md` for the contracts, `tasks.md` for the work. The appendix is a
reference, not a read.

## Where this came from

Converted from three source documents in `../ia-generator-openspec/docs/`, using
the notes in `../spec-toolkit` (a separate repo — the app that generates these
files for *other* projects). That app was deliberately not used here: the source
document had nothing left to decide, so a generated spec would have been a lossy
restatement of a better original.
