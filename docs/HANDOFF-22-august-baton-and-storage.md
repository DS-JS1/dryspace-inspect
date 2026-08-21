# Handoff — both faults from the baton test are closed. One test step is not.

**Written:** 22 August 2026, after a device session against real SharePoint on an
iPhone (iOS 18.7, Safari 26.6), builds `v1.4.0-25` through `-28`.
**Supersedes:** `docs/HANDOFF-baton-columns-not-read-and-storage.md`, whose two
faults are both now resolved. Read that one only for the history.
**For:** the next session. **Read `CLAUDE.md` and this file.**

---

## 1. Say the tier first

Everything done in this session was **patch** tier — bug fixes and a wording fix,
per `05_Release Protocol` §1. The folder stayed `v1.4`.

**`APP_VER` is still `1.4.0` and that is deliberate.** v1.4.0 has never been
released, so the fixes folded into it rather than incrementing to 1.4.1.
`CACHE_VERSION` moved `-25` → `-28`, once per app-file change, because a
forgotten cache bump is silent.

**`main`'s root still serves v1.3.0 and that is correct.** Verified at the end of
the session: `index.html`, `sw.js`, `ds-sharepoint.js` and `ds-media-sync.js` at
the root are byte-identical to what they were before the session. Only `beta/`
moved. Nothing is tagged.

---

## 2. What is still owed — read this part if you read nothing else

### Step 5 of the baton test. It needs a second person.

`bug tests/OUTSTANDING-baton-status-and-forced-handover.txt`, steps 4 and 5.

**"Force the handover" has still never been seen.** The reason it was unreachable
is fixed and proved *at the transport* — the app now receives `BatonHolder`, so
`batonState()` can return `held`, so the button can be offered. But nobody has
watched it appear and work.

`isAdmin() && b.key === 'held'` (`index.html:3917`) is the gate. Reaching `held`
needs `current/` empty **and** `BatonHolder` set.

**Do it with two people.** Every run so far has had one person as both
administrator and holder, which is not what the feature is for, and is part of
why this went unnoticed for a release cycle.

### The orphan-bytes race is still open

`docs/HANDOFF-orphan-bytes-race.md`, and decision log §4c gates the release on it.
Observed this session: **550/550 twice, 549/550 once.** The failure was the known
assertion, *"the orphan is reclaimed"*.

Ruled out as caused by this session's `onversionchange` change, on two grounds:
`tests.html` never calls `indexedDB.open` or `deleteDatabase` itself — it drives
everything through the app's helpers — so no context ever requests an upgrade or
a delete and `versionchange` cannot fire during a run; and the rate matches the
5-in-8 already recorded. **Do not re-derive the five disproved hypotheses in §3
of that handoff.**

### The swallowed `setFields()` failures — still a decision, still not taken

`index.html:3802` (forced handover), `4114` (takeover), `3265` (handover) all
`.catch(function(){})`. That is right: a column problem must never block a
handover. But the same silence is why the column fault survived a release cycle.

The previous handoff asked for a visible-but-non-blocking signal to be
**decided**, not just done. It has not been decided. **Put it in the decision log
either way.**

---

## 3. Fault 1 — the library columns. CLOSED.

### Proved before it was changed

`diagnostics.html` section 7 takes three readings of the same library root in the
same moment. On the device at 12:31am:

| Reading | Query | Folders with columns |
|---|---|---|
| 1 | the app's own `list()` | **0 of 3** |
| 2 | the old form, raw | **0 of 3** |
| 3 | `$expand=listItem($expand=fields)` | **3 of 3** |

The raw responses are the whole argument. Under the old form `listItem` came back
as `{"@odata.etag": …}` and nothing else. Under the documented form the same
folder carried its `fields`, and Graph's own context URL acknowledged the
expansion as `listItem(fields())`.

`INS - 22xx - Frinight TestClient` → `BatonStatus=Waiting`,
`BatonHolder=Jamie Stone`, `Stage=S01-OFFICE`. Set the whole time, invisible to
the app.

### The fix

`ds-sharepoint.js:363` — `$select` on a nested navigation property **names** it
without populating it. Now `$expand=listItem($expand=fields)`.

**Shipped exactly as tested**, `$` prefixes and all, rather than changing only the
expand. What ran on the device is what ships.

### Section 7 is now a regression check, not a proof

The old form is kept as a **control that must keep returning nothing**. If it ever
starts returning fields, the control has stopped discriminating and a pass there
means nothing — the panel says so outright. Healthy is the app and the documented
form agreeing with the control blind. "App blind while the documented form works"
now reads **REGRESSION**.

---

## 4. Fault 2 — the storage. CLOSED, and it was never the app's data.

### What it was

**WebKit keeps IndexedDB in a file that does not shrink when records are
deleted.** Emptying a store frees pages inside the file; the file stays the size
it grew to. Deleting the **database** removes the file.

### How it was established — by measurement, not argument

- 137.5 MB reported on a device showing "No inspections yet".
- iOS *Settings → Safari → Advanced → Website Data* independently showed
  `github.io` at **145 MB**. Two measurements, one from outside the page's own
  APIs, agreeing. **That killed the "the figure is fiction" hypothesis.**
- Everything enumerable measured and empty: three stores with nought rows,
  **exactly one** database on the origin (so no v1.3 database hiding), one cache
  at 0.2 MB belonging to the current build (so no other build's cache hiding),
  localStorage negligible. **137.3 MB unattributed.**

### How it was proved

The delete appeared to time out at 1:10am — and the space came back anyway.
139.0 MB before it, **0.9 MB by 1:24am**, with the tester still signed in and
having deleted nothing through Settings. Nothing else on that device could have
freed it.

**A `deleteDatabase` that times out is abandoned by the calling page, not
cancelled by the browser.** It stayed queued and completed once the tab holding
the database closed. Device now reports 1.6 MB.

### Decided: no app-side reclaim

Decision log **§4f**. Deleting the database is a sound reclaim on an *empty*
device and an unacceptable risk on any other, and "empty" would have to be
detected correctly every time forever. The non-negotiable is that a local
original is never deleted until it is verified in SharePoint; a mechanism that
removes the whole store is one bug away from breaking it.

The reclaim stays a deliberate act in `diagnostics.html`, behind a guard.

---

## 5. Two faults found on the way that nobody was looking for

### `openDB()` never yielded the database — and it would have bitten the next schema change

`openDB()` handled `onblocked` and never set `onversionchange`. Two halves of one
protocol: `onblocked` is *"somebody else is holding the database"*;
`onversionchange` is how a context **stops being that somebody**. Only the
complaining half existed, so a tab with the app open never let go, and WebKit does
not reliably fire `onblocked` for a delete — the caller got no success, no error,
no explanation.

**`DB_VERSION` is 2. The next schema change to 3 would have deadlocked for any
user with the app open in two tabs, presenting as a silent hang on start-up.**
Decision log §4e.

### The footer told staff a number that was not theirs

`index.html` reported `navigator.storage.estimate().usage` as *"Device storage
used by this app"*. That is the **whole origin** — the live app beside the beta,
plus anything WebKit has not reclaimed. On an empty device it read 137.5 MB.

**The number was real; the attribution was false.** Staff reading it as a work app
eating their phone were reading it correctly.

Now: *"No photos stored on this device"* when empty, *"Photos held on this device:
8.3 MB across 2 files"* otherwise — summed from `origSize` on records already
loaded. `pressure()` still gets the **origin** figure, deliberately: *"will the
next photo save"* depends on what the browser will enforce, not on what the app
thinks it holds. Decision log §4d.

---

## 6. What `diagnostics.html` can do now

Sections 7 and 8 are new. **Both are read-only except the one guarded button.**

- **§7 — the library columns.** Three readings, raw JSON, five-outcome verdict,
  and a drift check: the query literal on the page is a *copy*, so if readings 1
  and 2 disagree the page says the copy is stale rather than reporting on a query
  the app no longer makes.
- **§8 — storage attribution.** Every database on the origin, every store with row
  count and byte total, every cache with the build it belongs to, localStorage,
  and the unattributed remainder. **Caches and the storage figure are snapshotted
  before the app boots**, because booting it carries `?nosw=1`, which deletes
  every cache on the origin — the first version measured them *after* destroying
  them.
- **§8b — delete the database.** Refuses unless all three stores are empty,
  counted at the moment of the tap. Closes the app frame first. `onblocked` is not
  treated as fatal. 45-second deadlines. Reports **INCONCLUSIVE** when there was
  nothing to reclaim, rather than inventing a verdict.

**Two traps worth knowing.** The service worker caches `diagnostics.html` and
matches with `ignoreSearch:true`, so `?v=2` will not force a fresh copy — if the
sections stop at 6, open it once more. And opening the page costs the device its
offline caches for **both** apps, so reopen both normally afterwards.

---

## 7. Where things stand

| | |
|---|---|
| `main` | `689e33f` — root untouched, `beta/` refreshed. **v1.3.0 still live for staff.** |
| `v1.4` | `070b179` |
| Beta | `https://ds-js1.github.io/dryspace-inspect/beta/`, build `v1.4.0-28` |
| Tests | 550/550, bar the known orphan race |
| Tag | none |

Commits this session, on `v1.4`: `2f12519`, `212f7ba`, `f19fec2`, `d778648`,
`9a3b10a`, `e0f083f`, `070b179`.

---

## 8. What NOT to do

- **Do not release.** Step 5 is unrun; the button has never been seen to work.
- Do not tag, and do not touch `main`'s root.
- Do not change the listing query without re-reading §7's control first.
- Do not "fix" the swallowed `setFields()` errors without a decision-log entry.
- Do not re-derive the five dead hypotheses in `docs/HANDOFF-orphan-bytes-race.md`
  §3, or re-argue B5 from the same facts (`CLAUDE.md`).
- Do not add an automatic database-delete reclaim — decision log §4f says why.
- Do not delete anything in `Guides/` — `tests.html` checks the names.
