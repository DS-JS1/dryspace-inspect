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
2. **Read `docs/OPEN-ITEMS.md`.** It is the single register of what is
   outstanding, each item with an ID and an exit criterion. Anything not on it is
   not tracked. Check whether your work closes an item, touches one, or adds one —
   and if it adds one, put it there before you finish.
3. **Read `docs/DECISION-LOG.md`** before proposing anything architectural. Many
   questions that look open are already settled, with reasons. Reopening one
   without new information wastes a session and risks regressing a fix.
4. **Run the tests** — serve the folder over HTTP and open `tests.html`. Expect
   zero failures before you start and zero when you finish.

## Work in progress

**v1.3.0 is live and is what staff run.** A v1.4 test build is deployed alongside
it at `/beta/`, which staff do not use and which announces itself as a test build.

**The mobile upload fault is resolved.** All four hypotheses in
`docs/v1.4-plan.md` §3 were answered on the failing iPhone on 18 Aug 2026: the
chunked upload path is proven against real Graph (41.3 MB video, 9 chunks,
byte-exact read-back), token refresh passes, `crypto.subtle` is present, and
storage pressure is not a factor. The original fault was most probably **B5**,
fixed in Batch 0. **Do not reopen this without new evidence** — the reasoning,
and why proving it further is not worth a field device, is in the decision log.

**A second, different stranding was found on the beta on 18 Aug 2026 and fixed**
(D43, D44). Same symptom, different layer: `tx()` handled `onerror` but not
`onabort`, so an aborted IndexedDB write never settled and the upload queue's
`save()` never returned. Storage calls are now bounded and every transaction
ending is handled. This is what "new evidence" looks like — the rule above is
not a ban on looking, it is a ban on re-arguing B5 from the same facts.

**v1.4.0 is built and not released.** All of `docs/v1.4-plan.md` is done —
upload recovery and deadlines (D28–D33), the record moving through SharePoint
(D34–D38), automatic backup of work in progress (D39–D42), and Batch 4's
button placement, filing-critical gate and documentation set (D34–D35).

**It is a major release** — record schema 3 → 4, and a new storage target for the
record. Numbered 1.4.0 rather than 2.0.0 deliberately; the reasoning is in the
decision log.

**The baton test is part-run — one step remains.** Steps 1–4 pass on a real
iPhone against real SharePoint. The run found, and this session fixed, the fault
that had made the test unpassable: the app could not read the library columns
back, so `batonState()` could never return `held` and **"Force the handover"
could not be offered to anybody**. Fixed and proved at the transport;
**not yet proved at the app.** Step 5 needs a SECOND PERSON, because every run so
far has had one person as both administrator and holder, which is not what the
feature is for. See `docs/HANDOFF-22-august-baton-and-storage.md`.

**The next session is documentation and polish** — appearance, usability, and the
guides. Follow `docs/HANDOFF-v1.4-polish.md`, which carries where things
stand, what D43–D54 cost to learn, and the gaps left deliberately.

**Nothing is now owed on documentation.** Both items that stood here are closed:

- **The replacement training deck is done.** `Training/Setup_and_Use_Deck.html`,
  built from scratch in August 2026 and exported to PDF at v1.4.0. It replaces
  `Training/Setup_and_Use_Presentation.pptx`, which was **deleted** because it
  taught the old five-step handover and was the only training item not generated
  from source. HTML rather than PowerPoint on purpose — decision log §4a, and not
  a decision to revisit casually.
- **Julie and Mike's permission test is ANSWERED — yes.** Proved on the device,
  21 August 2026: *Contribute - No Delete* does permit the archive move, and
  `archive/` held 11 files afterwards. **Closed.**

**The folder restructure is done** — 18 August 2026. This is the `v1.4` working
folder, and `FIELD-APP-TEMPLATE.md` and `04_Project Context Brief.md` have left
it for `00_AI Tools in Development/_Shared/`, which is now its own repository.
See the decision log §4.

**The major-tier document set is complete** apart from the deck above.
`01_Setup and User Guide`, `04_Project Context Brief`, `Training/` as a set,
`02_Iteration Guide` and the architecture template were all updated for v1.4.
`03_Handover and Version Control Protocol.md` §4 was rewritten as the work
happened, because the change made it factually wrong.

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
- **Never put a Blob in IndexedDB. Store bytes as an `ArrayBuffer`.** A Blob
  in IndexedDB is a reference to a separate file the browser writes and can
  lose: the record survives, reports the right size, and reading it throws
  "The object can not be found here". An ArrayBuffer is serialised inside
  the record, so there is nothing to lose track of. Rebuild a Blob only when
  one is needed, and never store it (D49; D45 was the same fault diagnosed
  one layer too high). This cost a real inspection's evidence photo.
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
| Open items | `docs/OPEN-ITEMS.md` — **the single register.** Read it first |
| Decisions | `docs/DECISION-LOG.md` — what was decided and why |
| Open work | `docs/v1.4-plan.md` — field findings and the next build |
| Architecture | `_Shared/Field App Architecture Template.md` — **outside this repository**, two levels up in `00_AI Tools in Development/`, because it is for building sibling apps |
| Business background | `_Shared/Dryspace Context Brief.md` — same place, same reason |
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
