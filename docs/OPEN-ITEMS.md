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

Nothing ships while any of these is open. OI-2 closed 22 August 2026; OI-10 and
OI-11 were added the same day, the second of them found while checking what the
first would involve.

### OI-10 · The v1.3 → v1.4 upgrade has never been rehearsed on a device
**Status:** open · **Tier:** a test run; an app change only if it fails
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

Two reasons it matters more than it looks. `migrateMediaBytes()`'s failure path
marks a photo *"the stored file was lost by the browser — this photo needs
retaking"*, so a hiccup is destructive to the record's state. And it opens with
`dbAll('media')` — the call OI-9 says can come back short. A short listing there
migrates nothing and reports success.

**One person can do this.** Order matters, because of OI-11:

1. Delete the database (diagnostics §8b) so the device starts at no version.
2. Open the **live** app and create an inspection with at least two photographs,
   one of them over 4 MB.
3. Open the **beta** on the same device. That is the upgrade.

**Done means:** afterwards, both photographs read back, the `bytes` store holds
them, the media records no longer carry blobs, the record reads `schema: 4`, and
nothing is marked *needs retaking*. Confirmed from diagnostics §6 and §8 rather
than by eye, and appended to the bug-test file.

### OI-11 · Opening the beta breaks the live app on that device, and there is no way back
**Status:** open — **needs a decision before release** · **Tier:** see below
**Detail:** decision log §4h

Both builds use `DB_NAME = 'ds-inspections'` and both are served from
`ds-js1.github.io`, so **they share one database.** v1.3 opens it at version 1
(`indexedDB.open(DB_NAME, 1)`) with a hard `rq.onerror → reject`. v1.4 upgrades it
to version 2.

Once the beta has been opened on a device, the shared database is at version 2,
and v1.3 can no longer open it: *the requested version (1) is less than the
existing version (2)*. `openDB()` rejects, so every read and write in the live app
fails from then on. **The tester's phone is almost certainly in this state now.**

This is not new and was not introduced by any recent change — it has been true
since the beta was first put on this origin. It has gone unnoticed because staff
do not use the beta.

**Why it blocks a release decision rather than merely being untidy: it removes the
rollback.** Once v1.4 is at the root, every device that opens it holds a version-2
database. Reverting the root to v1.3 would then leave every one of those devices
with a database v1.3 cannot open — so the usual safety net, put the old one back,
is not there. That is worth knowing **before** shipping, not after.

**Done means:** a recorded decision. The options, and none is obviously right:
accept it and release forward-only, with a written note that rollback is not
available; give v1.4 its own `DB_NAME` so the two never share; or teach v1.3 to
fail gracefully when it meets a newer database — which means touching the live
app, and is the only option that helps the devices already affected.

### OI-1 · "Force the handover" has never been seen to work
**Status:** open · **Tier:** test-only run, no code expected
**Detail:** `bug tests/OUTSTANDING-baton-status-and-forced-handover.txt` step 5;
`docs/HANDOFF-22-august-baton-and-storage.md` §2

The reason it was unreachable is fixed and proved *at the transport* — the app
receives `BatonHolder`, so `batonState()` can reach `held`, so the gate at
`index.html:3917` can open. **Nobody has watched the button appear and work.**

**Done means:** steps 4 and 5 run on a real device against real SharePoint, **with
two different people** — one administrator, one holder. Every run so far has had
one person as both, which is not what the feature is for and is part of why this
went unnoticed. Result appended to the bug-test file.

---

## 2. Open, not blocking

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

**Done means:** a decision-log entry either way — a visible-but-non-blocking
signal, or a recorded decision to keep the silence and why. **Do not just change
it**; two handoffs have now asked for this to be decided rather than done.

### OI-5 · Does iOS preserve EXIF GPS through the Safari file picker?
**Status:** open · **Tier:** unknown until answered
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
  `ds-inspect-v1.4.0-29`.

---

## 4. Closed — kept so they are not reopened

| ID | Item | Closed | By what |
|---|---|---|---|
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
| `docs/HANDOFF-22-august-baton-and-storage.md` | **Live** — OI-1, OI-2, OI-3 |
| `docs/HANDOFF-orphan-bytes-race.md` | **Live** — OI-2, and OI-4 in its §6 |
| `docs/HANDOFF-baton-columns-not-read-and-storage.md` | Superseded — history only |
| `docs/HANDOFF-v1.4-polish.md` | Superseded — history only |
| `docs/HANDOFF-batch-B-guides.md`, `-C-context-and-training.md`, `-D-guides-and-pdfs.md` | Superseded — history only |
| `docs/HANDOFF-folder-restructure.md` | Done, 18 Aug 2026 |
| `docs/DECISION-LOG.md` | **Always live** — why things are as they are |
| `docs/v1.4-plan.md` | **Live** — the build's own plan |
