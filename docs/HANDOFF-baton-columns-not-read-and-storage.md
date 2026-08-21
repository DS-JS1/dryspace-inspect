# Handoff — two real faults found by running the baton test

**Written:** 21 August 2026, after run 1 of
`bug tests/OUTSTANDING-baton-status-and-forced-handover.txt` on a real iPhone
against real SharePoint, build `v1.4.0-25`.
**For:** the next session. **Read `CLAUDE.md` and this file.**
**Suggested effort:** high. Fault 1 is diagnosed but not proven; fault 2 is not
diagnosed at all.

---

## 1. Say the tier first

**Fault 1 is an app-code change** — `ds-sharepoint.js`, and therefore
`CACHE_VERSION` in `sw.js`. Decide patch vs minor from `05_Release Protocol` §1
and say it before editing. **`APP_VER` and `CACHE_VERSION` move together** —
`CLAUDE.md` non-negotiable.

Fault 2's scope is unknown until it is diagnosed. Diagnose before you scope it.

**Do not release. Do not push to `main`.** `main`'s root still serves v1.3.0 and
that is correct.

---

## 2. Fault 1 — the app cannot read the library columns back

### What was seen

The library, in the browser, showed for folder `INS - 22xx - Frinight TestClient`:

```
BatonStatus = Waiting  (green)      BatonHolder = Jamie Stone
```

The app, reading the same folder at the same time, showed:

```
Baton: NOT HANDED OVER
"photos uploaded, but the record has never been sent"
```

**Those cannot both be true.** SharePoint has the values; the app is not
receiving them.

### Why it matters

`batonState()` (`index.html:3659`) decides from two things — a file in `current/`,
and `fields.BatonHolder`:

| current/ | BatonHolder | result |
|---|---|---|
| file present | anything | `waiting` → offers **Take it over** |
| empty | **missing** | `none` → offers **Ask for the baton** |
| empty | set | `held` → offers **Ask for the baton** + **Force the handover** |

"Force the handover" is gated on `isAdmin() && b.key === 'held'`
(`index.html:3917`). **If `BatonHolder` never arrives, `held` is never reached,
so "Force the handover" can never be offered to anybody.** That is exactly what
the field test hit, and it explains why this test has never been passed: the
button cannot be reached.

The tester also emptied `current/` by hand, which correctly moved the state from
`waiting` to `none` — so the *file* half of the logic works. Only the column
half is broken.

### The suspected cause — one line

`ds-sharepoint.js:350`:

```js
var sel = '?select=id,name,size,eTag,lastModifiedDateTime,folder,file,webUrl' +
          '&expand=listItem($select=fields)&$top=200';
```

`$select=fields` on an expanded `listItem` **selects** the navigation property; it
does not **expand** it, so Graph returns the `listItem` without a populated
`fields` object. The documented form is `$expand=listItem($expand=fields)`.

`list()` then maps `fields: (it.listItem && it.listItem.fields) || null`
(`ds-sharepoint.js:375`), so every folder comes back with `fields: null`, and
every consumer silently degrades:

| Line | Consumer | Degrades to |
|---|---|---|
| `index.html:3660` | `batonState()` | always `waiting` or `none`, never `held` |
| `index.html:3692` | ask-for-baton text | "whoever has it" instead of a name |
| `index.html:3751` | forced handover's `them` | "an unknown holder" |
| `index.html:3881` | picker `Stage` column | blank |
| `index.html:3909` | ask dialog | "Send undefined a message…" |

**PROVE IT BEFORE FIXING IT.** Do not change the string and ship. Capture the
actual Graph response for a folder known to have `BatonHolder` set and confirm
`fields` is absent. `diagnostics.html` has a request trace; extend it or use the
Graph Explorer with the same query.

**If confirmed, the fix is small but the retest is not** — it must be re-run on a
real device against real SharePoint, because that is the only thing that has ever
caught this class of fault here.

### Related, decide deliberately

`setFields()` failures are swallowed by design — `.catch(function(){})` at
`index.html:3802` (forced handover), `4114` (takeover) and `3265` (handover) so a column problem can never block a handover. That is right. But the
same silence is why this went unnoticed for a whole release cycle. Consider a
visible-but-non-blocking signal. **That is a design decision — put it in the
decision log, do not just do it.**

---

## 3. Fault 2 — storage is not reclaimed. Not diagnosed.

Measured on the tester's iPhone, whole-origin figures:

| When | Storage | Device state |
|---|---|---|
| 10:02pm | 137.5 MB | one test inspection |
| 10:57pm | 147.0 MB | one test inspection, all photos uploaded |
| 11:18pm | **140.5 MB** | **"No inspections yet" — device empty** |

**140.5 MB with nothing on the device.** For comparison, the fault this was
supposed to have fixed reported 139.9 MB. Every media record read
`bytes=MISSING`, so no local photo copies are held.

### Before blaming the sweep — the figure is whole-origin

`navigator.storage.estimate()` (`diagnostics.html:230`, `index.html:2710`) covers
everything under `ds-js1.github.io`, which hosts **the live v1.3 app at the root
and the beta together**. Some of that 140 MB may be v1.3's data or either app's
service-worker cache. **Attribute it before fixing it.**

### The tooling cannot answer this

`diagnostics.html` reads **only the `media` store** (`:251`, `:486`). It never
reads `bytes` or `inspections`, so it cannot say where the space went. **Extend
the diagnostics page first** — a per-store row count and byte total, plus what
`caches.keys()` holds. That is a safe, test-only change and it is the fastest
route to an answer.

### One concrete lead

The media store held **six** records — `IMG_9610`, `9615`, `9616`, `9617`,
`9644`, `9668` — on a device carrying a single two-photo inspection. So media
records appear to outlive the inspections they belong to. `sweepOrphanBytes()`
reclaims bytes whose **media** record is gone; **nothing** appears to reclaim
media records whose **inspection** is gone. Check the delete-inspection path
calls `forgetMedia()` for every child. Those records are small, so this is
probably not the 140 MB on its own — but it is a real leak and it is a lead.

### The connection worth holding in mind

The unit test that keeps failing is *the one that covers exactly this* —
"bytes already orphaned are swept up" (`docs/HANDOFF-orphan-bytes-race.md`).
That was concluded to be a test-harness race, and on the evidence available that
conclusion was sound: `sweepOrphanBytes()` called by hand reclaims correctly.
**Do not treat the field symptom as proof the unit test was right all along, or
the reverse.** They may be independent. Establish where the 140 MB is first.

---

## 4. What passed, so it is not re-tested

Run 1, on a real device against real SharePoint:

- **Steps 1–4 PASS** — upload, handover (`Waiting` green, holder written),
  takeover (`In progress` amber), browse, VIEW ONLY banner, thumbnails.
- **Julie and Mike's permission question is ANSWERED — yes.**
  *Contribute - No Delete* permits the archive move; `archive/` held 11 files.
  **Closed.** Remove it from `CLAUDE.md` when the rest is done.
- Grey "Not handed over" on `photos/`, `wip/`, `current/`, `archive/` is
  **correct** — only the top-level folder carries the baton.

Full results are appended to
`bug tests/OUTSTANDING-baton-status-and-forced-handover.txt`.

---

## 5. Order of work

1. **Prove or kill Fault 1** by capturing the real Graph response. One line if
   confirmed, then a real-device retest of steps 4 and 5.
2. **Extend `diagnostics.html`** to report per-store sizes and cache keys.
   Test-only, no app change.
3. **Diagnose Fault 2** with those numbers. Only then decide the fix and tier.
4. The orphan-bytes test race — `docs/HANDOFF-orphan-bytes-race.md`.
5. Re-run the whole baton test end to end.

**Ideally with a second person** for at least one handover. Every run so far has
had one person as both administrator and holder, which is not what the feature is
for and is part of why this went unnoticed.

---

## 6. What NOT to do

- Do not push to `main`, and do not tag.
- Do not change the Graph query without capturing the response first.
- Do not "fix" the swallowed `setFields()` errors without a decision-log entry.
- Do not delete anything in `Guides/` — `tests.html` checks the names.
- Do not re-derive the five dead hypotheses in
  `docs/HANDOFF-orphan-bytes-race.md` §3.
