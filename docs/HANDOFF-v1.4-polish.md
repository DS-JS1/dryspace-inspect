# Handoff — finishing v1.4

**Written:** 21 August 2026, after four days of field testing on the iPhone that
had been failing.
**For:** the session that updates the documentation and polishes the app.
**Status of the code:** the faults are fixed and the feature work is done. What
remains is the documentation, appearance, and one untested path.

> **Read `CLAUDE.md` first, then `docs/DECISION-LOG.md` §2 (D43–D59).** Those
> seventeen decisions are this week's work, and most of them cost something to
> learn. Several were reversals of an earlier decision made on worse evidence.

---

## 1. Say the tier first

`CLAUDE.md` requires it. Most of what follows is **patch** work folded into the
unreleased 1.4.0: `APP_VER` stays, `CACHE_VERSION` moves. If you find yourself
changing the record schema or what staff are trained to tap, stop — that is a
different job and a different tier.

---

## 2. Where things stand

**v1.3.0 is live and is what staff run.** Untouched throughout this work.

**v1.4.0 is built, tested on a real device, and not released.** It lives on the
`v1.4` branch and is deployed at `/beta/`, which announces itself.

**The build is in the footer** — currently `build v1.4.0-25`. `APP_VER` cannot
answer "which build is this", because every build since -2 reports 1.4.0. The
footer reads the live service-worker cache name instead. **Ask for it in any bug
report.** Several rounds were lost before it existed.

**Tests: 550 assertions, zero failures.** Served over HTTP, `tests.html`.

### What is unfinished

**One test has never been run** — `bug tests/OUTSTANDING-baton-status-and-forced-handover.txt`.
It covers the baton status columns and forced handover, the only two features not
yet exercised against real SharePoint. The owner intends to run it before deploying.

**The documentation is out of date** — see §5. That is the main job.

---

## 3. What this week changed

Seventeen decisions, but four ideas carry most of the weight:

**Never put a Blob in IndexedDB (D45 → D49).** A Blob there is a reference to a
separate file the browser writes and can lose: the record survives, reports the
right size, and reading it throws *"The object can not be found here"*. It cost a
real evidence photo. Bytes now live as `ArrayBuffer`s in their own store; a Blob
is rebuilt only at the moment of use. **D45 was the same fault diagnosed one layer
too high** — it stopped the app storing the camera's `File`, and the photos kept
dying, which is what proved that *who created the Blob* was never the point.

**A screen that says something untrue is worse than one that says nothing
(D44, D50, D52, and the "not handed over" fix).** Counters that ignored a state;
a question that pinned the answer before it was asked; a copy that looked live
after being sent; an empty folder read as "somebody has it". Each was found by
somebody looking at a screen and disbelieving it.

**Every state a record can be left in must be reachable by something (D48).**
The queue ignored `uploading`, so a record whose outcome could not be written down
became invisible until the next page load. Its cousin: **when one thing becomes
two, the delete path is where the split leaks (D57)** — moving bytes into their
own store added a second thing to delete, and 139 MB accumulated on a device with
no inspections on it.

**Report the step, and watch for the absence of progress (D43 §8.7).** Every
individual step was bounded and an upload still stopped, with no error and no way
to tell which step died. Adding step reporting and a stall watchdog turned a fault
that had survived three rounds of diagnosis into a named failure on its first
occurrence.

All of it is in `_Shared/Field App Architecture Template.md`, so the next app
inherits the answers rather than the bugs.

---

## 4. Known gaps, left deliberately

**D53 is a plaster.** Photos uploaded against a record already handed over land in
the right folder and are referenced by nothing, because the draft in `current/`
lists the photos as they were at handover. The app warns and names the remedy —
hand over again. The real answer is for a takeover to **reconcile against
`photos/`** rather than trusting the draft's list. The folder is the index (D23);
a list written at one moment cannot stay true. Worth doing before v1.5.

**`Training/Setup_and_Use_Presentation.pptx` was deleted, not updated.** It taught
the old five-step handover and was the only training item not generated from
source. A replacement must be built from scratch. `Training_Module.html` and the
Workflow Chart are current and carry a session between them.

**Julie and Mike's permission test** — whether *Contribute - No Delete* permits the
archive move — can be answered by handing one inspection over twice and looking at
`archive/`. Open since before this work started.

**A device that dies between backups loses up to four minutes.** No feature fixes
that. It belongs in the training.

**In-app notifications** are a real future option, but need a server to send from
(D58). The share-sheet request works everywhere today.

---

## 5. The documentation — this is the main job

Deliberately not written during the week, because the app changed daily. It now
needs a full pass. What has changed since the guides were last true:

| Document | What is new |
|---|---|
| `01_Setup and User Guide` | Upload button on the form with progress; the HANDED OVER badge; thumbnails on takeover and tap-to-fetch; the filing nudge; the picker; Browse all inspections; read-only view; Ask for the baton |
| `02_Iteration Guide` | The bytes store and DB version 1 → 2; the migration; `pickFromList`/`showDialog`; where the build number comes from |
| `03_Handover and Version Control Protocol` | Baton status in the library; forced handover (administrator only); browse and read-only review; what "not handed over" means |
| `04_Project Context Brief` (in `_Shared`) | Version numbers and the feature list |
| `Training/` | As a set, never singly. The deck is gone and needs rebuilding |
| `Guides/` PDFs | Regenerate LAST, once the markdown has settled |
| SharePoint | `BatonStatus` and `BatonHolder` columns, and the column formatting JSON, are configuration the guides should record |

**Progress, 21 August 2026.** Batches A and B are **done**, all against build
`v1.4.0-25`, all documentation tier, suite at 550 assertions with zero failures
throughout.

- **Batch A — `03_Handover and Version Control Protocol`.** Rewritten, with its
  section numbers corrected: the app sends people to §8, which was the wrong
  section. Commit `b7cd864`.
- **Batch B — `01_Setup and User Guide` and `02_Iteration Guide`.** Rewritten.
  `01` Part B was carrying the *same* wrong §8 cross-reference Batch A had just
  fixed in `03`, and the same six-columns error — nothing in this repository
  looks across files, so grep the whole folder before renumbering anything.

**Still to do:** `04_Project Context Brief` (in `_Shared`), the `Training/` set,
rebuild the deck, then the `Guides/` PDFs last. See
`docs/HANDOFF-batch-C-context-and-training.md`.

**Two corrections to the table above**, found by reading the code in Batch B:

- The **filing nudge is two checks**, not one. `confirmFilingBeforeFirstUpload()`
  is the one described above — once per inspection, never after the folder is
  pinned. `confirmFiling()` runs at **every handover** with blanks, pinned or
  not, and changes its wording when the folder is already fixed. Both are
  correct; do not treat either as a duplicate of the other.
- Cards also show **`· 1 uploading`**, a fourth state the earlier list omitted.

**Noted, not fixed:** `05_Release Protocol` still names
`Guides/02_Iteration Guide_v1.3.pdf` in its printed-guides table. The files are
at v1.4.0. Left for Batch D so the fix and the regenerated files move together.

`CHANGELOG.txt` and `docs/DECISION-LOG.md` **are current.** Keep them that way as
you go rather than reconstructing them afterwards.

---

## 6. The polish pass

The owner's words: *"optimising visual appearance, usability, colours, formats, to
make this feel like a polished app."*

**The app speaks two visual languages.** Most dialogs are native `alert` /
`confirm` / `prompt`; several are the custom box (`pickFromList` / `showDialog`).
That was deliberate — function first — and unifying it is the obvious first move.
The custom box is styled from one place and deliberately plain.

Native dialogs still in use, roughly in order of what they would gain:

- the filing nudge before the first upload (`confirmFilingBeforeFirstUpload`)
- the filing gate at handover (`confirmFiling`)
- the fork warning on import, and the various `alert()` confirmations
- `warnIfHandedOver`, and the confirm on opening a handed-over record

**Do not convert anything on a capture-adjacent path without testing on a phone.**
A custom modal that fails to close is worse than an ugly native one that cannot.

---

## 7. How to work on this

**Run the tests.** Serve over HTTP, open `tests.html`. They exercise the real
functions inside `index.html` through a hidden iframe, so they cannot drift from
the shipping code.

Four traps that cost time this week and will cost it again:

- **"App loaded but its functions are not reachable"** means `index.html` has a
  syntax error. That is the suite telling you the app is broken, not the suite
  being broken. It caught real breakages three times.
- **`instanceof` across the iframe boundary is always false.** Use `W.Blob`.
- **The app runs in the iframe, so it reads `W.navigator`,** not the test page's.
- **Never hold a stubbed global across an `await`.** Two tests did, and handed
  their rejection to every other test that touched storage in that window. The
  failures looked like bugs in the code under test.

**Deploying to `/beta/`** means committing to `main`, because `/beta/` is a folder
on `main`. Copy the seven app files into `beta/`, bump `CACHE_VERSION`, push both
branches. Root files stay untouched, so staff stay on v1.3.0. Use a temporary git
worktree outside the OneDrive folder rather than checking `main` out over it.

**Confirm the footer build** before believing any device test result.

---

## 8. What NOT to do

- **Do not push to `main`'s root.** Pushing to `main` is the release, and v1.4
  must not reach a field device before the training set exists.
- **Do not bump `APP_VER`.** 1.4.0 is correct, and unreleased.
- **Do not convert a dialog on the capture path without a device test.**
- **Do not reopen D45 or D49.** The Blob question is settled on evidence from a
  real device.
- **Do not add anyone to `SP_CONFIG.admins`** without being asked. It is currently
  `jamie@dryspace.com.au` alone, and it gates forced handover.

---

## 9. The habit worth keeping

Several faults this week survived multiple rounds because a conclusion was drawn
from what the screen showed rather than from what the data said. The screen was
wrong each time — a counter that ignored a state, a panel that had silently
stopped repainting, a step marker left over from an attempt that had moved on, an
empty folder reported as held.

`diagnostics.html` §6 reads the database directly and prints what is really there.
It settled in one run what deduction had failed to settle in three.

**When the app and the diagnostic disagree, the app is wrong.**
