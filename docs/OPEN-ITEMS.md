# Open items — the single register

**This is the list.** If something is outstanding and it is not here, it is not
tracked, and it will be forgotten. That has already happened twice: Julie and
Mike's permission test sat answered-but-unstruck in `CLAUDE.md` for a day, and
the library-column fault survived a whole release cycle because the failure that
would have shown it was swallowed by design.

**Every item has an ID.** Cite it in commits, handoffs and the changelog —
`OI-3`, not "the storage thing". IDs are never reused.

**"Done means" is the point of this file.** An item without an exit criterion is
a worry, not a task. If you cannot write down what would close it, say so in the
row rather than leaving it implied.

---

## How this file stays honest

It is wired into three places, so it cannot quietly rot:

| Where | What it does |
|---|---|
| `CLAUDE.md` | Loaded every session, and tells you to read this before proposing work |
| `05_Release Protocol.md` §2 | Every tier is gated on no **BLOCKS RELEASE** item being open |
| `tests.html` | Fails if this file is missing, or if an open item has no *Done means* |

The test does **not** fail because items are open — open work is normal. It fails
when the register itself has decayed.

---

## 1. Blocks release

**Nothing blocks release.** OI-1, OI-2 and OI-11 all closed on 22 August 2026, and
OI-10 was re-graded out of this list the same day once it was known that nobody
has ever had data in the app. The remaining items below are worth doing and none
of them stands between v1.4.0 and a release decision.

---

## 2. Open, not blocking

### OI-16 · The device batch — five open items that only a phone can answer
**Status:** open · **Tier:** a test run, not a change
**Detail:** collects the device-only halves of **OI-10**, **OI-13**, **OI-14**,
**OI-12** and **OI-5**. Raised 22 August 2026 at the close of Session A

Five separate items are each blocked on the same scarce thing: a real iPhone,
with real SharePoint behind it. Run separately they cost five trips; run together
they cost one.

**This is a checklist, not a task.** It closes nothing by itself; it is the
vehicle for closing the five. Strike it when they are struck.

**Before starting:** `/beta/` must be carrying build **`v1.4.0-31`** or later, or
steps 2–4 are testing the wrong code. The footer names the build. Nothing here
touches `main`'s root, and none of it is a release.

#### First attempt, 22 August 2026 — stopped at step 1, and the checklist was wrong

**Step 1 as first written could not have worked.** Opening the beta after the live
app does not upgrade anything: the two use different databases (decision log
§4h), so the migration runs against an empty store and reports success having
migrated nothing. **Resolved 22 August 2026** by adding `/rehearsal/` — a v1.4
copy on a non-beta path, which therefore opens the real `ds-inspections`. Step 1
below is the corrected procedure; OI-10 carries the reasoning.

**The live app hung, and that is expected — do not chase it.** The owner created a
record in the **live** app, added a photo, tapped **Upload now**, and the app stuck
on *Uploading…*. The live root serves **v1.3.0**, and v1.3.0 has **no bounded waits
anywhere**: `tx()` handles `oncomplete` and `onerror` but **not `onabort`**
(OI-C7 / D43, D44), and there is no `AbortController` in its `ds-sharepoint.js`
and no database deadline in its `index.html`. Any stall, in storage or on the
network, hangs for ever and reports nothing. Both fixes are in v1.4 and neither is
in the live app. **This is the on-device reproduction that decision log
§"Batch 1" says never happened** — worth having, and not a reason to reopen
anything. Recover by reloading the live app; the record survives.

**Nothing in this batch requires an upload from the live app.** Step 1 needs
v1.3-format *data* on the device, not a proven upload. Do not tap **Upload now**
there.

**`diagnostics.html` is only at `/beta/`, and it reads the beta's database.** It
derives its target from the path, so it cannot see the live app's state at all,
and §8b deletes `ds-inspections-beta` rather than the live `ds-inspections`
(§8c does that). A diagnostic run from `/beta/` says nothing about a fault in the
live app — the first attempt's chunked-upload run was clean, and could not have
been anything else.

**Watch for, during steps 2–4:** the stall that hung the live app is
**undiagnosed**, because v1.3.0 cannot report which of its two unbounded waits it
was. v1.4 bounds both, so if the same stall recurs on the beta it will surface as
a reported error instead of a hang. If it does, that is a real fault and worth
chasing. If several uploads pass cleanly, record it as the unbounded-wait fault
alone and let it go.

| # | For | On | What to do |
|---|---|---|---|
| 1 | **OI-10** | live → **rehearsal** | The upgrade rehearsal, on the corrected procedure — **not** the beta, which migrates nothing. **`ds-inspections` must be at version 1 before you start:** open `/beta/diagnostics.html` §8c, and if it lists `ds-inspections` at version **2**, delete it there and rebuild the record. Then: live app → new inspection → **two** photographs, one over 4 MB — **do not tap Upload now** — then open `/rehearsal/`. Confirm from `/rehearsal/diagnostics.html` §6 and §8, not by eye: both photographs read back, `bytes` holds them, the media records carry no blobs, the record reads `schema: 4`, nothing marked *needs retaking*. **One-way:** afterwards the live v1.3.0 app cannot open the database until §8c clears it |
| 2 | **OI-13** | beta | **The fork warning — the one that matters most.** Make a record **in the beta** with a photograph (it no longer has to come from step 1). *Share draft (offline fallback)* to get a `DS_Draft` file out, then change something in the record so the copy on the device is the newer one, then import that file back. **Screenshot the dialog.** It must show all three choices, and the last one — *Cancel this import / Nothing on this device changes* — must be readable without the box being cut |
| 3 | **OI-13** | beta | **The handover confirmation**, the message photographed truncating. Hand that record over through SharePoint. **Screenshot it.** It must show *"Delete your copy from this device once they confirm they have it."* in full — that sentence is the whole point of the item |
| 4 | **OI-14** | beta | Open the record and tap the **"N logged changes"** count in the status bar. The entries open, newest first, each carrying what happened, when, and who. Scroll to the oldest and back |
| 5 | **OI-12** | beta, **`v1.4.0-32` or later** | **Rewritten 22 Aug 2026 — the old step could not have shown what it was looking for.** It said to hand a record over and then compare, but a handover writes *Waiting* and the app reads *WAITING*, so the two AGREE and the step would have refuted a divergence that only appears after a **takeover**. So: hand a record over, then **take it over**, then browse the library in the app and open the same folder in SharePoint **in the same few minutes**. On `-32` the app must now read **IN PROGRESS** and agree with the column; **Take it over** must be gone; and an administrator must be offered **Force the handover**. Note both readings and the time |
| 6 | **OI-5** | either | Take a photograph on the iPhone, select it through the app's file input, and inspect it for GPS EXIF. Decides whether the Google Photos Maps plan is achievable at all |

**Steps 2 and 3 are the ones a desktop cannot stand in for.** A desktop browser
does not truncate, so it will show these passing whether or not they are fixed.
That is precisely how OI-13 survived a polish pass that had already named it.

**If a dialog fails to close, stop and say so.** That is the one outcome worse
than the fault being fixed — a modal that traps somebody on a phone in a
basement. The capture path was deliberately left on native dialogs for this
reason, so nothing at capture time can be affected either way.

**Run 2 outcome (step 1):** the migration passed, but `diagnostics.html` said it
had failed — see **OI-17**. The page is fixed; step 1 needs one re-run on the
corrected page to be judged, and that re-run is the whole of what OI-10 still
owes.

**Housekeeping:** the first attempt's diagnostic left
`_diagnostics/diag_2026-08-22T05-43-40_IMG_9632.jpeg` (6.36 MB) in the library.
Delete it when convenient; nothing references it.

**Step 5 changed on 22 August 2026** — both what it asks and what it proves. It
was a divergence check argued from code; OI-12 is now decided and built, so it is
the device verification that item owes. It needs **`v1.4.0-32` or later**, where
steps 2–4 need only `-31`.

**Done means:** every row above is run and its result written into the item it
belongs to, with the two screenshots attached for step 2 and step 3. Rows may be
answered across more than one sitting; the batch is struck when the last one is
answered, whether the answer was the hoped-for one or not. **Step 1 is answered
by a recorded decision as much as by a test run** — see OI-10.

### OI-10 · The v1.3 → v1.4 upgrade has never been rehearsed on a device
**Status:** open — **re-graded 22 Aug 2026, no longer blocks release** · **Tier:** a test run
**Run it as part of OI-16, step 1** — it must go first, and what it produces is
what the later steps need
**Detail:** `05_Release Protocol` §2, major tier · decision log §4g, §4h

Three migrations run the first time a staff member updates, against their real
evidence photographs:

| | v1.3 | v1.4 |
|---|---|---|
| IndexedDB version | **1** | **2** |
| Stores | `inspections`, `media` | … and `bytes` |
| Photographs live | on the media record | in the `bytes` store |
| Record schema | 3 | 4 |

Tested so far only against synthetic `{schema: 3}` objects and the v1.1.1 fixture
in `tests.html`. **Never against a real v1.3-produced record, with real photos, on
a real phone** — which is what the protocol's major-tier line asks for.

**Why it no longer blocks:** the app has never been deployed to staff and nobody
but the owner has used it, so no real v1.3 record exists anywhere to migrate. The
code still runs on every boot and must not misbehave on a fresh install, which is
why this stays open — but it is a smoke test now, not a data-safety gate.

Two reasons it matters more than it looks. `migrateMediaBytes()`'s failure path
marks a photo *"the stored file was lost by the browser — this photo needs
retaking"*, so a hiccup is destructive to the record's state. And it opens with
`dbAll('media')` — the call OI-9 says can come back short. A short listing there
migrates nothing and reports success.

#### THESE STEPS WERE WRONG. Corrected 22 August 2026, on the device.

The procedure below used to read: delete the database with diagnostics §8b, make
a record in the **live** app, then *"open the **beta** on the same device — that
is the upgrade"*. **It is not the upgrade, and has not been since the same day it
was written.**

Decision log §4h separated the databases: `DB_NAME` is now
`isBetaBuild() ? 'ds-inspections-beta' : 'ds-inspections'`. So:

| | opens | at version |
|---|---|---|
| live app, at the root | `ds-inspections` | 1 |
| v1.4 at `/beta/` | `ds-inspections-beta` | 2 |

The live app writes one database and the beta creates a **different, empty** one.
Opening the beta after the live app upgrades nothing — `migrateMediaBytes()` runs
against an empty store, finds no media, and **reports success having migrated
nothing.** That is this item's own stated worry (*"a short listing there migrates
nothing and reports success"*) reached from the other end, and the old steps walk
straight into it.

Two further faults in the old steps, found the same way:

- **§8b cannot clear the live database.** `diagnostics.html` exists only at
  `/beta/`, and it derives its target from the path, so §8b always deletes
  `ds-inspections-beta`. **§8c** is the only route to the live `ds-inspections` —
  which is exactly why §8c was built.
- **Do not upload anything during this test.** The rehearsal needs v1.3-format
  *data*, not a proven upload. See OI-16's note on the live app's hang.

**How it was found:** §4h was written *"while scoping the upgrade rehearsal
(OI-10)"* and records that beta data not carrying over is *"the intended
behaviour rather than a side effect"* — but nobody came back and corrected these
steps. The decision and the procedure it invalidated sat three screens apart in
the same register for a day.

#### RUN 2, 22 August 2026 — the migration PASSED, and the diagnostic said it failed

**The upgrade ran and carried everything.** `/rehearsal/` upgraded the real
`ds-inspections` from version 1 to 2, and the `bytes` store came out holding
**3 rows, 18.2 MB of originals** — which is 5,715,296 + 6,672,000 + 6,672,000 =
19,059,296 bytes, the three photographs exactly. No orphans in either direction.
No record carries *"the stored file was lost by the browser"*, and none has
`retryable=no`, so **no record took `migrateMediaBytes()`'s failure path**.

**But the page reported `3 of 3 unreadable — HYPOTHESIS 2 CONFIRMED` and
`bytes=MISSING` on every record.** That was the diagnostic being wrong, not the
data. Both panels read `rec.original` / `rec.blob` — the **pre-v1.4** fields —
and a successful migration **deletes** them. So the healthier the device, the
louder the alarm: a clean migration was guaranteed to report total data loss.

Fixed the same day. `checkBlobs()` now goes through `bytesFor()`, which is what
the upload path itself calls, and rebuilding the Blob from the store proves the
round-trip rather than just the presence of a field. The state panel reads the
`bytes` store alongside `media` and says where each file lives —
`bytes=5715296(store)` or `(record)`. Proved locally against both shapes before
redeploying: a migrated record reads *readable from the bytes store*, and a
v1.3-shape record reads `(record)` before boot and `(store)` after, which is the
migration happening in view.

**What is still owed on this item:** a re-run on the corrected page, and the one
reading the old output never showed — `schema: 4` on the record. The evidence so
far says the migration worked; it has not yet been *read off an instrument that
can be trusted*, and this project has been caught believing a confident
diagnostic before.

#### RUN 3, 22 August 2026 — `schema 3: 2  2 NOT MIGRATED`

**The record schema is migrated LAZILY, and nothing at boot does it.**
`ensureSchema()` is called only when a record is opened (`index.html:2675`,
`2855`), imported (`4250`, `4414`) or saved (`2413`). The only boot-time
migration is `migrateMediaBytes()` (`5266`), which moves photo bytes and does
not touch the record. So a record that has never been opened in v1.4 sits at
schema 3 for ever, on the home screen, looking migrated.

**This is not necessarily wrong** — lazy migration is a legitimate choice, and
the record is raised the instant somebody opens it. Two things make it worth an
answer rather than a shrug:

1. **OI-10's exit criterion cannot be met by the upgrade alone.** *"The record
   reads `schema: 4`"* only becomes true after each record is opened. The
   rehearsal step must say so, or it reports a failure that is really an
   un-taken action. **Open the record in `/rehearsal/`, then re-read §8.**
2. **A record can travel at schema 3 without ever being opened.** Handover,
   draft export and the backup all read the stored record. Whether any consumer
   assumes schema 4 has **not been checked**, and that is the real question
   hiding behind the reading.

**Raised as OI-19.** Do not fold it into this item: OI-10 is a test run, and
this is a design question about when migration happens.

#### What it actually takes

The migration only runs where v1.4 opens `ds-inspections`, and `isBetaBuild()` is
true for `/beta/` **and nothing else**. So any non-beta path serves a v1.4 that
upgrades the real database. Three ways forward, none of them free:

1. **CHOSEN, 22 August 2026. A throwaway `/rehearsal/` copy of v1.4 on `main`** — same shape as `/beta/`,
   root untouched, releases nothing. The one honest rehearsal available before
   release, because it upgrades the real database exactly as the release will.
   **It is one-way on that handset:** once `ds-inspections` reaches version 2 the
   live v1.3.0 app can no longer open it (§4h), and the way back is diagnostics
   §8c. **Do not sign in from it** — `spRedirectUri()` returns the *live* URI,
   which Entra matches by exact string; the rehearsal is a local storage test and
   needs no network.
2. **Rehearse at release**, accepting the migration is unproven on a device until
   the moment it matters. §4h already records that this release has no rollback.
3. **Declare it untestable before release** and close this item on that reasoning,
   recorded in the decision log.

**Done means:** a real v1.3-produced record, with real photographs on a real
phone, is carried through an upgrade that genuinely runs — both photographs read
back, the `bytes` store holds them, the media records no longer carry blobs, the
record reads `schema: 4`, and nothing is marked *needs retaking* — confirmed from
diagnostics §6 and §8 **on the corrected page (OI-17)** rather than by eye, and
appended to the bug-test file. **Or**
option 2 or 3 above is chosen and recorded in the decision log with its reasoning.
An upgrade that migrated nothing does not close this, however green it looks.


### OI-17 · `diagnostics.html` reported total data loss on a healthy device
**Status:** **fixed 22 Aug 2026, awaiting confirmation on the phone** · **Tier:** patch — a diagnostic, not the app
**Detail:** `diagnostics.html` §2 `checkBlobs()`, §state `collectStoredState()` ·
found by running OI-10's rehearsal

Two panels judged whether a photograph still existed by reading `rec.original`
/ `rec.blob`. Those are the **pre-v1.4** fields, and `migrateMediaBytes()`
**deletes them** once the bytes are safely in the `bytes` store. So on any
correctly migrated device both panels reported the worst thing they can say:
*"there is no file to upload"*, *"3 of 3 unreadable — HYPOTHESIS 2 CONFIRMED"*,
and `bytes=MISSING` on every record.

**Why this is worse than a wrong number.** This page is the instrument OI-10's
exit criterion names — *"confirmed from diagnostics §6 and §8 rather than by
eye"*. A tool that reports catastrophe on a healthy device is not a false alarm
you learn to ignore; it is one that would have condemned a working migration, or
sent somebody hunting a fault that was never there. The decision log already
carries the same lesson in different words: *a diagnostic pointed at the wrong
store reports an empty device with total confidence.*

**Fixed:** `checkBlobs()` goes through `bytesFor()` — the call the upload path
itself makes — so it checks what actually ships, and rebuilding the Blob from
the store proves the round-trip. The state panels read the `bytes` store
alongside `media` and label the source, `(record)` or `(store)`, so a migration
is visible rather than inferred. Verified locally against both record shapes.

**The general lesson, worth more than the fix:** a diagnostic must be updated in
the same change as the storage layout it inspects. This one was written against
v1.3's layout and survived the v1.4 rewrite untouched, and nothing failed until
it was pointed at a device that had actually migrated.

**Done means:** re-run on the phone against the migrated record and the panels
report the photographs readable from the bytes store, with sizes matching
`origSize`. Then OI-10 can be judged on evidence.

### OI-19 · The record schema migrates lazily, so an unopened record stays behind
**Status:** open — raised 22 Aug 2026 by the OI-10 rehearsal · **Tier:** unknown until answered
**Detail:** `index.html:1953` `ensureSchema()` · called at `2413`, `2675`, `2855`, `4250`, `4414` · boot migration at `5266`

The v1.4 upgrade moves photo **bytes** at boot (`migrateMediaBytes()`) and does
**not** touch the **record**. `ensureSchema()` runs only when a record is opened,
imported or saved. So after upgrading, every record a person has not opened
still reads `schema: 3` — proved on the device: `schema 3: 2   2 NOT MIGRATED`,
on a handset whose byte migration had worked perfectly.

**Why it may be fine:** the record is raised the moment it is opened, and a
record nobody opens is a record nobody is using. Lazy migration avoids rewriting
every record at boot, which is exactly the kind of bulk write that aborts under
storage pressure (D43, D44).

**Why it may not be:** the stored record is read by things that are not "opening"
it. Handover uploads `draftPayload(job, …)`, the backup exports every record, and
the browse list reads them. **Whether any of those assumes schema 4 has not been
checked** — that is the whole of this item. A schema-3 record handed to a device
that expects 4 is the same shape of fault as the ones this project keeps finding:
silent, and only visible to whoever receives it.

**Cheap to settle:** read `draftPayload()`, the backup export and `renderHome()`
and ask whether each tolerates `schema: 3`. No device needed.

**Done means:** either every consumer of a stored record is confirmed to tolerate
an unmigrated one — recorded in the decision log, and OI-10's step reworded to
open each record before reading the schema — or the record migration is moved to
boot alongside `migrateMediaBytes()`, with the bulk-write risk considered
explicitly.

### OI-18 · The printed guides are stale, and nothing will say so before release
**Status:** open — **do this at the v1.4.0 release, before pushing to root** · **Tier:** part of the release, not a change
**Detail:** `05_Release Protocol` §4a and §2 · `tools/make_guides.py` · raised 22 Aug 2026

**All four sources have now changed on 22 August and no PDF was regenerated:**

| Source | What changed | Its PDF |
|---|---|---|
| `02_Iteration Guide.md` | gained the OI-17 rule — a storage change is not finished until `diagnostics.html` is updated in the same commit | `Guides/02_Iteration Guide_v1.4.0.pdf` — **stale** |
| `05_Release Protocol.md` | gained the Pages deploy confirmation at the head of §5 | `Guides/05_Release Protocol_v1.4.0.pdf` — **stale** |
| `03_Handover and Version Control Protocol.md` | OI-12 / D60 — four badge states not three, what *Take it over* and *Force the handover* are offered on, and the reversal of *"the app never reads `BatonStatus` back"* | `Guides/03_Handover and Version Control Protocol_v1.4.0.pdf` — **stale, and it is the one staff are pointed at** |
| `01_Setup and User Guide.md` | OI-12 / D60 — a note that `BatonStatus` is now read back, so a missing or misspelled column changes what the app offers | `Guides/01_Setup and User Guide_v1.4.0.pdf` — **stale** |

So the printed guides and their sources now disagree, on every one of the four —
including the handover protocol, which is what somebody reaches for when a folder
is in a state they do not recognise.

**`Training/Setup_and_Use_Deck_v1.4.0.pdf` is stale too, and it is not covered by
`make_guides.py`.** The deck gained the fourth badge state and the rule that
*Take it over* only appears on **WAITING** (OI-12 / D60). It is exported from
`Setup_and_Use_Deck.html` by hand — open it, Print → Save as PDF, background
graphics ON — so it will not be picked up by the script and needs doing at the
same time.

**Nothing will catch this.** The staleness signal is the version in the PDF's
filename — the app says v1.4, a PDF saying v1.3 is visibly old, *"no process, no
discipline, no memory required"*. That works **across** versions. It does nothing
**within** one: `APP_VER` stays `1.4.0` while fixes fold into an unreleased
version, so the markdown can change any number of times and the filename never
moves. `tests.html` checks the PDF **exists for the current version**, not that
it matches its source, so it stays green throughout.

Worth being exact, because two documents overstate it: `05_Release Protocol` §4a
says *"a release cannot pass while the guides are stale"* and `Guides/README.txt`
says the same. **What is actually enforced is existence, not freshness.** Within
an unreleased version, freshness is on a person.

**It is one command, not manual printing.** `05_Release Protocol` §4a's
*"Generating them"* still says open the markdown and Print → Save as PDF; that
predates `tools/make_guides.py`, which reads `APP_VER` from `index.html` so the
filenames always match what `tests.html` looks for. `reportlab` is installed
(5.0.0), so:

```
python tools\make_guides.py
```

**Regenerate ALL four, not only `02`**, and check first whether the other three
sources also moved since their PDFs were built — this item was raised about one
document but the gap applies to every one of them.

**Done means:** at the v1.4.0 release and before `main`'s root is touched, the
four PDFs in `Guides/` are regenerated from their current markdown, `tests.html`
passes, and `05_Release Protocol` §4a's *"Generating them"* is corrected to name
the script rather than the browser. **Or** a recorded decision that the
existence check is enough and freshness stays a human step, with the two
overstatements above corrected so the documents stop claiming otherwise.

### OI-12 · How does a folder reach `held`? — **answered and built, awaiting a device**
**Status:** open — **decided and built 22 Aug 2026, not verified on a device** · **Tier:** minor — visible behaviour change
**Verify it as OI-16, step 5**, which has been rewritten: the old step could not
have shown what it was looking for
**Detail:** decision log **§4k** and **D60** · `index.html` `batonState()`,
`batonAvailable()`, `browseAllInspections()`, `importFromSharePoint()`

**The question is answered.** No app-driven sequence can empty `current/`, and
this is now counted rather than argued: the app contains **one** `move` call —
the handover's archive step — and **no** deletes, and that move is strictly
preceded by the upload into `current/`. So `current/` goes 1 → 2 → 1 and never
0; a failure between the two leaves **two** files, which is what D36 chose
deliberately. The one folder ever seen in `held` got there because a tester moved
the file out by hand in SharePoint. The reading in the handoff was right.

**And the unreachable button was the smaller half.** Because a file is present in
every state the app can produce, a record already taken onto somebody's device
read **WAITING** and was **offered to the next person** — from the browse list
and from the take-over list both. Two people holding one record is the fault the
whole baton protocol exists to prevent, and the comment above
`browseAllInspections()` had said so all along. The intent was recorded; the code
did not implement it.

**What was decided — D60, decision log §4k.** `current/` says what the live record
**is**; `BatonStatus` says who has **custody** of it. `batonState()` reads the
column, with the file corroborating rather than deciding. `held` now arises from
an ordinary takeover, so *Force the handover* is reachable in exactly the case
D59 describes, **and D39 does not have to be reopened**. Moving the file on
takeover, widening the gate, and documenting the hand-tidy route were all
considered and rejected, with reasons, in §4k.

**What was built.** `batonState()` reads `BatonStatus`; a new state `missing`
(**NO FILE IN CURRENT/**, red) for a column that says *waiting* with nothing
there to pick up — the disagreement is surfaced, not resolved silently;
`batonAvailable()` answers *"can this be picked up?"* once for both lists, so a
held record is no longer offered; *Force the handover* is offered from `held` and
from `missing`, and its dialog says which; the read-only viewer no longer
announces a held record as *"ready to be picked up"*. Tests 597 → 620.

**The cost, recorded rather than absorbed: this raises what OI-3 costs.** Column
writes are swallowed on failure by design, so a takeover whose column write
failed still reads `waiting`. That is not a regression — it is what every folder
did before — but the column now decides what the app **offers**, not only what
the library displays. See OI-3.

**Still not observed.** The app/library divergence this rests on has been argued
from the code and never seen. It is the same one tap it always was, and OI-16
step 5 now asks for it after a **takeover**, which is the only point at which the
two ever disagreed — the old step asked after a handover, where both correctly
read *Waiting*, and would have been recorded as refuting it.

**Done means:** a run on a real device that reaches `held` by the new route —
take a record over on a second device, and confirm that the app shows
**IN PROGRESS**, the library column shows *In progress*, **Take it over** is no
longer offered, and **Force the handover** is offered to an administrator and
still works. A desktop check cannot stand in for it. If any of that fails, the
item re-scopes rather than closing.

### OI-13 · iOS truncates the native dialogs, so instructions staff need are never seen
**Status:** open — **built 22 Aug 2026, awaiting the device** · **Tier:** minor — visible behaviour change
**Verify it as OI-16, steps 2 and 3** — the two screenshots are the evidence
**Detail:** `docs/HANDOFF-session-A-dialogs-and-audit.md` — the brief, with the
conversion order. `docs/HANDOFF-v1.4-polish.md` §6 raised the two-languages
problem and was never actioned; the truncation was seen on a device 22 Aug 2026

The handover confirmation is a native `alert()` (`index.html:3349`). On an iPhone
it renders the first line large, the body small, **and cuts the message off**. The
owner's screenshot ends mid-sentence at *"Tell the next person, with a link to the
folder. Delete your copy from"* — with no scroll and no way to read the rest.

**The truncated half is the operative half.** What is lost is *"…your copy from this
device once they confirm they have it."* — the one instruction that stops two
people holding the same record. This is not a cosmetic complaint about bold text;
it is guidance the app believes it has given and has not.

Around **30** `alert()` / `confirm()` calls remain alongside the custom box
(`pickFromList` / `showDialog`), so the app speaks two visual languages and the
native one cannot be trusted to show what it is given.

**Carry the warning with it:** *do not convert a dialog on the capture path
without a device test.* A custom modal that fails to close is worse than an ugly
native one that cannot.

**BUILT 22 Aug 2026 — not verified, so not closed.** All seven dialogs in the
brief's table were converted: the fork warning (both halves), the handover
confirmation, the filing gate, the handover failure, recovered work in progress,
asking for the baton, and delete-from-this-device. Every choice now carries its
consequence **on the button**, so nothing depends on a trailing line surviving —
which is the cure, where a shorter message would only have made truncation less
likely.

**The fix underneath is structural, and it is the part worth remembering.** The
custom box could have truncated too: the message went into `.pick-note` inside
`.pick-head`, and `.pick-list` was the only scrolling region in the box. A long
message there would have been clipped exactly the way iOS clips `alert()`, and it
would have looked fixed on every desktop. There is now one `.pick-scroll` holding
the message, the facts, the filter and the choices, with only the title and
footer fixed; `.pick-note` gained `white-space:pre-wrap`, without which every
blank line collapsed and the paragraphing the wording relies on vanished.

**The capture path was NOT touched** — saving files, removing a photo and sharing
files are still native, and the single-line dialogs were left alone deliberately.
**36** native calls remain, down from 40, and that number is not meant to reach
zero. `tests.html` 590/590 over HTTP, including one test that asserts the note
lives inside the scroll region rather than asserting the wording.

**Done means:** the messages staff actually meet — handover, take-over, fork
warning — display in full on an iPhone, verified on the device rather than in a
desktop browser, which does not truncate and will not show the fault. **What
remains is exactly that and nothing else:** refresh `/beta/`, and on the phone
capture (a) the fork warning showing its last choice, and (b) the handover
confirmation showing *"…once they confirm they have it"*. A desktop check is not
evidence and must not be offered as any.

### OI-14 · The audit trail is recorded but cannot be read in the app
**Status:** open — **built 22 Aug 2026, awaiting the device** · **Tier:** minor — new capability
**Verify it as OI-16, step 4**
**Detail:** `docs/HANDOFF-session-A-dialogs-and-audit.md` §3 · `index.html:2072`
`logAudit()`, `index.html:2095` the count, `index.html:2924` the export

Every meaningful action writes an audit entry — created, stage changed, marked
complete, handed over, and **handover forced by X, recovered from Y**. The record
carries the lot.

**Nothing displays them.** The status bar shows a count — *"7 logged changes"* —
and the entries themselves only ever appear inside the exported JSON, so reading
them means downloading a backup and opening the file.

It matters most for exactly the action that has just been proved. A forced
handover is taken over somebody's head; *"who took this, when, and where did they
recover it from"* is the first question anyone will ask, and the app's answer is
a number. The library column carries the headline — *recovered from* — but not the
when, nor the source folder, nor anything else in the trail.

**BUILT 22 Aug 2026 — not verified, so not closed.** The count in the status bar
is now a control (`button#sb-audit`) and opens the entries in the same box as
every other dialog. Newest first, because the question that brings anybody here
is *who has just taken this, and from where*. Rendered as a log rather than as
`{k, v}` lines — the action leads and when/who/stage sits under it — because a
timestamp in the existing 34% key column leaves the action a third of a phone's
width. Read-only by construction: nothing is tappable and the way out says
*Close*, not *Cancel*.

**Done means:** the entries are readable on the device without exporting
anything — or a recorded decision that the count plus the library column is
enough, and why. **What remains:** open a record on the phone and tap the count.

### OI-15 · The decision log reuses D34 and D35 for two decisions each
**Status:** open · **Tier:** documentation
**Detail:** `docs/DECISION-LOG.md` lines 130 and 133 (D34), 131 and 134 (D35)

| Number | Both meanings |
|---|---|
| **D34** | *filing-critical fields are checked at the handover* · **and** *the record travels through SharePoint, not the share sheet* |
| **D35** | *a test build lives at `/beta/` on the same site* · **and** *the record carries a baton pointer* |

**It has already propagated.** `CLAUDE.md` lines 49 and 50 use "D34–D38" and
"D34–D35" in adjacent sentences meaning **different sets**, and
`index.html:3378` cites "D35" meaning the baton pointer. The decision log is this
project's memory; a citation that resolves to two different decisions corrupts it
quietly, and every future handoff that cites a number inherits the ambiguity.

**Renumbering is not obviously safe** — the numbers are referenced from code
comments, `CLAUDE.md` and the changelog, so a renumber breaks live references
unless they all move together. Whoever takes this should decide between
disambiguating in place (D34a/D34b), renumbering the later pair with every
reference updated in the same commit, or dropping numbers in favour of titles.

**Done means:** any citation of D34 or D35 resolves to exactly one decision, and
every existing reference — `CLAUDE.md`, `index.html`, `CHANGELOG.txt`, the
handoffs — points where it means to.

### OI-9 · `dbAll()` can return `[]` from a store that is not empty
**Status:** open — **guarded, not cured** · **Tier:** unknown
**Detail:** decision log §4g

Measured on Chromium under load: `dbAll('bytes')` returned `[]` while `dbGet`
found every record and a fresh connection counted two by key. The point reads
were right and the bulk listing was wrong.

`sweepOrphanBytes()` is now guarded — it confirms every candidate with a point
`dbGet` before deleting — so the data-loss path is closed. **But every other
caller of `dbAll()` still trusts it**, and a listing that silently comes back
short is a bad thing to have anywhere. `renderHome()`, `pendingUploads()` and
`migrateMediaBytes()` all read it.

The browser-level cause is not established. It reproduces only under heavy load
and **disappears when instrumented** — adding one extra connection before the
read was enough to mask it. Chase it knowing that.

**Done means:** either the cause is identified and handled at the storage layer
so every caller benefits, or a considered decision is recorded that the sweep
guard is sufficient and the other callers can tolerate a short listing.

### OI-3 · `setFields()` failures are swallowed, by design, and nobody decided that
**Status:** open — **needs a decision, not a change** · **Tier:** patch if changed
**Detail:** `index.html:3802` (forced handover), `4114` (takeover), `3265` (handover)

All three `.catch(function(){})`. That is *right*: a column problem must never
block a handover, because the photograph is evidence and the columns are a
convenience. But the same silence is why OI-1's root cause survived a release
cycle undetected.

**This got more expensive on 22 August 2026.** OI-12 / D60 made `batonState()`
read `BatonStatus`, so the column now decides what the app **offers** — whether
*Take it over* appears, whether *Force the handover* appears — and not only what
the library displays. A takeover whose column write is swallowed still reads
`waiting`, which is exactly the fork D60 closed everywhere else. **It is not a
regression**: that is what every folder did before D60, and a folder with no
column at all still falls back to the file. But the argument for keeping the
silence is weaker than it was, because "the columns are a convenience" is no
longer the whole truth. Weigh that when this is decided.

**Done means:** a decision-log entry either way — a visible-but-non-blocking
signal, or a recorded decision to keep the silence and why. **Do not just change
it**; two handoffs have now asked for this to be decided rather than done.

### OI-5 · Does iOS preserve EXIF GPS through the Safari file picker?
**Status:** open · **Tier:** unknown until answered
**Run it as OI-16, step 6** — it needs the same device and nothing else
**Detail:** decision log §5

Decides whether the Google Photos Maps plan is achievable at all. Needs a real
device test and nothing else.

**Done means:** a photograph taken on an iPhone, selected through the app's file
input, inspected for GPS EXIF; result in the decision log.

### OI-6 · Should the app be publicly reachable?
**Status:** open · **Tier:** infrastructure, not code
**Detail:** decision log §5

Currently public on GitHub Pages. Cloudflare Access with a one-time PIN would make
it staff-only, free, and matches how people already think about it.

**Done means:** decided before wider rollout, recorded in the decision log.

### OI-7 · Google Photos as a secondary backup
**Status:** open, unscheduled · **Detail:** decision log §5

Server-side scheduled sync reading from SharePoint. No first-party Power Automate
connector exists, so it needs a custom connector or a script.

**Done means:** scoped, or explicitly declined and struck from here.

### OI-8 · Analytics across records
**Status:** open, unscheduled · **Detail:** decision log §5, Handover Protocol §11

Cross-job querying needs a structured database downstream. The apps produce the
data; they do not query it. A SharePoint List, one item per inspection, is the
agreed destination.

**Done means:** scoped, or explicitly declined and struck from here.

---

## 3. Standing state — not tasks, but true, and easy to forget

- **v1.4.0 is built and NOT released.** `main`'s root serves v1.3.0 and that is
  correct. Pushing to `main`'s root *is* the release. The beta at `/beta/` is
  refreshed freely and staff do not use it.
- **Nothing is tagged.** The last release tag belongs to v1.3.
- **`APP_VER` stays `1.4.0`** while it is unreleased; fixes fold into it.
  `CACHE_VERSION` still moves on every app-file change — currently
  `ds-inspect-v1.4.0-31`.

---

## 4. Closed — kept so they are not reopened

| ID | Item | Closed | By what |
|---|---|---|---|
| OI-C13 | "Force the handover" had never been seen to work — the test that had never been passed | 22 Aug 2026 | Run on the device. Library shows **Recovered** in purple and `BatonHolder` = *Jamie Stone, recovered from Jamie Stone*, and the record came back to the home screen. The script's own expectation, met |
| OI-C12 | The beta and the live app shared one database, so opening the beta broke the live app and removed the rollback | 22 Aug 2026 | The beta now uses `ds-inspections-beta`. **Confirmed closed on the device:** clearing the leftover `ds-inspections` through diagnostics §8c brought the live app back — its list and storage line returned. Decision log §4h |
| OI-C11 | The orphan-bytes assertion failed ~5 runs in 8 | 22 Aug 2026 | Not a harness race after all — `dbAll()` was returning `[]` from a non-empty store (OI-9). Checks lifted out of `later()` and sequenced after boot, with per-run keys. **20 consecutive runs 554/554**, 16 under load, 6 from a cleared store |
| OI-C10 | `sweepOrphanBytes()` returned `0` both when it failed and when it found nothing | 22 Aug 2026 | Returns `SWEEP_FAILED` (-1) on failure; the boot caller warns rather than reporting a count |
| OI-C1 | The app could not read the library columns back, so "Force the handover" could never be offered | 22 Aug 2026 | `$expand=listItem($expand=fields)`. Proved on device before changing: 0 of 3 folders under the old form, 3 of 3 under the documented one. `f19fec2` |
| OI-C2 | ~140 MB held on a device with no inspections | 22 Aug 2026 | Not the app's data. WebKit keeps IndexedDB in a file that does not shrink when records are deleted; deleting the database removes it. Decision log §4f |
| OI-C3 | The footer reported the whole origin's storage as "used by this app" | 22 Aug 2026 | Reports what the app holds; `pressure()` keeps the origin figure deliberately. Decision log §4d. `070b179` |
| OI-C4 | `openDB()` never yielded the database, so any delete or upgrade hung silently | 22 Aug 2026 | `onversionchange` closes and drops the handle. Would have deadlocked the next schema change. Decision log §4e. `e0f083f` |
| OI-C5 | Julie and Mike's permission question — does *Contribute - No Delete* permit the archive move? | 21 Aug 2026 | Yes. Proved on device, `archive/` held 11 files |
| OI-C6 | The mobile upload stranding | 18 Aug 2026 | Most probably B5, fixed in Batch 0. **Do not reopen without new evidence** — see `CLAUDE.md` |
| OI-C7 | A second stranding: `tx()` handled `onerror` but not `onabort` | 18 Aug 2026 | D43, D44. Storage calls bounded, every transaction ending handled |
| OI-C8 | Admin consent for the Entra app | 17 Aug 2026 | Granted tenant-wide. Each sibling app needs its own |
| OI-C9 | Who holds Global Administrator | 17 Aug 2026 | Held internally |

---

## 5. Where the detail lives

The handoffs are history, not instructions, once their items are closed. Live
ones first:

| Document | Status |
|---|---|
| `docs/HANDOFF-session-B-the-held-state.md` | **Live** — OI-12. Answered and built 22 Aug 2026; the device verification it asks for is OI-16 step 5. **Its §3 procedure is wrong** — see the correction at the head of that section |
| `docs/HANDOFF-session-A-dialogs-and-audit.md` | **Live** — OI-13, OI-14. Built 22 Aug 2026; the device verification it asks for is OI-16 |
| `docs/HANDOFF-22-august-baton-and-storage.md` | **Live** — OI-1, OI-2, OI-3 |
| `docs/HANDOFF-orphan-bytes-race.md` | **Live** — OI-2, and OI-4 in its §6 |
| `docs/HANDOFF-baton-columns-not-read-and-storage.md` | Superseded — history only |
| `docs/HANDOFF-v1.4-polish.md` | Superseded — history only |
| `docs/HANDOFF-batch-B-guides.md`, `-C-context-and-training.md`, `-D-guides-and-pdfs.md` | Superseded — history only |
| `docs/HANDOFF-folder-restructure.md` | Done, 18 Aug 2026 |
| `docs/DECISION-LOG.md` | **Always live** — why things are as they are |
| `docs/v1.4-plan.md` | **Live** — the build's own plan |
