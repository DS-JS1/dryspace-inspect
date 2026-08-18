# Dryspace Site Inspection App — read this before changing anything

This file is loaded automatically at the start of every session. It is short on
purpose. The detail lives in the documents it points at.

## Before you touch the code

**Say which tier you think this change is, in your first reply, before editing
anything.** That is how the user knows this file was actually loaded — a session
that starts editing without naming a tier has not read it, and they should stop
and point you here.

1. **Classify the change first** — patch, minor, or major. It determines what else
   has to be updated. See `05_Release Protocol.md` §1. If the user has not said
   enough to tell, ask; do not guess, because the tier decides which documents
   must be updated alongside the code.
2. **Read `docs/DECISION-LOG.md`** before proposing anything architectural. Many
   questions that look open are already settled, with reasons. Reopening one
   without new information wastes a session and risks regressing a fix.
3. **Run the tests** — serve the folder over HTTP and open `tests.html`. Expect
   zero failures before you start and zero when you finish.

## Work in progress

**v1.3.0 is live. Photo upload still does not work on mobile.** Read
`docs/v1.4-plan.md` before touching anything — it carries the field-test findings
and ranked hypotheses for the mobile hang.

**v1.4.0 is built and not released.** Batches 0–3 of `docs/v1.4-plan.md` are done:
upload recovery and deadlines (D28–D33), the record moving through SharePoint
(D34–D38), and automatic backup of work in progress (D39–D42).

**It is a major release** — record schema 3 → 4, and a new storage target for the
record. Numbered 1.4.0 rather than 2.0.0 deliberately; the reasoning is in the
decision log.

**Two things are still owed before it can ship:**

- **The mobile hang is unproven.** Three real ways an upload could hang for ever
  were found by reading and fixed; none is confirmed as *the* cause. Run
  `diagnostics.html` on the iPhone or iPad that fails, signed in, with a real
  photo from the camera roll — it names the hypothesis when it confirms one. Do
  not describe the hang as solved until someone has.
- **Batch 4 and the major-tier document set** — `01_Setup and User Guide`,
  `04_Project Context Brief`, `Training/` as a set, `02_Iteration Guide`,
  `docs/FIELD-APP-TEMPLATE.md`, then the new `v1.4` folder with this one moved to
  `Superseded`. `03_Handover and Version Control Protocol.md` §4 is already done,
  because the change made it factually wrong.

**Do not let this reach a field device before that document set exists.** The
buttons staff are trained on have changed.

## Non-negotiables

These exist because breaking one of them lost, or nearly lost, real data.

- **Every control gets a permanent `data-fid`.** A control without one is silently
  excluded from saved data — no error, no warning, the answer simply never saves.
- **Every file input gets a permanent `data-mfid`.** Same reason, for photos.
- **Never rename or reword a radio/checkbox option without a `VALUE_REMAP`.**
  Answers are stored as the option's text; rewording orphans them on next save.
- **Never delete a local original that has not been verified in SharePoint.**
  Verification means an independent read-back, never the upload response.
- **Never bump `APP_VER` without bumping `CACHE_VERSION`.** A forgotten cache bump
  is silent: the deploy succeeds and every installed device keeps the old app.
- **Capture is never blocked.** Storage warnings warn; they do not prevent a photo
  being taken. Running out of space is recoverable; a missed defect is not.
- **The app must work with no signal.** Nothing at capture time may require a
  network call.

## Where things are

| | |
|---|---|
| The app | `index.html` — form, record layer, UI |
| Media logic | `ds-media-sync.js` — renditions, naming, queue, state machine |
| SharePoint | `ds-sharepoint.js` — Graph transport |
| Sign-in | `ds-auth.js` — OAuth2 PKCE |
| Tests | `tests.html` — run over HTTP; expect zero failures |
| Device diagnostics | `diagnostics.html` — run on the phone that fails; names the hypothesis |
| Protocol | `05_Release Protocol.md` — what to update, when |
| Decisions | `docs/DECISION-LOG.md` — what was decided and why |
| Open work | `docs/v1.4-plan.md` — field findings and the next build |
| Architecture | `docs/FIELD-APP-TEMPLATE.md` — for building sibling apps |
| Staff material | `Training/` — cards, chart, module |
| Printed guides | `Guides/` — generated PDFs, never edited directly |

## Working notes

- **Development caching bites constantly.** The service worker serves cache-first,
  so an edit can appear to do nothing. Load `index.html?nosw=1` for a guaranteed
  fresh copy. This has twice caused the test suite to grade stale code.
- **git internals live outside this folder** at `C:\Users\jamie\dev\.git-dryspace-inspect`,
  because this folder is inside a OneDrive-synced SharePoint library and syncing
  `.git` corrupts it. The `.git` entry here is a pointer file — do not delete it.
- **Nothing is deployed until it is pushed.** `main` on GitHub is what staff run.
  Pushing to `main` *is* the release. Do not push without being asked.
- **Australian English** throughout — metres, organised, colour, labour.
