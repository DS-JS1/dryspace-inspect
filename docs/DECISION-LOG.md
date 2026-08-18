# Decision Log

Why the app is the way it is. Read before proposing anything architectural.

**The point of this document:** most questions that look open have already been
settled, often after real debugging. Reopening one without new information wastes
a session, and worse, risks reintroducing a bug that a decision was made to fix.

**Three sections matter most.** §3 records decisions that were *reversed* —
reverting to any of those reintroduces a known problem. §4 records work that is
settled but waiting on a trigger, so it surfaces when it should rather than being
rediscovered. §5 records what is genuinely still open.

Append; do not rewrite. If a decision changes, mark the old one superseded and
add a new entry saying what changed and why.

---

## 1. Version history

| Version | Date | What it did | Deployed |
|---|---|---|---|
| **1.0.0** | 20 Jul 2026 | First release, built from the paper Site Inspection Form v4. Offline PWA, autosave, photo compression, HTML report with embedded photos. | Yes |
| **1.1.0** | 20 Jul 2026 | Office pre-fill and handover between devices — draft export/import, reports re-importable, logo embedded, drafts carry photos. | Yes |
| **1.1.1** | 20 Jul 2026 | Version footer fix. | **Yes — this is what staff still run** |
| **1.2.0** | 2 Aug 2026 | Permanent field ids (`data-fid`) replacing label-keyed storage; schema 1→2 migration; stage tracking and audit trail; Section 03A Safety, Access & Discharge; measurement schedule. | **No** |
| **1.2.1** | 2 Aug 2026 | Completion indicators, "None apply" options, BS8102:2022 grades with `VALUE_REMAP`; schema 2→3. | **No** |
| **1.3.0** | 17 Aug 2026 | Photos upload to SharePoint with verification; Microsoft sign-in; update detection; automated test suite; media keyed by `data-mfid`; unified inspection folder; library-column indexing. | **Yes — live, verified served** |

### Why 1.2.0 and 1.2.1 were never deployed

Both were completed in the working folder and never pushed. The photo-persistence
problem made the app unusable in practice, so work moved straight on to v1.3
rather than shipping an intermediate version that still had the blocking fault.

**Consequence to remember:** every device still on **1.1.1** migrates schema
1→2→3→4 in a single pass the first time it opens v1.3, in the field. That
migration is covered by the test suite against the real v1.1.1 build.

Those devices have no update banner — it cannot be added to a build already
deployed — so each needs the app **fully closed and reopened once**. From v1.3
onward every release announces itself.

---

### Verified against the live tenant — 17 August 2026

The full chain ran end to end for the first time: sign-in, token to Graph, nested
folder creation, folder and filename generation, chunked upload, **independent
read-back verification**, and the library columns.

```
Site Inspections ▸ Documents ▸
    INS-2026-9999 - Client Name Test - 99 Test St, Testville#1/
```
| InspectionNo | Client | Address | Stage | InspectionDate |
|---|---|---|---|---|
| INS-2026-9999 | Client Name Test | 99 Test St, Testville#1 | S01-OFFICE | 2026-08-17 |

The app reported *"All photos uploaded"*, which is only shown after each file has
been read back out of SharePoint and its stored size confirmed — so the
verification path ran, not merely the upload.

Everything below had until this point been proven only against a fake Graph.

---

### Field testing found upload broken on mobile — 18 August 2026

v1.3.0 works on desktop and does not work on iPhone or iPad. Four confirmed
faults, recorded here so they survive the session that found them:

- **B5** — `pendingUploads()` excludes the `uploading` state and nothing resets
  interrupted uploads at start-up, so a record caught mid-upload is stranded
  permanently and invisible to both the queue and the button. **Diagnosed by
  reading the code, not yet fixed.**
- **B6** — the queue has no request timeout and no per-file status, so a hang
  shows as *"Uploading…"* forever with nothing to read.
- **B7** — everything except photos (report, draft, media share, print) uses the
  OS share sheet rather than SharePoint. On mobile that offers WhatsApp.
- **B8** — Import Draft reads the device, not SharePoint, so the baton can be put
  down but not picked up.

**Strongest hypothesis for the hang:** the chunked upload path above 4 MB has
never run against real Graph — every successful test used a file under 200 KB.
Real phone photos are 2–5 MB.

Full detail and batching in `docs/v1.4-plan.md`.

---

## 2. Standing decisions

Current and in force.

| # | Decision | Why | Since |
|---|---|---|---|
| D1 | Storage is **SharePoint**, not Google Drive | The handover baton files already live there. Splitting one job across two clouds is the fragmentation the baton rule exists to prevent. Re-examined in Aug 2026 once media was isolated, and confirmed. | v1.3 |
| D2 | **Per-user sign-in, no backend** (OAuth2 PKCE) | No secret to hold, so no server to build or secure. The app stays static. Uploads are attributed to a real person. | v1.3 |
| D3 | **Three renditions** per photo — 240px thumb, 1600px report copy, untouched original | Each has a distinct job. The report copy keeps emailed reports deliverable; the original is warranty and dispute evidence. | v1.3 |
| D4 | A local original is **purged only after verified upload**, never automatically | An upload can report success on a truncated write. Only an independent read-back proves what is stored. | v1.3 |
| D5 | **Deferred upload queue**, never upload-on-tap | There is no signal at capture time. A synchronous upload fails in every basement. | v1.3 |
| D6 | Photos are taken in the **native Camera app**, then imported | The camera roll is an independent backup, and EXIF location survives. Browser capture gives neither. | v1.3 |
| D7 | The address label comes from **the form**, never GPS reverse-geocoding | GPS is routinely wrong by hundreds of metres, which matters when working on adjacent properties. | v1.3 |
| D8 | Inspection media lives in its **own SharePoint site** | Client folders hold quotes and pricing. Delegated permissions mean uploading there would give field staff access to all of it. | v1.3 |
| D9 | Media **never moves between libraries** | Graph item ids survive moves and renames *within* a library, but a cross-library move is a copy-and-delete and every stored link breaks. Filing elsewhere is done with a shortcut. | v1.3 |
| D10 | The folder is **derived from the record**, with no picker and no manual step | Inspections happen ad hoc with no SharePoint access. Requiring a lookup would delay or block uploads. | v1.3 |
| D11 | **One folder per inspection**, holding `current/`, `archive/` and `photos/` | One place for everything about a job. Photos in their own subfolder so they cannot drown the two folders a person looks for at handover. | v1.3 |
| D12 | Inspection numbers are written **`INS-2026-0142`** | Year-based, sorts chronologically. Chosen over the short form the app previously prompted for. | v1.3 |
| D13 | **Hand-written auth**, not MSAL | ~150 lines against ~200KB, in an app whose defining property is being self-contained. One tenant, one scope, one account per device — none of the cases MSAL exists for. | v1.3 |
| D14 | Service worker is **cache-first** | Instant launch matters more than instant updates when the alternative is a hang in marginal signal. Updates are handled by explicit detection instead. | v1.3 |
| D15 | Updates are **announced, not silent** | The worker waits rather than self-activating, and the app shows a banner. Silent updates are how v1.1.1 stayed live unnoticed. | v1.3 |
| D16 | **Capture is never blocked** by storage pressure | Running out of space is recoverable; an un-photographed defect is not. | v1.3 |
| D17 | Outputs are **PDF only** | Removes the docx/pdf drift where updating one left two versions of the truth. | v1.3 |
| D18 | **One folder per minor version**, not per patch | Git holds every version and tags each release. Folder-per-patch creates snapshots nobody reads. | v1.3 |
| D19 | Git internals live **outside the OneDrive sync root** | This folder is inside a synced SharePoint library, and syncing `.git` corrupts it. | v1.3 |
| D20 | Permanent **`data-fid`** on every control | Storing against label text meant every rewording silently orphaned data. This is the single most valuable rule in the codebase. | v1.2 |
| D21 | Permanent **`data-mfid`** on every file input | Media was the one place D20 had been skipped; renaming a file input's id orphaned every photo attached to it. | v1.3 |
| D22 | Tests run the **real functions** through an iframe, never a copy | A copied function drifts, and a test that passes against a stale copy is worse than no test. | v1.3 |
| D23 | The index is **library columns set at upload**, not a generated document | A generated register needs a trigger, and a trigger fails quietly — you find out weeks later with folders missing. Columns cannot drift, because they *are* the folder's metadata rather than a description of it. | v1.3 |
| D24 | Writing the index **never blocks an upload** | The columns are a convenience; the photograph is evidence. If they are missing or refused, the upload carries on. | v1.3 |
| D25 | Filenames carry a **pinned client token** — `INS-2026-0142_Smith_2026-08-15_...` | A file separated from its folder (downloaded, emailed, dropped in Teams) was otherwise anonymous until someone looked the number up. The client name is used because it is a real field; a suburb would have to be parsed out of a free-text address, and "Unit 3/12 Marine Pde Kirra QLD 4225" has no reliable separator. Pinned on first use so a later correction does not rename earlier photos. Capped at 24 characters. | v1.3 |
| D26 | **Guides are generated PDFs, versioned in the filename**; the markdown source is not versioned | The markdown lives in git, which already knows every version — renaming it each release churns history and breaks links. The PDF is a detached thing someone may hold weeks later with no way to tell it is current. Version in the name makes staleness visible to anyone: the app says v1.4, the PDF says v1.3. `tests.html` checks each exists for the current version, so a release cannot pass with stale guides. | v1.3 |
| D27 | Numbered documents at root are **procedures a person follows**; `docs/` supports the build | Gives a clear rule for where a new document goes. The Release Protocol moved from `docs/` to `05_Release Protocol.md` under it. | v1.3 |
| D28 | Interrupted uploads are recovered at **start-up**, not by widening the state machine | `uploading -> queued` must stay illegal for the queue, where it would mean two attempts running against one file. Recovery is a different thing from a transition: it happens once, before the queue exists, and nothing can be in flight to conflict with it. `DSMedia.recoverInterrupted()` bypasses the table and names itself, so the exception is visible rather than hidden inside a widened rule. | v1.3.1 |
| D29 | Every Graph request carries an **abort deadline**, and a timeout is **retryable** | A request with no deadline cannot fail, only hang — which is how "Uploading…" came to mean nothing. Classified as temporary because a stalled connection almost always is; treating it as permanent would hold back a good photo over a bad moment of signal. | v1.3.1 |
| D30 | Upload status is shown **per file**, with the reason | One aggregate line cannot distinguish a slow upload from a stopped one. The field report was not "it failed" but "I cannot tell what it is doing", which is a reporting fault, not an upload fault. | v1.3.1 |
| D31 | A resumable session must **prove forward progress**, not merely get answers | Graph answers an uncommitted chunk with a 202 pointing back at bytes already sent. Obeying that for ever is a livelock in which every request succeeds, every deadline is met, and the file never finishes — the one hang shape a per-request timeout cannot catch. Three non-advancing answers ends the attempt; retrying is allowed because a fresh session is the actual remedy. | v1.3.2 |
| D32 | A **timed-out** token is temporary; only a **rejected** one signs the device out | The two are opposite failures wearing the same coat. A server that never answered says nothing about whether the refresh token is good, and discarding it would force a re-authentication in the field over a moment of bad signal — exactly where it is hardest to do. | v1.3.2 |
| D34 | Filing-critical fields are checked **at the handover**, not at the field | Five fields decide how a record files rather than what it says. A blank field mid-inspection is legitimate — somebody is in a basement and has not got to it — and a permanent warning trains people to stop seeing warnings. The handover is the honest moment: the stage is changing, the person is at a desk, and it is the last point before the record becomes somebody else's. It asks once and never blocks, which is D16 one level up. | v1.4 |
| D35 | A test build lives at **`/beta/` on the same site**, not on the live address | `diagnostics.html` has to share an origin with the app — it frames it, reads the same stored sign-in and opens the same IndexedDB — so it cannot be run from SharePoint or a file. Putting the test build in a subfolder gives it a real origin without making the live app the test bed. It needs its own Entra redirect URI, since those are matched as exact strings. | v1.4 |
| D33 | The stored file is **read before it is sent** | Safari can hand back a blob that stored fine and reads back broken. A stall in a *request* body is invisible to a deadline watching for a *response*, so the cheapest possible read — 64 KB — buys the difference between a named failure and a permanent hang. Unreadable is permanent, because retrying cannot restore a lost blob; only retaking the photo can. | v1.3.2 |
| D34 | The record travels **through SharePoint**, not the share sheet | The share sheet has no sensible target on a phone, so the baton could not be passed at all on the devices that do the inspecting. The transport, auth, folder structure and naming already existed for photos; this is the same road carrying the record. The share sheet survives as a labelled offline fallback, which is the one case it was always right for. | v1.4 |
| D35 | The record carries a **baton pointer** — the identity and eTag of the `current/` file this device last agreed with | It is the only way to tell "nobody has touched this since I picked it up" from "somebody else has handed over while I was working". Without it, automatic writes to `current/` would silently overwrite whoever got there first, which is worse than the manual process it replaces. Schema 3 → 4. | v1.4 |
| D36 | Upload the new file to `current/` **before** archiving the old one | Both failure modes are wrong, so the question is which one a person can recover from. An empty `current/` has no procedure in the protocol and reads as lost data to whoever opens the folder. Two files in `current/` is covered explicitly by §8, and the filenames carry timestamps so the newer is obvious. Fail into the error the protocol already knows how to handle. | v1.4 |
| D37 | Two files in `current/` is **refused**, not resolved | Which of two files is the baton is a judgement about whose work matters, made without knowing what either contains. Software guessing that is how the wrong version gets quoted. It stops and points at §8. | v1.4 |
| D39 | Automatic backup writes to **`wip/`**, never to `current/` | Settled by mechanism, not principle. Every backup changes the file's eTag, and the eTag in `current/` is what the handover uses to detect a second device (D35) — so backing up there would fire that warning on the owner's own saves, constantly, until it was ignored. It also keeps the protocol's promise that `current/` changes only at a deliberate handover. `wip/` is a working copy and is never the baton. | v1.4 |
| D40 | One backup file **per device**, not per person | A person may carry two devices, and two devices on one inspection must not overwrite each other's backup. Per-device naming answers that without locking, queueing, or any coordination at all. | v1.4 |
| D41 | The backup is **silent in every failure case** | It runs behind somebody standing on a roof. A dialog about a failed backup is an interruption they cannot act on, and a warning nobody can act on is one they learn to dismiss — including the next one, which might matter. It simply tries again. | v1.4 |
| D42 | Recovering a working copy **clears the baton pointer** | The device has not agreed with anything in `current/`, and saying otherwise would suppress the very warning that stops a recovered copy quietly diverging from the live record. | v1.4 |
| D38 | The app **never deletes the device copy** at handover | Step 5 of the ritual stays human. Deleting somebody's only copy of a day's work on their behalf is not a thing this app does — and the whole reason the baton rule exists is that the cost of a lost record is measured in site visits. | v1.4 |

---

### Batch 0 of v1.4 shipped as v1.3.1 — 18 August 2026

B5 and B6 fixed and released on their own, ahead of the architecture work, as
`docs/v1.4-plan.md` §7 directed. B5 was a live data-visibility bug: a photo caught
mid-upload became invisible to the queue *and* to the button that would have
retried it, so it never uploaded and nothing said so.

**A deliberate departure from `05_Release Protocol.md` §1, recorded so it is not
mistaken for an oversight.** B6's per-file status panel is a visible behaviour
change, which §1 classes as **minor** and would require a new `v1.4` folder and a
review of the whole training pack. It shipped as a **patch** in the `v1.3` folder
instead, on the owner's decision: the build is development-only — nobody but the
developer is running it — and Batches 2–4 will take the app to v1.4 shortly, at
which point the training pack is reviewed as a set, which is the only way it is
ever meant to be reviewed. Doing it twice would produce two staff-facing updates
a fortnight apart describing the same work.

**The condition attached:** v1.3.1 must not reach a field device before that v1.4
review happens. If it does, the training pack review is owed immediately, because
staff would then be looking at a screen the training material does not describe.

---

### Batch 1 — three hang paths closed, none confirmed as *the* fault — 18 August 2026

Batch 1 was specified as "reproduce the mobile hang with diagnostics; fix the
cause". **The reproduction did not happen** — it needs the iPhone or iPad that
fails, with a real photo. What was done instead:

**The four hypotheses in `docs/v1.4-plan.md` §3 were hunted by reading**, which is
how B5 was found and is the established method here. Three independent ways for
an upload to hang for ever were found and closed (D31–D33), and hypothesis 4 was
ruled out without a device — `crypto.subtle` is already guarded, so a non-secure
context cannot hang capture.

**Be precise about what this does and does not establish.** Each of the three is
a genuine defect that could produce the reported symptom. None is confirmed as
the cause. It is entirely possible the mobile fault is a fourth thing, and it is
equally possible the livelock (D31) was it — that one matches the field report
most closely, and it is exactly the failure the plan predicted for a path proven
only against a fake transport that always advances.

**A hole in the v1.3.1 fix, worth recording as a lesson.** The request deadline
added for B6 did not cover `getToken()`, which is awaited *before* the request
and therefore outside it. A hung sign-in server still hung the upload with
nothing sent. Adding a timeout to the visible call is not the same as bounding
the operation, and the gap sat in the least visible place — before anything had
started.

**`diagnostics.html` is the actual answer to Batch 1.** It runs on the failing
device and reports which hypothesis is true, including a real chunked upload of a
photo chosen from the camera roll, with a timed trace of every Graph request.
Until someone runs it, the root cause is unproven and should be described that
way.

---

### Batch 2 — the architectural change — 18 August 2026

B7 and B8 are done. The record moves through SharePoint; the baton can be put
down *and* picked up. D34–D38 record the decisions taken.

**This is a major change by §1 of the Release Protocol** — the record schema moved
3 → 4 and the record has a new storage target. The migration is written and
tested, including against a real v1.1.1 build, which now migrates 1→2→3→4 in one
pass.

**The version number and folder are deliberately not yet decided.** `APP_VER` is
still `1.3.2`. The plan, this log and every document call this work "v1.4", while
§1 says a schema change is major and therefore 2.0. Minting the wrong number is
cheap to avoid now and awkward to undo later, so it is being asked rather than
guessed — and the folder restructure it implies (new folder, previous to
`Superseded`) is not something to do on an assumption.

**What is still outstanding for the release**, whichever number it gets:

- The version bump itself, `CACHE_VERSION`, the field id manifest and the guides
- `01_Setup and User Guide` — the buttons and both fallback paths
- `04_Project Context Brief` — version and feature list
- `Training/` — cards, chart and module, reviewed as a set
- `02_Iteration Guide` and `docs/FIELD-APP-TEMPLATE.md` — the transport now has
  list/download/move, which sibling apps inherit
- The new folder, and this one to `Superseded`

`03_Handover and Version Control Protocol.md` §4 **has** been rewritten, because
the change made it factually wrong — it described a manual ritual the app now
performs. That is precisely the failure the Release Protocol exists to prevent,
so it was not left for the batch that tidies documentation.

---

### Batch 3, and a bug the batch uncovered — 18 August 2026

Automatic backup is done (D39–D42). The `wip/` question the plan flagged as
genuinely open turned out to have a mechanical answer rather than a
philosophical one, which is recorded in D39.

**A bug worth remembering.** `saveNow()` pinned `cur.schema` to a literal `3`.
Nothing was wrong with that until the schema moved to 4 — at which point every
record would migrate correctly on load and then be written straight back as 3,
for ever, silently undoing the migration on every save. The tests did not catch
it because they exercised `ensureSchema()` directly and never asked what a save
did afterwards.

**The general lesson:** a constant that duplicates a number owned somewhere else
is a bug waiting for that number to change. It was found by accident while wiring
the backup, not by looking. Worth a grep for other pinned literals before the
next schema move.

### Version 1.4.0 rather than 2.0.0

Batch 2 made this a **major** change by §1 — schema 3 → 4, and a new storage
target for the record. It is numbered **1.4.0** on the owner's decision.

The full major-tier document set is still owed either way; the number was the
only thing in question. The reasoning for 1.4.0: 2.0 communicates "everything you
know is different", and that is not true — the form, the field ids, the photos
and the workflow are unchanged. What changed is that the baton now travels a road
that already existed. Renaming to 2.0 would also have made the entire planning
record read as being about a version that never shipped.

---

### The template caught up with the architecture — 18 August 2026

`docs/FIELD-APP-TEMPLATE.md` now describes v1.4 rather than v1.3. Recorded here
because of what it is: **the specification for four unbuilt apps**, and the one
document in this folder that is not about this app.

Three things reached it that siblings would otherwise rediscover the hard way:

- **The transport is a storage interface, not a photo uploader.** v1.3 shipped
  `upload` and `verify` because photos were the only thing going to SharePoint.
  Anything that moves the *record* needs `list`, `download` and `move` too — and
  designing that in from the start costs nothing, while retrofitting it is what
  Batch 2 was.
- **The four hang shapes**, each needing its own guard. Particularly the one that
  is a trap rather than an oversight: a deadline on the call you can see is not a
  deadline on the operation, because the token fetch runs before it.
- **The baton pointer**, and why conflict detection uses one rather than
  comparing timestamps.

**The move to `_Shared` is now the pressing item.** The note at the top of the
template has said "not yet, deliberately" since v1.3. That reasoning has expired:
the trigger it named was the second app, but the v1.3 → `Superseded` restructure
arrives first, and it would leave this document inside an archived folder. Do the
move as part of that restructure, not after it. See §4.

---

### Tenant inspected against the code — 18 August 2026

The Site Inspections library was read directly and compared with what the code
writes. **This is the first tenant-side evidence of the mobile fault**, and it
narrows it considerably.

**What is in the library:**

| Folder | Created | `photos/` | Columns |
|---|---|---|---|
| `Tom Kelly - 57 Newmarket Rd, Windsor QLD` | 17 Aug, 1:56 pm | exists, **empty** | Client, Address, InspectionDate only |
| `999-Test Inspect - Client Test Name - 999 Test address, Test Town` | 17 Aug, 2:10 pm | exists, **empty** | all six |

**Both `photos/` folders are empty, and the photos were never there.** The site
recycle bin holds three whole folders and **no loose image files**, so nothing
was uploaded and later removed. Nothing has been purged from the first stage
either — entries from 14 August are still in it.

**What that proves, precisely.** `upload()` runs in a fixed order:

```
ensureFolder(folder)  →  tagFolder(columns)  →  drive()  →  session/simple upload
```

The folder exists and the columns are written. **So the first three steps
succeeded on the failing device and the fourth did not.** Sign-in, token
acquisition, drive resolution, nested folder creation and the column write all
work on mobile. The failure is inside the file transfer itself.

**This is the strongest evidence yet for hypothesis 1.** A real phone photo is
2–5 MB, and `blob.size > SIMPLE_MAX` (4 MB) selects `sessionUpload` — the
chunked path that had never run against real Graph. It also makes hypothesis 3
unlikely: a token good enough to create folders and write columns seconds
earlier was not the thing that failed.

> **It does not close Batch 1.** This says *where* the failure is, not *which*
> defect caused it. The livelock (D31) and the unreadable-blob path (D33) both
> live inside that fourth step. `diagnostics.html` still has to be run on the
> device to tell them apart.

**The successful desktop verification is gone.** `INS-2026-9999 - Client Name
Test - 99 Test St, Testville#1` was deleted on 17 Aug at 4:17 am and is in the
recycle bin — so the SharePoint half of the "delete the test inspection" item in
the v1.4 plan §5 is already done. Note the timeline it implies: the desktop
success was in the morning, and both failures came that afternoon.

**Also found — an inspection with no number.** `Tom Kelly - 57 Newmarket Rd,
Windsor QLD` has no `InspectionNo`, no `Stage` and no `LastEditor`. The code
behaved correctly — `folderName()` omits empty parts and `spFields()` deletes
blank values rather than writing empty strings — but the result defeats two
standing decisions:

- **D12** numbers inspections `INS-2026-0142` because it "sorts chronologically".
  An unnumbered folder sorts under the client name instead.
- **D25** pins a client token into filenames so a file separated from its folder
  still says whose job it is. With no number, `fileName()` falls back to the
  literal `INS`, so photos would be named `INS_Tom Kelly_2026-07-23_...` — the
  client survives, the job identity does not.

**Nothing is broken by this**, and it is not the upload fault. But the protocol
assumes a number exists and the app does not require one. Worth deciding whether
an inspection number should be required before the first upload, rather than
discovering it in a library that has grown.

**Not yet observable.** No `current/`, `archive/` or `wip/` folders exist, which
is correct — v1.4 has never run against the tenant. What the check does confirm
is that the folder naming, the `photos/` subfolder and all six columns behave as
the code says, and v1.4 reuses every one of those unchanged.

---

### The library columns had one write path, and it was the wrong one — 18 Aug 2026

**Found by a question rather than a bug report:** *do the columns fill in
retrospectively as a record moves through its stages?* They did not.

`tagFolder()` had exactly one call site — inside a **photo upload**. So:

- an inspection whose stage, number or inspector was completed *after* its last
  photo kept stale columns for ever;
- an inspection with **no photos at all was never indexed**;
- the v1.4 handover, which is the moment the stage and the editor change, wrote
  nothing.

D23 chose library columns over a generated register because *"columns cannot
drift, because they **are** the folder's metadata rather than a description of
it."* That reasoning only holds while something keeps writing them. Tied to photo
uploads alone, they drift exactly like the register D23 rejected — and silently,
because D24 (correctly) makes a failed column write non-blocking.

**Fixed:** the handover now refreshes the columns too, via a newly exposed
`transport.setFields`. Failure is still swallowed, for D24's reason.

**The general lesson, worth carrying to sibling apps:** an index maintained as a
side effect of one operation is only as current as that operation is frequent.
Ask *what else changes this data, and does that path write too?*

### diagnostics.html hung on the thing it was built to find — 18 Aug 2026

Opened from SharePoint rather than the app's own origin, the page sat on
*"Loading the app…"* indefinitely. The iframe fired neither `load` nor `error`,
and **there was no deadline on the boot** — the precise failure shape §8 of the
field-app template now warns about, in the page written to diagnose it.

Fixed with a 15-second boot deadline, an immediate `file://` check, a guarded
cross-origin property read, and messages that name the likely cause and print the
address the page is actually running at.

**Why it can only run from the app's origin**, recorded because it is not
obvious: it loads the app in a frame by relative path, reads the sign-in from the
same `localStorage`, and opens the same IndexedDB. All three are origin-scoped.
Served from SharePoint, none of them resolve.

---

### Batch 1 closed on device evidence — 18 August 2026

`diagnostics.html` was run on the failing iPhone (iOS 18.7, Safari 26.6.1)
against the live tenant. **All four hypotheses are now answered.**

| Hypothesis | Verdict |
|---|---|
| **1** — chunked upload path never proven | **Ruled out.** 41.3 MB video, 9 chunks, all committed, read back at 43,308,985 bytes exactly |
| **2** — blobs unreadable from IndexedDB | Not reachable; see below |
| **3** — token refresh in a PWA | **Passed** in Safari: `POST 200 /oauth2/v2.0/token` in 289 ms, then two Graph calls on the new token |
| **4** — `crypto.subtle` at capture | **Ruled out.** Present and a secure context |

**The chunked path is not merely working, it is healthy.** Chunk times were
5937, 6247, 6042, 5737, 5839, 6040, 5938 ms — flat, monotonic, no retry, no
stall. About 0.8 MB/s sustained, finishing in 53 s against a 15-minute budget.
The path the plan called "only proven against a fake transport" is now proven
against real Graph, from the device that was failing.

**Storage pressure is also ruled out:** 0.6 MB used of 39 GB.

**Why hypothesis 2 could not be reached, and why that is acceptable.** iOS gives
a home-screen web app a *separate* storage container from Safari. Diagnostics ran
in a Safari tab, so it saw an empty database — which says nothing about the
installed app's stored photos, and is not evidence of eviction. Reaching the real
container would need diagnostics running inside the installed app, and there is
no route from an installed v1.3.0 build to `/beta/`. Left deliberately: from v1.4
the pre-flight read (D33) turns an unreadable blob into a named failure in normal
use, so this hypothesis reports itself in the field rather than needing a harness.

**Incidental confirmation:** the device reported *"Storage is persistent: no"*.
The app does request durable storage at start-up; iOS refuses it for an ordinary
Safari tab. That is exactly the warning already in `01_Setup and User Guide`
Part C — *always use the installed icon, not a browser tab* — now confirmed
empirically rather than asserted.

### So what actually broke v1.3.0 on mobile?

**Most probably B5, and this is inference rather than proof.** The evidence
converges:

- The tenant showed inspection folders created **with their library columns
  written** and **no photo**. `upload()` runs
  `ensureFolder → tagFolder → drive → transfer`, and the first three complete in
  under a second while the transfer takes seconds to a minute.
- The chunked transfer itself is now demonstrably sound on that device.
- B5 stranded any record interrupted mid-`uploading` — permanently, invisibly,
  and with the *Upload now* button gone, because `pendingUploads()` did not count
  `uploading`.

Background the app during that transfer window — which is what happens when
somebody locks the phone or takes a call — and you get precisely the reported
symptom: folder present, columns written, photo absent, button gone, nothing
said. B6 then guaranteed there was nothing on screen to read.

**Not proven, and not worth proving.** Confirming it would mean reinstalling
v1.3.0 on a field device and deliberately reproducing a data-visibility bug that
is already fixed. Both faults are closed with tests (Batch 0), the recovery path
runs at every start-up, and per-file status now shows what the queue is doing.

**Recorded so nobody re-opens it:** if photo upload fails on mobile again after
v1.4 ships, this investigation does not apply. Start fresh from
`diagnostics.html`, which now answers all four questions in about a minute.

---

## 3. Reversed decisions — do not revert to these

Each of these was once true. Reverting reintroduces a known problem.

| Was | Now | Why it changed |
|---|---|---|
| Field **labels are the data keys** | Permanent `data-fid` (D20) | Renaming a label silently orphaned that field's saved data. The single biggest fragility in v1.1.1. |
| Media keyed by the file input's **DOM id** | Permanent `data-mfid` (D21) | Same fault, in the one place v1.2 missed. |
| The folder name must match **`APP_VER` exactly** | Matches the **minor** version (D18) | Forced a folder rename and full copy for every patch. Predates the repository. |
| Use **MSAL** for sign-in | Hand-written PKCE (D13) | Reversed during implementation: 200KB of third-party code for one flow, in a deliberately zero-dependency app. |
| Photos live in **`media/`** under the job folder | Unified inspection folder in Site Inspections (D11) | The old structure sat where quotes and pricing live, and would have required giving field staff access to both. |
| Service worker calls **`skipWaiting()`** on install | Waits to be applied (D15) | Swapped code underneath a running page, and made announcing an update impossible. |
| **Renditions** were scheduled before the upload path | Shipped together (v1.3) | Storing originals with nowhere to send them would have filled iPad storage and made pressure worse, not better. |
| A separate **A3 handover flowchart** alongside the workflow chart | One chart (Training v2.0) | Two documents describing one process is how they come to contradict each other — the old pack's own README warned of it. |

### Also corrected along the way

- **`Files.ReadWrite.All` delegated does not require admin consent by default.**
  It was asserted here that it did. Microsoft's default for the *delegated* variant
  is "no"; the *application* variant requires it. What actually forces admin
  approval in this tenant is the user-consent policy for apps without a verified
  publisher. Worth knowing if consent behaviour ever looks inconsistent.

---

> **Found by the guide-freshness check on its first run:** `APP_VER` was still
> `1.2.1` while every document said v1.3. Bumped to `1.3.0` along with
> `CACHE_VERSION` and the field id manifest. Worth noting because it is exactly
> the drift the check exists to catch, and it had gone unnoticed through an
> entire development cycle.

---

## 4. Deferred — decided, waiting on a trigger

Not open questions. These are settled; they are simply not worth doing yet. Each
records the event that should start it, so it surfaces at the right moment rather
than being rediscovered.

### Move the shared documents up a level

**Trigger: starting the second app** (progress inspections, completion reports,
competency assessments, or equipment damage) — **superseded 18 Aug 2026: do it
with the v1.3 → `Superseded` restructure instead, which now comes first.** The
original trigger assumed the second app would arrive before this folder was
archived. It will not.

`docs/FIELD-APP-TEMPLATE.md` and `04_Project Context Brief.md` describe how
Dryspace builds **any** field app, and the business and trade behind them. Neither
is about the Site Inspection App, yet both live inside its folder.

**The risk is concrete:** when v1.4 ships and v1.3 goes to Superseded, the
specification for four unbuilt apps goes with it.

**Intended shape:**

```
00_AI Tools in Development/
    _Shared/                            ← applies to every app; its own repository
        Field App Architecture Template.md
        Dryspace Context Brief.md
    01_Contact to Contract/
        Dryspace Inspection App v1.3/   ← this app only
```

Above `01_Contact to Contract`, because the template reaches beyond that phase —
the equipment damage app is not Contact-to-Contract at all.

**Why not now.** Moving breaks cross-references in `CLAUDE.md` and
`02_Iteration Guide.md`, and takes both documents out of version control — and the
template is the document most likely to be revised as siblings are built, so
losing its history costs most. Set `_Shared` up as its own small repository at the
same time. Today it buys nothing; at app number two it costs the same and the
benefit is real.

---

## 5. Open questions

| Question | Blocking | Notes |
|---|---|---|
| ~~Admin consent for the Entra app~~ | **Resolved 17 Aug 2026** | Granted tenant-wide. Note for sibling apps: each new app registration needs its own consent, and it requires a tenant administrator. |
| **Does iOS preserve EXIF GPS through the Safari file picker?** | No | Decides whether the Google Photos Maps plan is achievable. Needs a real device test. |
| Should the app be **publicly reachable**? | No | Currently public on GitHub Pages. Cloudflare Access with one-time PIN would make it staff-only, free, and matches the mental model. Decide before wider rollout. |
| **Google Photos as secondary backup** | No | Scheduled server-side sync reading from SharePoint. No first-party Power Automate connector exists, so it needs a custom connector or script. |
| **Analytics across records** | No | Cross-job querying needs a structured database downstream. The apps produce the data; they do not provide the querying. A SharePoint List, one item per inspection, is the agreed destination — see the Handover Protocol §10. |
| ~~Who holds Global Administrator~~ | **Resolved 17 Aug 2026** | Now held internally. Worth reviewing periodically — a tenant whose only administrator is unreachable is a business risk well beyond this project. |
