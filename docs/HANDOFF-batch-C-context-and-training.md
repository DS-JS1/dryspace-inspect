# Handoff — Batch C: `04_Project Context Brief` and the `Training/` set

**Written:** 21 August 2026, at the end of Batch B.
**For:** the next session. Read this file before anything else except `CLAUDE.md`.
**Model:** Opus, normal effort. Do not drop below Opus — the failure mode on
documentation is not breakage, it is plausible detail that is subtly wrong, and
nobody re-verifies a guide once it reads well. That is not theoretical: Batch B
found a wrong section number that Batch A had already fixed one file away.

---

## 1. Say the tier first

**This is a patch-tier, documentation-only change.** Say so in your first reply,
before editing anything — `CLAUDE.md` requires it and it is how the owner knows
the file was loaded.

`APP_VER` stays `1.4.0`. `CACHE_VERSION` stays `ds-inspect-v1.4.0-25`. **No app
file is touched in this batch.** If you find yourself editing `index.html`,
`ds-*.js` or `sw.js`, stop — that is a different job and a different tier.

The one exception to "documentation only" is the **training deck**, which is a
new artefact rather than an edit. It is still patch tier; it is still not code.

---

## 2. What is done, and what you are doing

| | |
|---|---|
| **Batch A — DONE** | `03_Handover and Version Control Protocol` (`b7cd864`, branch `v1.4`, **not pushed**) |
| **Batch B — DONE** | `01_Setup and User Guide`, `02_Iteration Guide` (committed, **not pushed**) |
| **Batch C — YOURS** | `04_Project Context Brief` (in `_Shared`), then `Training/` as a set, then rebuild the deck |
| Batch D — last | Regenerate the `Guides/` PDFs and the quick cards |

**Do not regenerate any PDF in this batch.** The markdown has not fully settled
until `Training/` is done, and `Guides/` is Batch D's whole job.

---

## 3. The Context Brief is in a different repository, under a different name

Two things will trip you up here, so check both before planning.

**It was renamed.** `04_Project Context Brief.md` and `FIELD-APP-TEMPLATE.md`
**left this folder on 18 August 2026** and are now, respectively:

```
00_AI Tools in Development\_Shared\Dryspace Context Brief.md
00_AI Tools in Development\_Shared\Field App Architecture Template.md
```

The heading inside the file is still *"Project Context Brief — Dryspace Site
Inspection App"*, so it is the same document. Do not create a new
`04_Project Context Brief.md` in this folder. See the decision log §4.

**It is its own git repository**, two levels up, and it is on branch **`main`**,
not `v1.4`. Its git internals are at `~/dev/.git-dryspace-shared`, outside the
sync root, for the same OneDrive reason as this repository. Consequences:

- It is a **separate commit in a separate repo**. Check the branch before you
  commit there; the `git add` list in §9 below covers this repository only.
- `05_Release Protocol` treats the Context Brief as a major-tier document. It is
  in scope because v1.4 is a major release, not because this batch is.

**What to check in it.** Per `docs/HANDOFF-v1.4-polish.md` §5: version numbers
and the feature list. Its header already reads *App v1.4 · Form 4.2*, so parts of
it may be current — **that is not evidence the body is.** Read it in full and
check every claim against the code, per §5 below. Its purpose is to be pasted
into an external AI tool to generate training material, which means an error in
it propagates into the deck you are about to build.

Also in `_Shared`: `Field App Architecture Template.md`. It was updated for v1.4
already and is **not** yours unless you find it contradicting §7.

---

## 4. The `Training/` set — and the deck that no longer exists

`Training/` is updated **as a set, never singly.** A card that disagrees with the
module is worse than a card that is missing, because staff trust the one they
happen to be holding.

```
Training/Training_Module.html          the self-paced module
Training/Workflow_Chart.html           the chart used in a group session
Training/Quick_Card_Handover.svg       source
Training/Quick_Card_Photos.svg         source
Training/Quick_Card_*_v1.4.0.pdf       generated — Batch D regenerates these
Training/Onboarding_Emails.md          what a new starter is sent
Training/README.txt                    read this before touching the set
```

**The `.svg` files are the source and the `.pdf` files are generated from them.**
Edit the SVG; never the PDF. Both cards already carry `v1.4.0` in their
filenames, so leave the names alone — `tests.html` does not check these, but
Batch D regenerates them and a renamed source will not be found.

`Onboarding_Emails.md` is part of the set. It names buttons too.

> **Settled before you start — the card is CORRECT; two prose lines are wrong.**
>
> This brief previously said `Quick_Card_Handover.svg` still taught five steps.
> It does not. It was opened and read: it says *"EVERY HANDOVER — FOUR STEPS, IN
> THIS ORDER"*, carries four numbered circles, and is stamped *App v1.4 · Form
> 4.2*. **Do not edit the card to fix a problem it does not have.**
>
> What is actually wrong is two stale descriptions OF the card:
>
> | File | Line | Says | Should say |
> |---|---|---|---|
> | `Training/README.txt` | 19 | "The five handover steps and where the files live" | four |
> | `Training/Onboarding_Emails.md` | 86 | "the five steps on that card" | four |
>
> Both files contradict themselves: `README.txt:67` already says *"The handover
> is FOUR steps now, not five"*, and `Onboarding_Emails.md:129` says the same.
> So each file states both numbers, a dozen lines apart.
>
> The lesson stands even though the conclusion changed: **a version number in a
> header is a claim, not a check.** The README was stamped v1.4 and was still
> wrong about the card sitting beside it. What saved this was opening the SVG
> rather than reasoning about it.

**The deck is gone and has to be built from scratch.**
`Training/Setup_and_Use_Presentation.pptx` and its PDF export were **deleted**.
They taught the old five-step handover and were the only training item not
generated from source, so they could not be brought to v1.4 by regenerating them.
Do not go looking for them, and do not try to recover them from git — the content
was wrong, which is why they went.

Until the deck exists, `Training_Module.html` and the Workflow Chart carry a
group session on their own. **`CLAUDE.md` says v1.4 must not reach a field device
before the training set exists**, and the deck is the last piece of it. That
sentence is the reason this batch matters more than its tier suggests.

The buttons staff are trained on have changed. Everything in §7 below is a screen
they will be looking at.

---

## 5. Read the document before you rewrite it

This is the discipline that decides whether the result is accurate. It is not
optional and it is not satisfied by skimming headings.

For each document:

1. Read the whole file.
2. For every claim about what the app does, **check it against the code** — a
   `grep` on `index.html` is cheap. Do not rely on the changelog's description of
   a feature; the changelog says what changed, not what the screen now says.
3. Only then rewrite.

Batch A found four wrong statements in `03` this way. Batch B found two more in
`01` that were *the same two errors Batch A had just fixed in `03`* — and two
different, both-wrong assertion counts in `02`. Expect a similar density.

**Grep across the whole folder, not just the code.** This is the rule Batch B
had to add:

```
grep -rn "Setup and User Guide\|Iteration Guide\|Handover and Version Control" . \
  --include=*.md --include=*.txt --include=*.html
```

A cross-reference from code into a document pins that document's numbering — and
**fixing one document does not fix the others carrying the same reference.**
Nothing here looks across files except you.

---

## 6. Context budget — read this list, not the whole repository

The decision log is large and you do **not** need it end to end. Everything from
it that bears on this batch is summarised in §7. Spot-check a single decision if
something looks contradictory.

**Read:** `CLAUDE.md`, this file, then the one document you are working on.
Read `01_Setup and User Guide` when you get to the training set — it is the
staff-facing source of truth and the training pack must agree with it.

**Do not read:** `docs/DECISION-LOG.md` in full, `docs/v1.4-plan.md`,
`docs/v1.3-*`, `CHANGELOG.txt` in full.

---

## 7. Facts established in Batches A and B — do not contradict these

All verified against build `v1.4.0-25` by reading the code.

**The form's action row is at the TOP of the form**, directly beneath the stage
selector: *Hand over through SharePoint*, *Send report (email / SharePoint)*,
*Share photo & video files*, *Share draft (offline fallback)*, *Print / PDF*.
Any material that says "at the foot of the form" is wrong, and the deck that
taught it has been deleted for exactly this reason.

**The home screen's controls**, in order: *＋ New inspection*, *Take over an
inspection from SharePoint*, *Browse all inspections*, *Import from a file
(offline fallback)*, *Recover work in progress*, *Download data backup (all
inspections)*, *Check for app update*. The sign-in / sync bar sits below them.

**Two Upload buttons.** On the form, at the top, only when something is waiting:
*Upload 3 photos*, and while running *Uploading · 2 left · 45%* with a bar across
it. On the home screen, *Upload now* in the sync bar, same condition.

**Card file states** — `3 files · all uploaded`, `· 1 waiting to upload`,
`· 1 uploading`, `· 1 needs attention`, or `no files on this device`, which means
exactly that and **not** "all uploaded".

**Four subfolders per inspection:** `current/`, `archive/`, `wip/`, `photos/`.
`wip/` is the automatic backup, written every four minutes while the form is open
and once on leaving it, one file per device, and **never the baton**. It is
silent when it cannot run, needs signal and a signed-in account, and does nothing
until the record has a number, client or address.

**Eight library columns:** `InspectionNo`, `Client`, `Address`, `Stage`,
`InspectionDate`, `LastEditor`, `BatonStatus`, `BatonHolder`. A library set up
for v1.3 has the first six only.

**Three baton states in the app** — WAITING (green), IN PROGRESS (amber), NOT
HANDED OVER (grey). SharePoint carries a fourth value, `Recovered`, written only
by a forced handover; the app has no badge for it and shows such a folder as IN
PROGRESS. The app never reads `BatonStatus` back.

**Forced handover is administrator-only**, gated on the signed-in Microsoft
account against `SP_CONFIG.admins`, which currently holds `jamie@dryspace.com.au`
and is empty by default in the code.

**Photos taken over from SharePoint arrive as thumbnails**, marked *in SharePoint
· tap to fetch*. The bytes are not sent — they are already in `photos/`. With no
signal, a thumbnail is all you have.

**The filing nudge is TWO checks.** Before the first upload: once per inspection,
never after the folder is pinned. At every handover with blanks: pinned or not,
and when pinned it says filling them in corrects the record and the library
columns but renames nothing. Five fields — inspection number, client, address,
inspection date, your name. Neither ever blocks capture, and neither blocks the
upload or the handover outright.

**A record with no number, client or address files as `Unfiled`.** The folder
name is pinned by the first upload and cannot be changed afterwards.

**Handover belongs to `03`.** `01` points at it rather than restating it. Keep
that: the training pack should teach the buttons and send people to `03` for the
protocol.

---

## 7a. Verified at the close of Batch B

Checked directly rather than carried forward on trust, 21 August 2026:

| Claim | Verified |
|---|---|
| Suite passes | **550 assertions, zero failures**, served over HTTP |
| The app's `§8` pointer | `index.html` sends staff to *Handover Protocol §8*; after Batch A's renumbering §8 is **"If something has already gone wrong"**. Correct. Do not renumber `03` without re-checking `index.html` |
| `04_Project Context Brief.md` | Does **not** exist in this folder. It is `_Shared/Dryspace Context Brief.md`, separate repo |
| `Guides/` on disk | All four PDFs are already `_v1.4.0.pdf`. `05_Release Protocol.md` lines 109–112 still name `_v1.3.pdf` — **Batch D**, so the fix and the regeneration move together |
| `Quick_Card_Handover.svg` | Says four steps, stamped v1.4. **Correct.** Only the prose describing it is wrong |
| Repo state | Branch `v1.4`. One unpushed commit (`ade9cf2`) **plus** Batch B's six uncommitted files |

**Batch C starts from a dirty tree.** Commit and push Batch B first, or carry it
along and commit both together — but decide deliberately rather than discovering
it halfway through.

---

## 8. Testing

Server config at `.claude\launch.json`, named **`dryspace-inspect`**, port 8765.
Start it with the preview tool and open `http://localhost:8765/tests.html`.

**Take the assertion count the suite prints today as your baseline** — it was 550
in Batches A and B — and expect **zero failures before you start and zero when
you finish**. Markdown edits should not move the count. If it drops, something
else changed.

`tests.html` checks that each `Guides/*.pdf` exists at the current `APP_VER`.
They already do, at v1.4.0. **Do not rename or delete them** — that fails the
suite. Regenerating them is Batch D, with `python tools\make_guides.py`.

---

## 9. When you are done

Working tree should contain only markdown, the training files and the two log
files. **`04_Project Context Brief` is a separate commit in `_Shared`** — see §3.

In this repository:

```
git status --short
git add Training CHANGELOG.txt docs/DECISION-LOG.md docs/HANDOFF-v1.4-polish.md
git commit -m "docs: bring the training set up to build v1.4.0-25"
```

**Hand the commands to the owner. Do not run `git push`.** Pushing to `main` is
the release, and v1.4 must not reach a field device before the training set
exists. You are on branch `v1.4`.

Update the **Progress** block in `docs/HANDOFF-v1.4-polish.md` §5 so Batch D
knows where things stand, and write a handoff for Batch D in the same shape as
this one. Batch D also needs to fix `05_Release Protocol`, which still names
`Guides/02_Iteration Guide_v1.3.pdf` — left deliberately so the fix and the
regenerated files move together.

---

## 10. What NOT to do

- Do not push, to any branch, in either repository.
- Do not bump `APP_VER` or `CACHE_VERSION`.
- Do not regenerate any PDF or quick card — that is Batch D.
- Do not touch `index.html`, `ds-media-sync.js`, `ds-sharepoint.js`, `ds-auth.js`,
  `sw.js` or `tests.html`.
- Do not reopen D45 or D49 (the Blob question) — settled on device evidence.
- Do not reopen B5 (the v1.3 mobile upload fault) — settled; see `CLAUDE.md`.
- Do not add anyone to `SP_CONFIG.admins`.
- Do not restate the handover procedure outside `03`. Point at it.
- Do not go looking for the deleted deck. Build a new one.
