# Handoff — Batch B: `01_Setup and User Guide` and `02_Iteration Guide`

**Written:** 21 August 2026, at the end of Batch A.
**For:** the next session. Read this file before anything else except `CLAUDE.md`.
**Model:** Opus, normal effort. Do not drop below Opus — the failure mode on
documentation is not breakage, it is plausible detail that is subtly wrong, and
nobody re-verifies a guide once it reads well.

---

## 1. Say the tier first

**This is a patch-tier, documentation-only change.** Say so in your first reply,
before editing anything — `CLAUDE.md` requires it and it is how the owner knows
the file was loaded.

`APP_VER` stays `1.4.0`. `CACHE_VERSION` stays `ds-inspect-v1.4.0-25`. **No app
file is touched in this batch.** If you find yourself editing `index.html`,
`ds-*.js` or `sw.js`, stop — that is a different job and a different tier.

---

## 2. What is done, and what you are doing

| | |
|---|---|
| **Batch A — DONE** | `03_Handover and Version Control Protocol`, rewritten and committed (`b7cd864`, branch `v1.4`, **not pushed**) |
| **Batch B — YOURS** | `01_Setup and User Guide`, then `02_Iteration Guide` |
| Batch C — later | `04_Project Context Brief` (in `_Shared`), `Training/` as a set, rebuild the deck |
| Batch D — last | Regenerate the `Guides/` PDFs and quick cards |

**Do not regenerate any PDF in this batch.** The markdown has not settled.

---

## 3. Read the guide before you rewrite it

This is the discipline that decides whether the result is accurate. It is not
optional and it is not satisfied by skimming headings.

For each of the two documents:

1. Read the whole file.
2. For every claim about what the app does, **check it against the code** — a
   `grep` on `index.html` is cheap. Do not rely on the changelog's description
   of a feature; the changelog says what changed, not what the screen now says.
3. Only then rewrite.

Batch A found four wrong statements in `03` this way, including a button
described as being at the foot of a form it had been moved off the bottom of.
Expect a similar density in `01`, which is the older document.

---

## 4. Context budget — read this list, not the whole repository

The decision log is ~57 KB and you do **not** need it. Everything from it that
bears on these two guides is summarised in §6 and §7 below. Spot-check a single
decision if something looks contradictory; do not read the file end to end.

**Read:** `CLAUDE.md`, this file, then the one guide you are working on.
**Do not read:** `docs/DECISION-LOG.md` in full, `docs/v1.4-plan.md`,
`docs/v1.3-*`, `CHANGELOG.txt` in full (see §5 for the one part that matters).

Cheap ways to answer a question about the app:

```
grep -n "Browse all inspections" index.html
grep -n "^function <name>" index.html      # then sed -n 'START,ENDp'
```

---

## 5. The rules that pin this work

**A cross-reference from code into a document pins that document's numbering.**
Batch A found `index.html` telling staff *"Handover Protocol §8"* while §8 was a
different section. Before renumbering or reordering anything in `01` or `02`:

```
grep -rn "Setup and User Guide\|Iteration Guide" index.html ds-*.js tests.html
```

If the code names a section, either keep that number or fix both — and record it.

**`03` is now the reference for the baton.** Anything about handover, the three
baton states, the library columns, forced handover or read-only review belongs in
`03`. `01` and `02` should point at it, not restate it. Two documents describing
one process is how they come to contradict each other.

**Australian English** — metres, organised, colour, labour.

**Keep `CHANGELOG.txt` and `docs/DECISION-LOG.md` current as you go**, not
afterwards. Append to the block at the end of `CHANGELOG.txt` headed
*"The documentation pass - 21 August 2026"*, which already lists these two guides
as still to do. Add a dated subsection to the decision log's §2 only if you find
something worth a durable record — a contradiction, a wrong instruction, a limit
nobody had written down. Routine rewording does not need a decision-log entry.

---

## 6. Facts established in Batch A — do not contradict these

All verified against build `v1.4.0-25` by reading the code.

**The form's action row is at the TOP of the form**, directly beneath the stage
selector. It holds, in order: *Hand over through SharePoint*, *Send report (email
/ SharePoint)*, *Share photo & video files*, *Share draft (offline fallback)*,
*Print / PDF*. They used to be below every section. Any guide that says "at the
foot of the form" is wrong.

**The home screen's controls**, in order: *＋ New inspection*, *Take over an
inspection from SharePoint*, *Browse all inspections*, *Import from a file
(offline fallback)*, *Recover work in progress*, *Download data backup (all
inspections)*, *Check for app update*. The sign-in / sync bar sits below them.

**The Upload button.** There are two. On the form, a button appears at the top
only when something is waiting, reading *Upload 3 photos*, and during an upload
*Uploading · 2 left · 45%* with a bar drawn across it. On the home screen,
*Upload now* appears in the sync bar on the same condition. Cards read
*3 files · all uploaded*, *3 files · 1 waiting to upload*, *· 1 needs attention*,
or *no files on this device* — the last of which means exactly that and not "all
uploaded".

**Four subfolders per inspection:** `current/`, `archive/`, `wip/`, `photos/`.
`wip/` is the automatic backup, written every four minutes while the form is open
and once on leaving it, one file per device, and it is never the baton.

**Eight library columns:** `InspectionNo`, `Client`, `Address`, `Stage`,
`InspectionDate`, `LastEditor`, `BatonStatus`, `BatonHolder`.

**Three baton states in the app** — WAITING (green), IN PROGRESS (amber), NOT
HANDED OVER (grey). SharePoint carries a fourth value, `Recovered`, written only
by a forced handover; the app has no badge for it and shows such a folder as IN
PROGRESS. The app never reads `BatonStatus` back.

**Forced handover is administrator-only**, gated on the signed-in Microsoft
account against `SP_CONFIG.admins`, which currently holds `jamie@dryspace.com.au`
and is empty by default in the code.

**A record with no number, client or address files as `Unfiled`.** The folder
name is pinned by the first upload and cannot be changed afterwards.

---

## 7. What is new in each of your two documents

From §5 of `docs/HANDOFF-v1.4-polish.md`, which remains the master list.

### `01_Setup and User Guide` — the staff-facing one

Not yet described in it:

- the **Upload button on the form**, with progress
- the **HANDED OVER badge** on a card, and the confirm on opening one
- **thumbnails on takeover**, and tap-to-fetch for the full original
- the **filing nudge** before the first upload (names what is blank and the
  folder it would file as; asked once per inspection, never after the folder is
  pinned)
- the **picker** — take-over and recover are now a filterable, tappable list
  rather than a numbered prompt
- **Browse all inspections**
- **read-only view** (*View it*)
- **Ask for the baton**

Its Part C already says an ordinary Safari tab is refused durable storage, and
that was confirmed empirically on 18 Aug — leave it saying so.

Where this guide covers handover, keep it short and point at `03`.

### `02_Iteration Guide` — the build-facing one

Not yet described in it:

- **the `bytes` store, and IndexedDB version 1 → 2**, with the migration.
  `DB_NAME = 'ds-inspections'`, `DB_VERSION = 2` (`index.html:1585`), stores
  `inspections`, `media`, `bytes`. Photo bytes are `ArrayBuffer`s in `bytes`,
  keyed by `mid`; a `Blob` is rebuilt at the moment of use and never stored.
  Photos whose bytes were already lost are marked as needing retaking, once.
- **`pickFromList` / `showDialog`** — the app's own dialog box, used by the
  pickers and the handover dialogs. Most other dialogs are still native
  `alert` / `confirm` / `prompt`; that is deliberate and unfinished, not an
  oversight. Do not claim the app has one dialog style.
- **where the build number comes from.** The footer reads the live service-worker
  cache name, not a constant (`index.html:4922`–4936). `APP_VER` cannot answer
  "which build is this", because every build since -2 reports 1.4.0. The
  changelog's own text explains why. Ask for the footer build in any bug report.
- The record schema is at **4**. `ensureSchema()` owns that number;
  `saveNow()` must only preserve it — pinning a literal there once undid the
  migration on every save, silently.

---

## 8. Testing

There is a server config already, in `G:\My Drive\AI-Claude_Code\.claude\launch.json`,
named **`dryspace-inspect`** on port 8765. Start it with the preview tool and open
`http://localhost:8765/tests.html`.

**Expect `All 550 assertions passed.` before you start and after you finish.**
Markdown edits should not move that number. If it drops, something else changed.

One thing the suite does check that is relevant here: each `Guides/*.pdf` must
exist at the current `APP_VER`. They already do, at v1.4.0. **Do not rename or
delete them** — that would fail the suite. Regenerating them is Batch D.

---

## 9. When you are done

Working tree should contain only markdown and the two log files:

```
git status --short
git add "01_Setup and User Guide.md" "02_Iteration Guide.md" CHANGELOG.txt docs/DECISION-LOG.md docs/HANDOFF-v1.4-polish.md
git commit -m "docs: bring the Setup and Iteration guides up to build v1.4.0-25"
```

**Hand the commands to the owner. Do not run `git push`.** Pushing to `main` is
the release, and v1.4 must not reach a field device before the training set
exists. You are on branch `v1.4`.

Update the **Progress** line in `docs/HANDOFF-v1.4-polish.md` §5 so Batch C knows
where things stand, and write a handoff for Batch C in the same shape as this one.

---

## 10. What NOT to do

- Do not push, to any branch.
- Do not bump `APP_VER` or `CACHE_VERSION`.
- Do not regenerate any PDF or quick card.
- Do not touch `index.html`, `ds-media-sync.js`, `ds-sharepoint.js`, `ds-auth.js`,
  `sw.js` or `tests.html`.
- Do not reopen D45 or D49 (the Blob question) — settled on device evidence.
- Do not add anyone to `SP_CONFIG.admins`.
- Do not restate the handover procedure in `01`. Point at `03`.
