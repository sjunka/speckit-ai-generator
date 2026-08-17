# project1test — AI Media Generator, as Spec Kit artifacts

A portable Spec Kit bundle. Everything an agent needs to build the AI Media
Generator, laid out in the paths Spec Kit expects. Copy the contents of this
folder into an empty repository and the agent has the constitution, the
specification, the plan and the task list already in context.

This folder is not itself the build repository — it is versioned here, with the
tool that produced it, so the artifacts have a history.

## What is here

```
.specify/memory/constitution.md              six principles, all enforceable
specs/001-ai-media-generator/spec.md         WHAT and WHY — no technology
specs/001-ai-media-generator/plan.md         HOW — stack, contracts, structure
specs/001-ai-media-generator/tasks.md        39 tasks in 6 phases
docs/REPLICATION-PROMPT.md                   §6, §7, §10 are required reading
docs/REPLICATION-APPENDIX.md                 80 source files verbatim — the answer key
docs/PROMPT-NOTES.md                         why the source document is shaped this way
```

The four Spec Kit files were converted **by hand** from
`docs/REPLICATION-PROMPT.md`. They were not generated, and `tasks.md` in
particular must not be regenerated — see the warning at the top of that file.

## Standing up the build repository

```bash
mkdir ~/code/ia-media-generator && cd $_
git init

cp -R /Users/sjunka/Documents/web/spec-toolkit/docs/project1test/. .
git add -A && git commit -m "spec kit artifacts"
```

Then install Spec Kit's own machinery — the commands and helper scripts, which
are not committed here because they belong to whichever agent each person uses:

```bash
uvx --from git+https://github.com/github/spec-kit.git specify init --here --integration claude --force
```

The flag is `--integration`, not `--ai`. For Claude it installs ten skills under
`.claude/skills/speckit-*` plus `.specify/{scripts,templates,workflows}/`.

**It does not touch `.specify/memory/constitution.md`** — verified by running it
against a copy of this bundle. Our constitution survives untouched.

**Then write the feature pointer. This step is not optional:**

```bash
cat > .specify/feature.json <<'JSON'
{
  "feature_directory": "specs/001-ai-media-generator"
}
JSON

bash .specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
# must print: {"FEATURE_DIR":"…/specs/001-ai-media-generator","AVAILABLE_DOCS":["tasks.md"]}
```

Every Spec Kit command starts by running that script. Without `feature.json` it
fails with *"Feature directory not found"* and nothing runs. The branch name is
**not** a fallback — that changed. `specs/001-ai-media-generator` exists here
because it was written by hand rather than by `/speckit-specify`, which is what
would normally create the pointer.

Commit and push. Teammates clone, run the same `specify init`, and are ready.

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

## Before the presentation

Run these once so nobody hits them live:

- [ ] Bundle copied into the build repository and pushed
- [ ] `specify init --integration claude` completed
- [ ] `.specify/feature.json` written, and `check-prerequisites.sh` prints a FEATURE_DIR
- [ ] `/speckit-analyze` reports no drift between spec, plan and tasks
- [ ] One person has run `/speckit-implement T001` end to end and it produced a scaffold
- [ ] Everyone has an agent installed and an API key that works

## Reading order for a human

`docs/PROMPT-NOTES.md` first — it explains why the build is split the way it is,
and it is the shortest of the three. Then `spec.md` for what the product does,
`plan.md` for the contracts, `tasks.md` for the work. The appendix is a
reference, not a read.

## Updating this bundle

Edit the files here, commit, then re-copy into the build repository. Keeping the
bundle as the source and the build repository as a copy means the history of
*how the spec changed* stays with the tool that wrote it.
