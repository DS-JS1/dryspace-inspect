# Handoff — finishing v1.4

**Written:** 21 August 2026, after three days of field testing on the iPhone that
had been failing.
**For:** the session that polishes the app and updates the documentation.
**Status of the code:** the faults are fixed and the feature work is done. What
remains is appearance, usability, and the guides.

> **Read `CLAUDE.md` first, then `docs/DECISION-LOG.md` §2 (D43–D54).** Those
> twelve decisions are this week's work, and most of them cost something to learn.

---

## 1. Say the tier first

`CLAUDE.md` requires it. Most of what follows is **patch** work folded into the
unreleased 1.4.0: `APP_VER` stays, `CACHE_VERSION` moves. If you find yourself
changing the record schema or what staff are trained to tap, stop — that is a
different job and a different tier.

---

## 2. Where things actually stand

**v1.3.0 is live and is what staff run.** Untouched throughout this work.

**v1.4.0 is built, tested on a real device, and not released.** It lives on the
`v1.4` branch and is deployed at `/beta/`, which announces itself as a test build.

**The build number is in the footer** — `build v1.4.0-20`. `APP_VER` cannot answer
"which build is this", because every build since -2 reports 1.4.0; the footer
reads the live service-worker cache name instead. Ask for it in any bug report.
It saves a round trip, and this session lost several before it existed.

### What field testing found, and where it is written down

| | |
|---|---|
| D43 | An aborted IndexedDB transaction fires `onabort`, not `onerror` |
| D44, D50, D52 | A screen that says something untrue is worse than one that says nothing |
| D45 → **D49** | Never put a Blob in IndexedDB. D45 was the same fault diagnosed one layer too high |
| D46 | The filing question belongs at the first upload, where it still changes something |
| D47 | "Unreadable" earns one retry before it means "gone" |
| D48 | A record the queue cannot see is a record that is lost |
| D51 | A handed-over record carries what the photos *are*, not the photos |
| D53 | A photo can reach SharePoint with nothing referencing it — **not fully fixed, see §4** |
| D54 | The report carries a readable copy and a route to the real one |

All of it is now in `_Shared/Field App Architecture Template.md` as well, so the
next app inherits the answers rather than the bugs.

---

## 3. What the polish session is for

The owner's words: *"optimising visual appearance, usability, colours, formats,
to make this feel like a polished app."*

**The one thing to know before starting:** the app currently speaks **two visual
languages**. Most dialogs are native `alert` / `confirm` / `prompt`; three are the
custom box (`pickFromList` / `showDialog`). That was deliberate — function first —
and unifying it is the obvious first move. The custom box is styled from one
place and is deliberately plain, so converting the rest is mechanical.

Native dialogs still in use, roughly in order of how much they would gain:

- the filing nudge before the first upload (`confirmFilingBeforeFirstUpload`)
- the filing gate at handover (`confirmFiling`)
- the fork warning on import, and the various `alert()` confirmations
- `warnIfHandedOver`, and the confirm on opening a handed-over record

**Do not convert anything on a capture-adjacent path without testing on a phone.**
A custom modal that fails to close is worse than an ugly native one that cannot.

---

## 4. Known gaps, left deliberately

**D53 is a plaster, not a fix.** Photos uploaded against a record already handed
over land in the right folder and are referenced by nothing, because the draft in
`current/` lists the photos as they were at handover. The app warns and names the
remedy — hand over again — but the real answer is for a takeover to **reconcile
against `photos/`** rather than trusting the draft's list. The folder is the index
(D23); a list written at one moment cannot stay true. Worth doing before v1.5.

**`Training/Setup_and_Use_Presentation.pptx` was deleted, not updated.** It taught
the old five-step handover and was the only training item not generated from
source. A replacement must be built from scratch. `Training_Module.html` and the
Workflow Chart are current and carry a session between them.

**Julie and Mike's permission test** — whether *Contribute - No Delete* permits the
archive move — can now be answered by handing one inspection over twice and
looking at `archive/`. Open since before this work started.

---

## 5. Documentation still to write

Deliberately not written yet, because the UI is about to change under it:

- `01_Setup and User Guide` — the upload button on the form, the handed-over
  badge, thumbnails on takeover, the filing nudge, the picker, browse mode
- `02_Iteration Guide` — the bytes store and the database version bump are the
  only structural changes a future developer must know about
- `03_Handover and Version Control Protocol` — §4 is current; browse mode and the
  handed-over marking are new and belong in it
- `Training/` — as a set, never singly
- `Guides/` PDFs — regenerate last, once the markdown has settled

`CHANGELOG.txt` and `docs/DECISION-LOG.md` **are current.** Keep them that way as
you go, rather than reconstructing them afterwards.

---

## 6. How to work on this

**Run the tests.** Serve over HTTP and open `tests.html`. **513 assertions, zero
failures.** They exercise the real functions inside `index.html` through a hidden
iframe, so they cannot drift from the shipping code.

Two traps that cost time this week and will cost it again:

- **"App loaded but its functions are not reachable"** means `index.html` has a
  syntax error. That is the suite telling you the app is broken, not the suite
  being broken. It caught a real breakage twice.
- **`instanceof` across the iframe boundary is always false.** Use `W.Blob`, not
  `Blob`.

**Deploying to `/beta/`** means committing to `main`, because `/beta/` is a folder
on `main`. Copy the seven app files into `beta/`, bump `CACHE_VERSION`, push both
branches. Root files stay untouched, so staff stay on v1.3.0. Use a temporary git
worktree outside the OneDrive folder rather than checking `main` out over it.

**The device needs the cache to turn over.** Confirm the footer shows the build
you just pushed before believing any test result.

---

## 7. What NOT to do

- **Do not push to `main`'s root.** Pushing to `main` is the release, and v1.4
  must not reach a field device before the training set exists.
- **Do not bump `APP_VER`.** 1.4.0 is correct, and unreleased.
- **Do not convert a dialog on the capture path without a device test.**
- **Do not reopen D45 or D49.** The Blob question is settled on evidence from a
  real device, and the reasoning is in both the decision log and the template.

---

## 8. One habit worth keeping

Three faults this week survived multiple rounds because a conclusion was drawn
from what the screen showed rather than from what the data said. The screen was
wrong each time — a counter that ignored a state, a panel that had silently
stopped repainting, a step marker left over from an attempt that had moved on.

`diagnostics.html` §6 reads the database directly and prints what is really
there. It settled in one run what deduction had failed to settle in three. **When
the app and the diagnostic disagree, the app is wrong.**
