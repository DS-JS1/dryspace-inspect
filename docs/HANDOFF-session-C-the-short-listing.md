# Handoff — Session C: `dbAll()` can come back short, and nobody knows why

**Written:** 22 August 2026, after Sessions A and B.
**For:** a clean session. **Read `CLAUDE.md`, `docs/OPEN-ITEMS.md`, then this.**
**Covers:** **OI-9.** **Suggested effort: high — and timeboxed.** See §6, which
matters more here than in any other brief in this folder.

**No release blocker is open.** This is the deepest open item, not the most
urgent one.

---

## 1. Say the tier first

**Unknown until §3 has been attempted, and that is honest rather than evasive.**
The outcome ranges from *no code change and a recorded decision* to *a change in
the storage layer every read goes through*. Attempt the reproduction first, then
say the tier.

`APP_VER` stays `1.4.0` — v1.4.0 is still unreleased. `CACHE_VERSION` moves only
if an app file changes; it is `ds-inspect-v1.4.0-32` as at this writing.

---

## 2. What was seen, and it is not in dispute

On 22 August 2026, on Chromium under sustained CPU load, **`dbAll()` returned an
empty array from a store that was not empty.** Captured within milliseconds of
each other, on a `bytes` store holding two records:

| Read | Result |
|---|---|
| `dbAll('media')`, `dbAll('bytes')` — the app's cached connection | `[]`, `[]` |
| `dbGet` on all three written keys | every one **found** |
| A freshly opened connection, `count()` on `bytes` | **2** |
| Same fresh connection, `getAllKeys()` | the exact two keys |

**The point lookups were right. The bulk listing was wrong.** `dbAll()` does not
silently swallow errors to produce this — it rejects on error, abort and
deadline (`dbRequest`, `index.html:1770` region), and `getAll()` genuinely
resolved with an empty array.

This is what had been failing the orphan-bytes assertion roughly five runs in
eight since Batch C. Three earlier investigations blamed a stale service worker,
leftover store data and a harness ordering race. **All three were disproved, and
none of them was it.**

Full write-up: **decision log §4g** (`docs/DECISION-LOG.md:900`).

---

## 3. Do this first — reproduce it, or fail to

Everything downstream depends on whether it still reproduces.

The method that worked, and it took two attempts to find:

1. **Load the machine properly.** A quiet machine will not do it. What worked was
   19 CPU workers hashing in a loop for the duration — the failures clustered
   under load and vanished without it.
2. **Drive `tests.html` in a loop**, reloading between runs, and capture the state
   at the moment of failure. A temporary auto-loop harness was used and removed
   before commit; the changelog entry for 22 August describes it, and rebuilding
   it is a few lines.
3. **Capture, at the instant of failure**, all of: `dbAll` on both stores, `dbGet`
   on the same keys, and a **freshly opened connection** doing `count()` and
   `getAllKeys()`.

**The orphan-bytes assertion is no longer the way in.** It was stabilised on 22
August — the checks moved out of `later()` into `orphanChecks()`, sequenced after
the boot chain drains — and it now passes 20 runs from 20. **Do not un-stabilise
it to get your reproduction back.** Write a separate probe.

### The observer effect, which is the whole difficulty

**It disappears when instrumented.** Adding one extra `indexedDB.open` before the
read was enough to mask it completely — three clean runs under the same load that
had just produced five failures in eight.

So the more carefully you watch, the less there is to see. Plan for that: prefer
probes that do **not** open connections, capture into memory and report
afterwards, and treat a clean run under instrumentation as **no evidence either
way** rather than as a pass.

---

## 4. What is already known — do not re-derive

| Fact | How it is known |
|---|---|
| `dbAll()` does not fabricate `[]` from an error | It rejects on error, abort and deadline; the empty array came from `getAll()` resolving |
| The data was really there | A fresh connection counted it by key at the same moment |
| Point reads stayed correct throughout | `dbGet` found every record the listing could not |
| It needs load | Clustered under 19 workers; absent on a quiet machine |
| It hides from instrumentation | One extra connection before the read masked it entirely |
| It is not the service worker, not leftover data, not harness ordering | Each proposed and disproved in Batches C and D — `docs/HANDOFF-orphan-bytes-race.md` §3 |

**`openDB()` has no in-flight deduplication** — concurrent calls while `_db` is
null each fire their own `indexedDB.open`. That was noticed on 22 August and
**never followed up**. It is the most obvious untested lead and it is cheap:
five concurrent `dbAll`/`dbGet` calls can open five separate connections. Whether
that has anything to do with it is unknown.

---

## 5. Why it still matters, given the sweep is guarded

`sweepOrphanBytes()` (`index.html:4991`) no longer trusts a listing: it treats it
as producing **candidates** and confirms each with a point `dbGet('media', mid)`
before deleting. **The data-loss path is closed** — a short listing there now
means *nothing gets swept*, which is safe.

**Every other caller still trusts it**, and there are around fifteen. The ones
that matter:

| Caller | What a short listing does |
|---|---|
| `renderHome()` (~`2732`) | inspections silently missing from the home screen |
| the storage note (~`2818`) | under-reports what the device holds |
| `migrateMediaBytes()` (~`5268`) | **migrates nothing and reports success** |
| `recoverInterruptedUploads()` | a stranded upload is not recovered |
| `pendingUploads()` / the queue (~`4886`) | the queue believes there is nothing to send |

`migrateMediaBytes()` is the one to think hardest about: it runs on the v1.3 → v1.4
upgrade, and a silent no-op there is exactly the kind of failure this project
exists to prevent. That connection is live — see **OI-10** and **OI-16** on the
register.

---

## 6. Timebox this, and say so in your first reply

**Set a limit before you start and tell the owner what it is.** This item has
already consumed three investigations across two batches, all of which produced
confident wrong answers. The failure mode here is not missing the cause; it is
**finding a plausible one and believing it.**

**"Not solved, here is what was ruled out" is a good outcome** and the register's
exit criterion allows for it explicitly. What is *not* acceptable is a fourth
confident diagnosis that has not survived a reproduction under load.

Any candidate cause must be tested by **making the fault appear and disappear on
demand**, not by reasoning that it fits.

---

## 7. Done means

Either:

- **The cause is identified and handled at the storage layer**, so every caller
  benefits rather than each being patched — with the fault demonstrated appearing
  and disappearing under the fix; **or**
- **A recorded decision** that the sweep guard is sufficient and the remaining
  callers can tolerate a short listing, naming each caller in §5 and why it is
  survivable; **or**
- **A written account of what was ruled out**, with the reproduction method, so
  the fourth attempt starts ahead of this one.

In every case: `tests.html` at zero failures — **620** as at this writing — and
`CHANGELOG.txt` written as the work happens.

---

## 8. What NOT to do

- **Do not un-stabilise the orphan-bytes checks** to recover a reproduction. They
  cost 20 verification runs to settle.
- **Do not patch callers one at a time** as a substitute for understanding. If the
  decision is that callers must defend themselves, that is a decision to record,
  not fifteen quiet edits.
- **Do not weaken `sweepOrphanBytes()`'s per-key guard.** It is the reason a short
  listing is currently harmless there.
- **Do not treat a clean instrumented run as evidence.** See §3.
- **Do not chase this on a quiet machine** and conclude it is gone.
- Do not push to `main`'s root, and do not tag. The root serves v1.3.0.

---

## 9. State at handover

| | |
|---|---|
| `v1.4` | `52c82ca` — **one commit ahead of `origin/v1.4`, unpushed** (see below) |
| `main` | `cc9b6ab` — root untouched since 21 Aug, **v1.3.0 still live** |
| Build | `ds-inspect-v1.4.0-32`, `APP_VER` 1.4.0, `VER_DATE` still 18 August 2026 |
| Tests | **620/620** |
| Tag | none |
| Release blockers | **none** |

> **Unpushed work.** `52c82ca` — *"OI-12: custody comes from the column, not from
> the file (D60)"* — is on the local `v1.4` and not on the remote. It is Session
> B's main outcome. **Confirm with the owner before pushing it**; it is not this
> session's to assume.

`diagnostics.html` changed materially in the meantime (**OI-17**): `checkBlobs()`
now goes through `bytesFor()` and the state panels read the `bytes` store and
label the source. If you use the page as an instrument, read that item first —
it was reporting total data loss on a healthy device until it was fixed.
