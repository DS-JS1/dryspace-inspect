# Dryspace Site Inspection App — read this before changing anything

This file is loaded automatically at the start of every session. It is short on
purpose. The detail lives in the two documents it points at.

## Before you touch the code

1. **Classify the change first** — patch, minor, or major. It determines what else
   has to be updated. See `docs/RELEASE-PROTOCOL.md` §1.
2. **Read `docs/DECISION-LOG.md`** before proposing anything architectural. Many
   questions that look open are already settled, with reasons. Reopening one
   without new information wastes a session and risks regressing a fix.
3. **Run the tests** — serve the folder over HTTP and open `tests.html`. Expect
   zero failures before you start and zero when you finish.

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
| Tests | `tests.html` — 217 assertions, run over HTTP |
| Protocol | `docs/RELEASE-PROTOCOL.md` — what to update, when |
| Decisions | `docs/DECISION-LOG.md` — what was decided and why |
| Architecture | `docs/FIELD-APP-TEMPLATE.md` — for building sibling apps |
| Staff material | `Training/` — cards, chart, module |

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
