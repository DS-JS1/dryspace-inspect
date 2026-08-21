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
| D43 | **Every storage call is bounded, and every way a transaction can end is handled** | An IndexedDB transaction that aborts fires `onabort`, not `onerror`. `tx()` handled only `onerror`, so an aborted write returned a promise that never settled and the caller waited for ever. That is not a theoretical hole: it stranded an upload on a real iPhone on 18 Aug 2026, with the record left in `uploading`, no error, no progress and nothing in flight. Safari aborts writes under storage pressure and persistence is granted at the browser's discretion, so the app cannot prevent an abort — only survive one. A storage *error* is recoverable: the queue marks the file failed, says why, and "Try again" reaches it. A storage call that never returns is recoverable by nothing. | v1.4 |
| D44 | **A summary may never contradict the list beneath it** | `pendingUploads()` ignores `uploading` on purpose — the queue already holds that file, so offering "Upload now" would start a second attempt on one upload. But the summary read "not pending" as "finished" and said "All photos uploaded" directly above a panel listing two files as Uploading. The counting, not the queue, was the lie. Staff who are shown two contradictory statements learn to trust neither, and the next true warning is the one that gets ignored. | v1.4 |
| D45 | **The app owns the bytes it stores; it never stores a handle to somebody else's file** | A `File` from a camera input is a reference to a temporary file the operating system owns. Stored in IndexedDB, the record outlives what it points at: iOS reclaims the file and reading it throws "The object can not be found here". It cost a real inspection's evidence photo, and three rounds of diagnosis, because the compressed report copy was fine throughout — canvas made it, so the app owned it. Captured files are read once into an ArrayBuffer and rebuilt as a Blob. The rule generalises past photos: anything this app is responsible for keeping, it must hold, not reference. | v1.4 |
| D46 | **The filing nudge belongs at the first upload, not at capture** | The folder name is pinned by the first upload (D34's naming, made permanent so a later correction cannot split one job across two folders), so that upload is the last moment the inspection number still decides where photos file. Asking at capture would put a dialog between an inspector and the photo in front of them, which is the one thing this app does not do — capture is never blocked. Asked once per inspection, and never once the folder is pinned, because after that it changes nothing and a warning that cannot be acted on is one people learn to dismiss. | v1.4 |
| D47 | **"Unreadable" earns one retry before it means "gone"** | The pre-flight was written to treat an unreadable blob as permanent: no amount of retrying restores what the browser has lost. A device disproved it — a photo failed the read and the very next attempt uploaded it, so WebKit can report a blob missing transiently. Still permanent on the second consecutive failure, so a genuinely lost photo still surfaces for attention. The asymmetry decides it: a wasted retry costs a second, while wrongly declaring a photo lost sends somebody back to site to retake one that was there all along. | v1.4 |
| D48 | **A record the queue cannot see is a record that is lost** | `pending()` counted `queued` and retryable `failed`, and ignored `uploading` on the reasoning that the queue already held that file. It did not always: if the write recording an attempt's outcome failed, the record kept `uploading` on disk and nothing counted it again until the next page load. Three photos were stranded that way on a device, each attempted once, none carrying any error, while the drain reported itself finished. This queue holds exactly one file in flight, so any OTHER record in `uploading` is stranded by definition and is now picked up immediately. Start-up recovery remains, but it cannot help a device nobody restarts. The rule generalises: every state a record can be left in must be reachable by something. | v1.4 |
| D49 | **Bytes are stored as bytes, never as a Blob** | D45 made the app build its own Blobs, on the reasoning that a `File` from the camera pointed at an OS file iOS could reclaim. The photos kept dying anyway. A Blob in IndexedDB is itself only a reference: WebKit writes the data to a separate file, and that file is what disappears — who created the Blob is irrelevant. An `ArrayBuffer` is serialised inside the record, so there is no second file to lose. They live in a separate `bytes` store because `dbAll('media')` runs on every render and deserialising every photo to draw a status panel would trade one fault for another. A Blob is rebuilt at the moment of use and never stored. Supersedes the reasoning of D45, which was right about the risk and wrong about the cause. | v1.4 |
| D50 | **Working out where something would file must not decide where it files** | `resolveFolder()` pins `mediaFolder` as a side effect of being asked, so merely opening the handover question fixed the folder name — while that same question told the person that filling in the blank details would still change it. It was false by the time they read it, and cancelling to go and add the inspection number achieved nothing. A question about what WOULD happen must be free of consequences, or it is not a question. Pinning now happens where it is a fact: at the upload. | v1.4 |
| D51 | **A handed-over record carries what the photos ARE, not the photos** | The receiving device could not see that an inspection had photos at all, because the draft deliberately omits them — they are already in `photos/` beside it. It now carries each landed photo's thumbnail and SharePoint identity, and they arrive in state `purged`, which already means uploaded, verified, no local copy held. That is not a new concept bolted on; it is the state that was already true. The queue ignores `purged`, which is what stops one photo landing twice under two names, and a tap fetches the original when somebody actually needs it. A report built where the photos are absent says so rather than looking complete. | v1.4 |
| D52 | **A copy that is no longer the live record must say so, before it is opened** | The baton pointer cannot answer "do I still hold this?" — it is set both when taking a record over and when handing it on, because it means "what this device last agreed with in `current/`". So a sent record looked identical to a held one, and the warning came at the NEXT handover: after an hour's work, when the cost had already been paid. A warning that arrives after the damage is not a warning. Handing over now stamps the record, the card says so, it sorts below the live ones, and opening it asks first and names the action that actually helps. | v1.4 |
| D53 | **A photo can reach SharePoint without anything referencing it** | The record in `current/` lists the photos as they were at the moment of handover. Photos uploaded afterwards — by a device that has already handed on, adding one that was missed — land in the right folder and are referenced by nothing, so the next person to take the inspection over does not see them. Not blocked: adding a missed photo is legitimate and the file is safely stored either way. But it is said at the time and names the fix, which is handing over again so the record catches up with the folder. The deeper answer is for a takeover to reconcile against `photos/` rather than trusting the draft's list — the folder is the index (D23) — and that is not built yet. | v1.4 |
| D54 | **The report carries a readable copy and a route to the real one** | Full-resolution originals are not embedded: they would make the report undeliverable by email, which is how it reaches people. They live in the inspection's `photos/` folder, and everyone who needs detail — design, technical, sales, admin — already has access to that library. The gap was never quality, it was that the report never said the original existed or where. Each photo is now a link to its SharePoint item and the caption says so, which costs nothing and removes the need to know. A photo the sending device holds only as a reference is shown as its thumbnail and labelled as one, so a report is never photo-less and never overstates what it contains. | v1.4 |
| D55 | **The folder list must say who holds the record, not just what it is** | The library columns are the index (D23), and they described the inspection while saying nothing about who had it. So the one question the baton protocol exists to answer — is this waiting for me, or is somebody working on it — could only be answered by ringing round. `BatonStatus` and `BatonHolder` are written at both ends of the handover, because that is exactly when the answer changes. The holder is kept even when the baton is waiting: "last held by" is what somebody needs in order to ask a question about it. One colour vocabulary is shared by SharePoint and both in-app lists, so what a person learns in one place means the same in the others. | v1.4 |
| D56 | **Reading a record must not make you its holder** | Technical, sales and admin all need to read an inspection without taking it, and the only route was raw JSON in SharePoint. But the form is built around `cur` and an autosave, so opening one for reading would have written it onto the reviewer's device — the exact fork the baton rule exists to prevent. One flag, checked in `saveNow()`, which is the single place every write funnels through. When somebody holds the inspection the viewer falls back to the newest file in `archive/`: "you cannot look at it because a colleague has it" is not an answer anybody would accept, and the archived copy is exactly what they last sent. | v1.4 |
| D57 | **Splitting a record from its bytes added a second thing to delete, and deletion did not know** | D49 moved photo bytes into their own store and every reader was updated, because everything that USES bytes goes through the record. Deletion is the one operation that has to know about both, and it did not — so every photo ever removed left its bytes behind, referenced by nothing and listed by nothing. A device with no inspections left was carrying 139 MB. Both are deleted together now, and a start-up sweep reclaims existing orphans. The general lesson: when you split one thing into two, the delete path is where the split leaks. | v1.4 |
| D58 | **Asking for the baton goes through the share sheet, not a notification** | Web push on iOS requires the app installed to the Home Screen, permission granted, AND a server to send from — this app is static files on GitHub Pages, so that is infrastructure rather than a feature, and anyone running it in a browser tab would silently receive nothing. A pre-filled message through the share sheet works on every platform today and lets the sender choose the channel that person actually reads. The message carries what the holder needs to act without asking anything back: which inspection, what stage, who wants it, and what to do. In-app notification is a real future option once there is a server to send from. | v1.4 |
| D59 | **Forcing a handover is an administrator's act, and it must leave a mark** | A device lost, broken, or belonging to somebody who has left strands the record where nobody can reach it. Recovering a working copy already handled the mechanics — it files back to the same pinned folder, so no duplicate appears, and clears the baton so the original device meets the fork warning if it resurfaces. The gaps were that anybody could do it and nobody else could tell it had happened. Restricted to an address in `SP_CONFIG.admins`, matched against the signed-in Microsoft account rather than the name typed into the app, so it cannot be granted by typing. The library is marked `Recovered` carrying BOTH names, because "who had it before this was taken off them" is the first question anybody asks. The list is empty by default: nobody is an administrator until somebody says so. One thing no feature can fix — if a device dies between backups, those four minutes are gone, and that belongs in the training rather than in code. | v1.4 |

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

### The documentation caught up with the app — 21 August 2026

The guides were deliberately left alone while the app changed daily. This is the
pass that brings them back to the truth, against build `v1.4.0-25`. Documentation
tier only: no app file was touched, `APP_VER` stays 1.4.0, `CACHE_VERSION` does
not move, and the suite stayed at 550 assertions with zero failures either side.

**`03_Handover and Version Control Protocol` — rewritten.** The document staff
actually follow, so it was done first and read in full before anything was
changed.

**The one real defect it was carrying.** The app tells a person *"Handover
Protocol §8"* in two places — when `current/` holds two files, and when a
handover uploads but cannot archive. §8 was **SharePoint settings to turn on**,
and the procedure they needed was §9. D36 and D37 both say §8 as well, so the
app and the decision log agreed with each other and the document disagreed with
both. Somebody hitting that error mid-handover, on a phone, would have opened
the guide and found library configuration.

Fixed in the document rather than in the app: *If something has already gone
wrong* is now §8, permanently, and says so in a note at the top so a future
renumber does not quietly break it again. Changing five error strings in
`index.html` would have made a documentation pass into a code change, and the
section reference is the arbitrary half of the pair.

The general shape is worth keeping: **a cross-reference from code into a document
pins that document's numbering.** Two of them existed and nothing recorded that
they did.

**What else was wrong, in the order it would have cost somebody something:**

- *Hand over through SharePoint* was described as being **at the foot of the
  form**. Batch 4 moved the whole action row to the top, under the stage
  selector. The guide sent people scrolling past eleven sections looking for a
  button that had moved.
- `wip/` was missing from the folder diagram entirely, so the automatic backup —
  the thing that makes a forced handover possible at all — was invisible in the
  document that describes the folders.
- The library was described as carrying **six** columns. It carries eight.
- Nothing recorded the `BatonStatus` **column formatting JSON**. It existed only
  as an instruction to paste something, in an unrun test. It is now in §10, with
  the same hex values the app uses.

**Two honest limits written down for the first time**, both found by reading the
code against the document rather than by testing:

- **`Recovered` is a SharePoint-only word.** D55 says one colour vocabulary is
  shared by SharePoint and both in-app lists, and that is true of the three
  states the app shows. A forced handover writes a **fourth** value that the app
  has no badge for: such a folder reads in the app as IN PROGRESS, held by the
  administrator. Not a fault — somebody does hold it — but the two vocabularies
  differ in exactly one place and now it is said so.
- **The app never reads `BatonStatus` back.** WAITING / IN PROGRESS / NOT HANDED
  OVER are derived from whether a file sits in `current/` and whether
  `BatonHolder` carries a name. `BatonStatus` exists to be sorted, filtered and
  coloured in the library. Editing it by hand changes the library and nothing
  else, and the next handover overwrites it.

New §5, *Seeing where every inspection is*, carries browse, the three states,
read-only review and asking for the baton. Forced handover went into §8 beside
the other things you do when something has gone wrong, rather than into the
feature tour, because that is when somebody reaches for it. Administrators are
described in §7 next to signing in, since the gate is the Microsoft account.

---

### The same wrong cross-reference was in a second document — 21 August 2026

Batch B of the documentation pass: `01_Setup and User Guide` and
`02_Iteration Guide`, against the same build `v1.4.0-25`. Documentation tier,
no app file touched, 550 assertions passing either side.

**Batch A fixed *"Handover Protocol §8"* inside `03`. `01` Part B was pointing at
the same wrong section, and Batch A had no way to know.** The setup instructions
it sends people to are §10; §8 is now *If something has already gone wrong*. `01`
also still described the library as carrying six columns, which is the other
error Batch A had just corrected in `03`.

So the rule from Batch A needs a second half. *A cross-reference from code into a
document pins that document's numbering* — and **fixing a cross-reference in one
document does not fix the others that carry it.** Nothing in this repository
looks across files. Before renumbering anything, grep the whole folder for the
document's name, not just the code:

```
grep -rn "Handover and Version Control" . --include=*.md --include=*.txt
```

This is cheap and it is the only thing that would have caught it.

**The filing nudge is two checks with different rules, and only one was written
down.** `docs/HANDOFF-v1.4-polish.md` describes it as a single prompt before the
first upload, asked once per inspection and never after the folder is pinned.
That is `confirmFilingBeforeFirstUpload()` and it is accurate as far as it goes.
There is a second, `confirmFiling()`, which runs at **every handover** with any
of the five fields blank — including after the folder is pinned, where it changes
its own wording to say that filling them in now corrects the record and the
library columns but will **not** rename the folder or any photo in it.

Both are correct and neither should be removed. The distinction matters because
they answer different questions: the first is *"is this about to file somewhere
you did not intend?"*, the second is *"is this about to become somebody else's
problem with holes in it?"*. A session that reads only the handoff will assume
one prompt and delete the other as a duplicate.

**A count restated in prose decays silently.** `02_Iteration Guide` gave the
test-suite assertion count in two places and was wrong in both — 366 in §1 and
237 in §5, against 550 actual. Neither number was ever a lie when it was
written; the suite simply grew and nothing pointed at the document. Two wrong
numbers in one file also means the second was copied without being checked.

Kept rather than removed, because the count IS the thing a person needs at the
start of a session — but now with the instruction to take the number the suite
prints today as the session baseline, and to care that it does not *drop*. That
turns a fact that rots into a procedure that does not.

The same reasoning is why `01` now tells staff to quote the **build** line from
the footer in a bug report. `APP_VER` has reported 1.4.0 for twenty-five builds;
the number that cannot be stale is the one read from what is actually served.

**Also brought current, without needing a decision:** the storage layer in `02`
§3 (`DB_VERSION` 2, the three stores, `migrateMediaBytes()`, and the no-Blob rule
with D45/D49 named as settled); the three release gates §4 did not list
(`field_ids_v<APP_VER>.json`, the `Guides/` PDFs, the changelog); the two dialog
styles as `02` §8, stated as deliberate and unfinished so nobody tidies a native
`confirm()` off a capture-adjacent path; and in `01`, thumbnails-on-takeover with
tap-to-fetch, the report's bring-them-down-first question, the form's Upload
button, the HANDED OVER badge, browse, read-only view and asking for the baton.

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
- **The Handover Protocol's own section numbers were out of step with the app.**
  `index.html` sends a person to §8 twice, and §8 was the SharePoint settings
  section. Corrected 21 Aug 2026 by renumbering the document, not the app. The
  numbering of that document is now load-bearing and the document says so.

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

### Move the shared documents up a level — **DONE, 18 August 2026**

Done as part of the v1.3 → v1.4 folder restructure, which is what the trigger was
changed to on the same day. The original trigger — *starting the second app* —
assumed the second app would arrive before this folder was archived. It would not
have.

**What moved**

```
00_AI Tools in Development/
    _Shared/                            ← its own git repository
        Field App Architecture Template.md   was docs/FIELD-APP-TEMPLATE.md
        Dryspace Context Brief.md            was 04_Project Context Brief.md
    01_Contact to Contract/
        Dryspace Inspection App v1.4/   ← this app only
```

Above `01_Contact to Contract`, because the template reaches beyond that phase —
the equipment damage app is not Contact-to-Contract at all.

**The risk this removed was concrete:** both documents describe how Dryspace
builds *any* field app, and the business and trade behind them. Neither is about
the Site Inspection App, yet both lived inside its folder — so retiring v1.3 would
have taken the specification for four unbuilt apps with it.

**The history was not carried across — decided on evidence, not convenience.**

This section previously assumed the template's history was worth preserving, and
that losing it was the main cost of moving. Looking at what the history actually
contains reversed that. Of the six commits touching `FIELD-APP-TEMPLATE.md`, only
two were about the template; the rest were app changes that happened to edit it.
Of the two touching the Context Brief, one was a bulk move and one a release
commit. A `filter-repo` extraction would therefore have produced a documentation
repository whose log is mostly commit messages about SharePoint upload internals
— technically preserved, semantically wrong, and confusing to anyone opening it
later to ask why the template says what it says.

Nothing is lost. Every one of those commits stays in `dryspace-inspect` for ever;
the last to touch either document is `2ef0089`. This was a decision not to
*duplicate* history into a place where it would read as noise. The history that
matters for these two documents has not been written yet, because it is the
revisions that come as sibling apps get built — and that history now starts clean,
in a repository that is about them alone.

**Cross-references updated in the same pass:** `CLAUDE.md`, `02_Iteration Guide.md`,
`05_Release Protocol.md`, `Guides/README.txt`, and the dev-server and permission
paths in `.claude/launch.json` and `.claude/settings.local.json`, which sit outside
this repository and so do not show in `git status`.

---

## 4a. The replacement training deck is HTML, not PowerPoint

**Decided 21 August 2026, Batch C.**

`Setup_and_Use_Presentation.pptx` was deleted because it taught the five-step
handover and could not be regenerated. The obvious replacement was another
`.pptx`. It is not what was built.

The reason the deck went stale *and stayed stale unnoticed* is recorded in
`Training/README.txt`: it was **the only item in the pack not held as editable
source**. Every other training artefact is `.svg`, `.html` or `.md` — text, in
the folder, greppable. When the action row moved to the top of the form, a grep
for *"foot of the form"* across the pack found the chart and the cards. It could
not find the deck, because the sentence was inside a zip of XML. Nobody saw it
was wrong until somebody thought to open it, which is the failure mode this
project keeps paying for.

Rebuilding it as `.pptx` would have restored the artefact and preserved the
defect. `Setup_and_Use_Deck.html` is plain text beside the rest of the pack,
prints to PDF the way `Workflow_Chart.html` already does, opens on any device
with no software, works offline, and carries its presenter notes in the same
file.

**What is given up:** nobody can edit a slide in PowerPoint. Judged a smaller
cost than a deck that can silently disagree with the app again — and the pack has
no other PowerPoint in it, so there is no habit being broken.

**If a `.pptx` is ever genuinely wanted**, generate it from this file rather than
maintaining it by hand, so the source of truth stays in one place.

---

## 4b. The Workflow Chart was stale under a v1.4 stamp

**Found 21 August 2026, Batch C.** Recorded because it is the second time the
same trap has been sprung in this documentation pass.

`Training/Workflow_Chart.html` carried a footer reading *App v1.4 · Form 4.2*,
and `Training/README.txt` listed it among the items that were *"both current at
v1.4"*. Its section 02 was the **v1.3 five-step handover** in full — heading,
prose, the SVG's `aria-label`, five step boxes including *"Export"* and *"Move
the old to archive/"*, and a caption about skipping step 5.

Batch C's own brief repeated the README's claim, because the README said so.

**The rule this confirms:** a version number in a header is a claim about the
file, made by whoever last edited *part* of it. It is not a check. The only thing
that has ever caught one of these is opening the file and reading it against the
code. That is now three separate findings on the same principle — Batch A's
section numbers, Batch B's assertion counts, and this.

**The corollary that is easy to miss:** not every stale-looking number is stale.
The same file's lede says *"six stages, five handovers"*, which is correct — six
stages means five transitions. A search-and-replace for "five" would have broken
it. Read the sentence, not the digit.

---

## 4c. The release is gated on the orphan-bytes assertion, not shipped around it

**Decided 21 August 2026, at the close of Batch D**, by the owner, having been
offered the alternative of releasing at 549/550 with the failure documented as
known.

The assertion *"the orphan is reclaimed"* fails intermittently — 5 of 8 runs in
Batch D, including four consecutively and once from a cleared store. **The app is
not at fault**, and that was established by evidence rather than argument:
`sweepOrphanBytes()` called by hand on a failing page reclaims the exact record
the assertion says it missed. The fault is in the harness around the assertion,
which lets the test race the app's own start-up sweep.

**Why it is not simply documented and shipped past.** It would be the cheaper
call, and it is the wrong one. This assertion has now cried wolf twice. The cost
is not the red line in the report — it is that *"1 of 550 failed"* becomes the
suite's normal reading, and the next genuine regression in the byte-sweep code is
waved through as the known one. A test that is expected to fail has stopped being
a test. Byte-sweep code is exactly where that matters: it deletes photo data.

**The counter-argument, recorded so it is not re-litigated from scratch:** the
failure is test-side, the app is proven correct by hand, and the outstanding
SharePoint baton test is a far larger unknown standing between v1.4 and a
release. That is all true, and the decision still stands — the two are not
competing, and the test fix is small.

**Superseding this needs new information**, not a re-weighing: either the race is
shown to be unfixable without changing app code, or 20 consecutive clean runs
under load are produced without any change at all, which would mean the diagnosis
is wrong.

Full brief, including five hypotheses already disproved and the verification bar:
`docs/HANDOFF-orphan-bytes-race.md`.

---

---

## 4d. The storage figure in the footer was never the app's to report

**22 August 2026.** The footer read *"Device storage used by this app:
`navigator.storage.estimate().usage`"*. That figure is the **whole origin** — on
`ds-js1.github.io` that is the live v1.3 app alongside the beta, plus anything
WebKit has not reclaimed. A device with no inspections on it reported 137.5 MB,
and iOS Settings agreed the space was genuinely held.

**Decided: report what the app holds, and keep the origin figure for pressure.**
Two numbers answer two different questions and only one of them belongs in that
sentence:

- *"How much of this phone is my work app using?"* — answered from the app's own
  records, summed from `origSize` on the media rows. This is what staff read.
- *"Will the next photograph save?"* — answered by origin usage against origin
  quota, which is what the browser will actually enforce. `pressure()` still gets
  that figure and is unchanged.

**Why it matters beyond tidiness.** Staff seeing a work app apparently consuming
140 MB of their phone were reading the line correctly — the number was real and
the attribution was false. That erodes trust in an app people are asked to carry
to site, and it does it silently.

**Rejected: dropping the line.** It is the only place the app says anything about
what it is holding, and "uploaded photos can be freed" is a genuinely useful
prompt. The line was not the problem; the number in it was.

---

## 4e. `openDB()` must yield the database, not only complain about being blocked

**22 August 2026.** `openDB()` handled `onblocked` and never set
`onversionchange`. Those are two halves of one protocol: `onblocked` is *"somebody
else is holding the database"*; `onversionchange` is how a context **stops being
that somebody**. Only the complaining half existed.

**Consequence, found by the diagnostics page and not by anything else:** a tab with
the app open never released the database, so a delete or an upgrade from any other
context waited indefinitely. WebKit does not reliably fire `onblocked` for a
delete, so the caller saw no success, no error and no explanation.

**This is not a diagnostics problem.** `DB_VERSION` is 2. The next schema change
to 3 would have deadlocked for any user with the app open in two tabs, and
presented as a silent hang on start-up — the failure mode this project has spent
two releases learning to fear.

**Decided: close and drop the handle on `versionchange`**, so the next `openDB()`
reopens on demand. It fires only when another context deliberately asks for an
upgrade or a delete, which in practice means `diagnostics.html`. The cost is a
reopen; the alternative is a hang with no message.

---

## 4f. WebKit holds the space after the records are gone

**22 August 2026, settled on a real iPhone.** A device with every store empty
reported ~140 MB. Ruled out **by measurement, not by argument**: IndexedDB held
three stores with nought rows, exactly one database existed on the origin, one
cache held 0.2 MB and belonged to the current build, and localStorage was
negligible. iOS *Settings → Safari → Advanced → Website Data* independently
reported `github.io` at 145 MB, which killed the "the figure is fiction"
hypothesis — the space was real.

**What it was:** WebKit keeps IndexedDB in a file that does not shrink when
records are deleted. Emptying a store frees pages inside the file; the file stays
the size it grew to. Deleting the **database** removes the file.

**How it was proved:** the delete ran, appeared to time out, and the space came
back anyway — 139.0 MB before, 0.9 MB at the next run fourteen minutes later, with
the tester still signed in and having deleted nothing through Settings. A
`deleteDatabase` that times out is abandoned by the calling page, **not cancelled
by the browser**: it stayed queued and completed once the tab holding the database
closed. Nothing else on that device could have freed the space.

**Decided: no app-side reclaim, and no automatic database deletion.** Deleting the
database is a sound reclaim on an *empty* device and an unacceptable risk on any
other, and the trigger for "empty" would have to be exactly right every time
forever. The non-negotiable is that a local original is never deleted until it is
verified in SharePoint; a mechanism that removes the whole store is one bug away
from breaking it. The reclaim stays a deliberate act in `diagnostics.html`, behind
a guard that counts the stores at the moment of the tap.

**What ships instead is honesty** — 4d above. Staff no longer see the browser's
unreclaimed space attributed to the app.

---

## 4g. `dbAll()` can return an empty array from a store that is not empty

**22 August 2026, measured on Chromium under sustained CPU load.** While the
app's start-up chain was still running, `dbAll('bytes')` returned `[]` from a
store holding two records. Captured at the moment of failure, all within a few
milliseconds of each other:

| Read | Result |
|---|---|
| `dbAll('media')`, `dbAll('bytes')` — the app's cached connection | `[]`, `[]` |
| `dbGet('bytes', orphan)`, `dbGet('bytes', live)`, `dbGet('media', live)` | all **found** |
| A freshly opened connection: `count()` on `bytes` | **2** |
| Same fresh connection, `getAllKeys()` | the exact two keys |

The point lookups were right. The bulk listing was wrong. This is what had been
failing the orphan-bytes assertion roughly five runs in eight since Batch C, and
**three earlier investigations all looked in the wrong place** — a stale service
worker, leftover store data, and a harness ordering race were each proposed and
each disproved, because the fault was never in any of them.

**Why it mattered far more than a flaky test.** `sweepOrphanBytes()` decided what
to **delete** by comparing two `dbAll()` listings: every record in `bytes` whose
`mid` was absent from `media` was treated as an orphan and removed. In the
observed failures both listings came back empty together, so the sweep merely did
nothing. **The same fault in only the first listing produces an empty `live` map
and marks every byte record on the device as an orphan** — every photograph,
deleted, on the strength of one bad read. Nothing in the code stood between that
read and the deletion.

**Decided: never delete on the strength of a bulk listing.** `sweepOrphanBytes()`
now treats the listing as producing *candidates*, and confirms each one with a
point `dbGet('media', mid)` before deleting anything. The point read is the one
that stayed correct throughout, and it costs only one lookup per record already
believed dead.

**Rejected: retrying the listing until two agree.** It makes the window smaller
without closing it, and it would still be a bulk read deciding a deletion. The
non-negotiable is that a local original is never deleted until it is verified in
SharePoint — deleting one on a misread listing breaks that rule just as
completely as a bad upload would.

**Not claimed:** the browser-level cause. It reproduces only under heavy load and
disappears when instrumented — adding a second connection before the sweep was
enough to mask it, which is worth knowing before anyone tries to chase it further.
The guard does not depend on knowing the cause, and that is the point of it.

---

## 4h. The beta shares a database with the live app, and that removes the rollback

**22 August 2026, found while scoping the upgrade rehearsal (OI-10).** Both builds
use `DB_NAME = 'ds-inspections'`, and both are served from `ds-js1.github.io`.
IndexedDB is scoped to the origin, not the path — so `/` and `/beta/` have never
been two apps with two databases. They are two apps sharing one.

v1.3 opens it at version 1 and rejects hard on error. v1.4 upgrades it to version
2. **Once a device opens the beta, the live app on that device can no longer open
the database at all**: *the requested version (1) is less than the existing version
(2)*, `openDB()` rejects, and every read and write in v1.3 fails from then on.

Nothing recent caused this. It has been true since the beta was first placed on
this origin, and it went unnoticed because staff do not use the beta — only
testers do, and a tester who stops using the live app on that handset never sees
the consequence.

**The reason it belongs in this log rather than in a bug list: it removes the
rollback.** Once v1.4 is at the root, every device that opens it carries a
version-2 database. Putting v1.3 back would leave all of them holding a database
the restored app cannot open. The habitual safety net — revert the root, staff
carry on — **is not available for this release**, and that is a fact worth having
before the decision rather than during an incident.

**DECIDED, 22 August 2026: the beta gets its own database.** `DB_NAME` is now
`isBetaBuild() ? 'ds-inspections-beta' : 'ds-inspections'`.

What settled it was learning the premise was wrong. The rollback argument assumed
staff handsets carrying version-2 databases; **the app has never been deployed and
nobody but the owner has ever used it.** There was nothing to roll back for. That
turned a difficult release decision into a free one — and made the third option,
teaching v1.3 to fail gracefully, unnecessary, since the only affected handset is
cleared by deleting the site's data.

**Taken now precisely because it was free.** The same collision returns at the
v1.5 beta against v1.4 live, and by then staff will have photographs on their
phones: the same one-line change becomes a migration. A window in which structural
choices cost nothing is not a reason to postpone them.

It is also right on its own terms. A test build has no business writing to the
storage a real inspection lives in, and `CLAUDE.md` already says real inspections
belong in the live app. The cost — beta data does not carry over to the live app —
is the intended behaviour rather than a side effect.

`diagnostics.html` derives the same name from the path, because its first read
happens before the app boots and it cannot ask. `tests.html` checks the two agree,
since a diagnostic pointed at the wrong store reports an empty device with total
confidence.

---

## 5. Open questions

| Question | Blocking | Notes |
|---|---|---|
| ~~Admin consent for the Entra app~~ | **Resolved 17 Aug 2026** | Granted tenant-wide. Note for sibling apps: each new app registration needs its own consent, and it requires a tenant administrator. |
| **Does iOS preserve EXIF GPS through the Safari file picker?** | No | Decides whether the Google Photos Maps plan is achievable. Needs a real device test. |
| Should the app be **publicly reachable**? | No | Currently public on GitHub Pages. Cloudflare Access with one-time PIN would make it staff-only, free, and matches the mental model. Decide before wider rollout. |
| **Google Photos as secondary backup** | No | Scheduled server-side sync reading from SharePoint. No first-party Power Automate connector exists, so it needs a custom connector or script. |
| **Two flaky assertions in `tests.html`** | No | *bytes already orphaned are swept up* fails intermittently on both its assertions. Found Batch C, 21 Aug 2026. **Not an app fault** — `sweepOrphanBytes()` reclaims correctly when called directly. The two checks are declared with `later()`, whose IIFE bodies start immediately, so they race each other and the app's own start-up `sweepOrphanBytes()` over one key. A stale service worker and leftover store data were both proposed and both **disproved by test**; do not re-derive them. A failing run leaves `__already-orphaned__` behind, so it looks stable on reload — that is what made it read as a regression. Fix when a batch may touch `tests.html`: own key namespace, sequenced after boot. |
| **Analytics across records** | No | Cross-job querying needs a structured database downstream. The apps produce the data; they do not provide the querying. A SharePoint List, one item per inspection, is the agreed destination — see the Handover Protocol §11. |
| ~~Who holds Global Administrator~~ | **Resolved 17 Aug 2026** | Now held internally. Worth reviewing periodically — a tenant whose only administrator is unreachable is a business risk well beyond this project. |
