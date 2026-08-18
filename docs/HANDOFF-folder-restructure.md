# Handoff — the v1.4 folder restructure

> ## DONE — 18 August 2026. Do not run this again.
>
> Kept because the reasoning is worth having, not because there is work left in
> it. The outcome is recorded in `docs/DECISION-LOG.md` §4; the one departure from
> the plan below is that **no physical v1.3 snapshot was placed in `Superseded/`** —
> the working folder was renamed, so there is no v1.3 folder left to retire, and
> the released v1.3.0 tree is held by git at tag `v1.3.0`.

**Written:** 18 August 2026, at the end of the session that finished Batches 0–4.
**For:** a fresh session doing the restructure and nothing else.
**Status of the code:** finished. This job moves files; it does not change the app.

> **Read `CLAUDE.md` and `docs/DECISION-LOG.md` §4 first.** This document assumes
> both. §4 records why the move was deferred and what it is meant to produce.

---

## 1. Say the tier first

`CLAUDE.md` requires you to name the change tier before editing. **This is not a
code change at all** — no `APP_VER` bump, no `CACHE_VERSION` bump, no new guides.
Say so, and say that you have read this file, before you move anything.

If you find yourself editing `index.html`, stop: you are doing a different job.

---

## 2. What this job is

Three moves, in this order:

1. **`_Shared/`** — lift the two documents that are not about this app out to
   `00_AI Tools in Development/_Shared/`, as **its own git repository**.
2. **`Dryspace Inspection App v1.4/`** — the working folder becomes the v1.4
   folder (D18: one folder per *minor* version, not per patch).
3. **`Superseded/`** — the v1.3 folder is retired.

### What moves to `_Shared`

| From | To | Why |
|---|---|---|
| `docs/FIELD-APP-TEMPLATE.md` | `_Shared/Field App Architecture Template.md` | Describes how Dryspace builds **any** field app |
| `04_Project Context Brief.md` | `_Shared/Dryspace Context Brief.md` | Describes the business and the trade |

**The risk this removes is concrete:** when v1.3 goes to `Superseded`, the
specification for four unbuilt apps goes with it.

---

## 3. The sharp edges — read all four before touching anything

### 3.1 Moving the folder WILL break git until you fix `core.worktree`

The repository is deliberately split (D19): `.git` in the app folder is a
**pointer file**, and the real repository lives outside the OneDrive sync root.

```
.git                      contains: gitdir: C:/Users/jamie/dev/.git-dryspace-inspect
core.worktree             currently: .../Dryspace Inspection App v1.3
```

`core.worktree` is an **absolute path to the current folder name**. Rename or
move the folder and every git command fails until it is updated:

```bash
git --git-dir="C:/Users/jamie/dev/.git-dryspace-inspect" config core.worktree "<new absolute path>"
```

Do the rename, fix `core.worktree`, then run `git status` and confirm a clean
tree **before doing anything else**. If `git status` shows the whole repository
deleted, you have moved the folder without updating the path — do not commit
that, just fix the path.

### 3.2 `_Shared` history — decided: start fresh

**This was settled on 18 Aug 2026, after looking at what the history actually
contains. Do not reopen it; just do it.**

D-log §4 assumed the template's history was worth preserving. Checking it shows
otherwise:

```
docs/FIELD-APP-TEMPLATE.md          6 commits, only 2 about the template
  77a135c  Add field app architecture and reuse template        <- about it
  d1a9ecc  Record the deferred move of the shared documents     <- about it
  c380a13  Unify inspection folder; adopt INS-2026-0142 numbering
  00b637f  Update Handover Protocol for v1.3; add client name to folder
  fe32e63  Filenames carry a pinned client token
  2ef0089  v1.4 - the record moves through SharePoint, and four ways an upload could hang

04_Project Context Brief.md         2 commits, neither meaningful
  d29949c  Carry the remaining documents into v1.3   <- a bulk move
  2ef0089  v1.4 - ...                                <- the release commit
```

**So a `filter-repo` extraction would produce a documentation repository whose
log is mostly commit messages about SharePoint upload internals.** Technically
preserved, semantically wrong, and confusing to anyone who opens it later asking
why the template says what it says.

**Nothing is lost by starting fresh.** Every one of those commits stays in
`dryspace-inspect` for ever. This is a decision not to *duplicate* history into a
place where it reads as noise — and the history that actually matters for these
two documents has not been written yet, because it is the revisions that come as
sibling apps get built.

**Do this:** `git init` in `_Shared`, and make the first commit say where the
files came from and where their prior history lives. Something like:

```
Establish _Shared as its own repository

Two documents that describe how Dryspace builds ANY field app, moved out of the
Site Inspection App's folder so they do not go to Superseded with it:

  Field App Architecture Template.md   was docs/FIELD-APP-TEMPLATE.md
  Dryspace Context Brief.md            was 04_Project Context Brief.md

Their prior history stays in the dryspace-inspect repository, up to commit
f50955d. It was not carried across deliberately: of the six commits touching the
template, only two were about the template - the rest were app changes that
happened to edit it, and would read here as noise. Nothing is lost; it is simply
not duplicated.

History from this point is about these documents alone, which is the history that
matters as sibling apps are built.
```

**Record it in `docs/DECISION-LOG.md` §4** as the decision made, with the reason —
§4's premise that the history was worth preserving is what changed.

### 3.3 Things outside this folder point at the v1.3 path

These are **not** in this repository and will not show up in `git status`:

| File | What it holds |
|---|---|
| `G:\My Drive\AI-Claude_Code\.claude\launch.json` | dev-server path, hardcoded to `...App v1.3` |
| `G:\My Drive\AI-Claude_Code\.claude\settings.local.json` | a `Read(...)` permission for the v1.3 path |

Both need the new path or the next session's preview and file access break.

### 3.4 OneDrive

This folder is inside a synced SharePoint library. A large move produces a lot
of sync churn, and sync can hold file handles — a `Device or resource busy`
error mid-move is normal. Let sync settle, then retry, rather than forcing.

Keep `.git` outside the sync root. That is D19 and it exists because syncing
`.git` corrupted it once already.

---

## 4. Cross-references to update

After moving, grep for the old paths and names. Known references:

| Where | What to change |
|---|---|
| `CLAUDE.md` | the "Where things are" table — `docs/FIELD-APP-TEMPLATE.md` moves out |
| `02_Iteration Guide.md` | §1 "Where everything lives" — folder name is `...v1.3\` |
| `docs/DECISION-LOG.md` §4 | mark the deferred item **done**, with the date and what was decided about history |
| `04_Project Context Brief.md` | it is itself moving; fix anything pointing at it |
| `docs/FIELD-APP-TEMPLATE.md` | the "move this document" note at the top comes **out** once it has moved |
| `docs/v1.4-plan.md` | tick the restructure off §7 |

```bash
grep -rn "App v1\.3" --include="*.md" .
```

---

## 5. Definition of done

- [ ] `git status` clean, in the renamed folder, with history intact (`git log` shows the v1.4 work)
- [ ] `_Shared` exists as its own repository, first commit written per §3.2 (naming the source commit), and the decision recorded in decision-log §4
- [ ] `docs/FIELD-APP-TEMPLATE.md` and `04_Project Context Brief.md` no longer in the app folder
- [ ] The template's "move this document" note is gone
- [ ] `launch.json` and `settings.local.json` updated to the new path
- [ ] No `App v1.3` references left except deliberately historical ones (CHANGELOG, decision-log history)
- [ ] `tests.html` still passes — **387 assertions, zero failures** — served over HTTP
- [ ] Decision log §4 marked done

**Run the tests.** Nothing here should affect them, which is exactly why a
failure would matter: it would mean a move took something with it.

---

## 6. What NOT to do

- **Do not push.** `git push` is blocked in these sessions; hand the user the
  command. And the restructure should be reviewed before it reaches the remote.
- **Do not bump the version or regenerate guides.** They are correct at v1.4.0.
- **Do not touch `beta/` on `main`.** It is a separate deployed copy and is not
  affected by moving the working folder.
- **Do not move `v1.0`, `v1.1`, `v1.2.1`.** They sit beside v1.3 today rather
  than in `Superseded/`. Tidying them is a separate decision — raise it, do not
  fold it in.

---

## 7. State as at handoff

**Code and documents: finished.** Batches 0–4 of `docs/v1.4-plan.md` are done and
Batch 1 is closed on device evidence.

**Git:**

| Branch | Local | Remote | Note |
|---|---|---|---|
| `main` | `bb73fbf` | `bb73fbf` | in sync — carries v1.3.0 at root plus the `/beta/` test build |
| `v1.4` | `ab74525` | `cc440de` | **4 commits unpushed** — the work is only on this machine |

> **Ask the user to push `v1.4` before starting.** A restructure that goes wrong
> with four unpushed commits loses real work. One command:
>
> ```
> git push origin v1.4
> ```

**Deployed:** `https://ds-js1.github.io/dryspace-inspect/` is **v1.3.0**, which is
what staff run — unchanged. `/beta/` is the v1.4 test build and announces itself.

**Still owed after this job**, and neither is yours:

- `Training/Setup_and_Use_Presentation.pptx` still teaches the old five-step
  handover — the only training item not generated from source.
- Julie and Mike's permission test: confirm *Contribute - No Delete* permits the
  archive move. v1.4 moves a file at every handover.
