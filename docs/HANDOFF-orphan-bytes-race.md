# Handoff — the orphan-bytes race in `tests.html`

**Written:** 21 August 2026, at the close of Batch D.
**For:** the next session. Read this and `CLAUDE.md`; you do not need the Batch A–D
handoffs.
**Model:** Opus, normal effort. Small edit, large verification.

---

## 1. Say the tier first

**This is a patch-tier, test-only change.** Say so in your first reply before
editing anything — `CLAUDE.md` requires it.

`APP_VER` stays `1.4.0`. `CACHE_VERSION` stays `ds-inspect-v1.4.0-25`.
`VER_DATE` does not move. **You are editing `tests.html` and nothing else.** If
you find yourself in `index.html`, `ds-*.js` or `sw.js`, stop — see §6, because
there is a tempting app-side change here that is *not* yours.

---

## 2. The problem

One assertion fails intermittently:

```
FAIL  the orphan is reclaimed
      bytes with no record behind them survived the sweep
```

It lives in *bytes already orphaned are swept up, and live ones are left alone*,
`tests.html` **lines 1432–1468**; the failing assertion is at **line 1462**.

**This has now cried wolf twice**, and that is the actual damage. A suite that
reports 549/550 as normal is a suite whose next genuine byte-sweep regression
gets waved through. **The release is gated on fixing it** — decided 21 August
2026, in preference to shipping with it documented as known.

### Measured rate, Batch D, eight runs over HTTP

| Runs | Result |
|---|---|
| 1 — before any edit that session | **FAIL** 1 of 550 |
| 2–4 | pass 550/0 |
| 5–8 — after heavy local PDF rendering | **FAIL** 1 of 550, four consecutive |
| run 7 was from a **cleared store** | still failed |

Failures cluster when the machine is busy. **A clean run is not evidence.** At
the close of Batch C, eight consecutive runs passed and it failed on the first
run of the next session.

### History — do not restart this from scratch

The test originally asserted the **count** `sweepOrphanBytes()` returned, which
is global state. It was rewritten on 21 August (`1088070`, test-only) to assert
the **outcome per key**. That was a genuine improvement — it halved the failure
from two assertions to one, and it tests that the sweep is *selective* rather
than merely destructive, which counting never did. **It did not remove the
race**, because both sweeps still act on the same key in the same store.

---

## 3. What is already disproved. Do not re-derive these.

Five hypotheses are dead. Three were killed in Batch C, two in Batch D, all by
testing them rather than reasoning about them.

| # | Hypothesis | How it died |
|---|---|---|
| 1 | A stale service worker serving old code | Batch C — failed again with none controlling the page |
| 2 | Leftover data in the `bytes` store | Batch C — passed again with that residue seeded on purpose |
| 3 | The app's sweep is broken | Batch C **and** Batch D — `sweepOrphanBytes()` called by hand on a *failing* page reclaims the exact record: `before ['__orphan-swept__'] → reclaimed 1 → after []` |
| 4 | `sweepOrphanBytes()` swallowed a storage-deadline error and returned 0 | Batch D — its `catch` logs *"Could not sweep orphaned bytes"*. **That warning appeared on no failing run.** The sweep completed normally and genuinely found nothing to delete |
| 5 | `putBytes()` resolves before its transaction commits, so the sweep reads a store that does not yet contain the orphan | Batch D — `tx()` (`index.html:1740`) resolves on `t.oncomplete`, not `onsuccess`. The write is committed |

Hypothesis 4 is worth dwelling on: it is the most plausible-sounding of the five
and it is **wrong**. The console is what killed it. Check the console before
believing any theory you form here.

---

## 4. The prime suspect, unproven

`loadApp()` — `tests.html:138–160`, the wait itself at **line 151** — resolves
**120 milliseconds** after the iframe's `onload`:

```js
f.onload = function(){
  setTimeout(function(){ ... res(w); }, 120);
};
```

Its comment justifies the wait by naming three *synchronous* functions
(`assignKeys`, `numberFields`, `buildCompletion`). That reasoning is sound for
those three and **does not cover the app's asynchronous boot chain**, which is
still in flight when the tests start. From `index.html:4962`:

```js
migrateMediaBytes()
  .then(function(moved){ ... return sweepOrphanBytes(); })
  .then(function(freed){ ... return recoverInterruptedUploads(); })
  .then(function(n){ ... initSync(); renderHome(); });
```

That is three chained IndexedDB round-trips, and **the second link calls
`sweepOrphanBytes()` itself.** Under load it comfortably outlasts 120 ms.

Meanwhile `later()` (`tests.html:97`) pushes an **already-executing** promise —
the IIFE body at the call site runs immediately, during `run(W)`. So the orphan
test's writes and its sweep interleave with the app's boot sweep, with no
ordering guarantee at all.

**Corroborating evidence:** on failing runs the app logs
`Reclaimed bytes for 1 deleted file(s)` — the boot sweep acting on the test's
key, late.

**Also worth checking, and not checked:** the console shows several `Migration:`
lines per run. That may be one boot migrating several records, or it may mean
**more than one app instance is alive** — `tests.html` redirects itself to
`?cleared=1&r=…` (`tests.html:3055`), so there is a pre-redirect load. If two
instances overlap, one's write can land after the other's sweep. Confirm or kill
this early; it is cheap and it would explain everything.

---

## 5. What to do

Two changes, both in `tests.html`:

1. **Sequence the orphan tests after boot.** Do not add a bigger `setTimeout` —
   that is the same bug with a longer fuse. Wait on a real signal. Options, best
   first:
   - Poll from the test page until the app's boot chain has demonstrably settled
     (for example until `initSync` has run, or until two successive `dbAll`
     snapshots agree), then start the orphan tests.
   - Move the two orphan checks out of `later()` and into the sequential tail
     after `Promise.all(PENDING)` (`tests.html:3065`), where nothing else is in
     flight.
2. **Give them their own key namespace**, so a foreign sweep can neither satisfy
   nor defeat the assertion, and so a failing run cannot leave residue that
   changes the next run's starting conditions.

While you are there: a failing run currently leaves `__orphan-swept__` in the
store. **Clean up on both paths**, pass and fail.

---

## 6. The app-side change that is NOT yours

`sweepOrphanBytes()` (`index.html:4572`) ends:

```js
}).catch(function(e){
  console.warn('Could not sweep orphaned bytes', e);
  return 0;
});
```

A storage failure and "there was nothing to sweep" both return `0`. On a real
device that means orphaned bytes are silently never reclaimed. **That is a real
observation and it is not this batch's job** — it did not cause this failure
(§3, hypothesis 4), the tier here is test-only, and changing it means an app
file, a `CACHE_VERSION` bump and a different conversation. Record it, raise it,
leave it.

---

## 7. Done means

**Not "it passes now."** That claim has been made twice and been wrong twice.

- **20 consecutive runs at 550/550**, served over HTTP.
- **At least five from a cleared store** — delete the `ds-inspections` database
  between runs.
- **At least five under deliberate load.** This is the condition that reproduces
  it; a quiet machine proves nothing. Batch D's four consecutive failures came
  directly after heavy local PDF rendering.
- **The run count and the conditions written into `CHANGELOG.txt`**, so the next
  person can weigh the evidence instead of trusting a sentence.

If you cannot reach 20 clean, say so plainly and hand on what you learned. That
is a better outcome than a third "fixed" that is not.

---

## 8. Testing setup

Server config is `.claude\launch.json` **in the session working directory, not
the project folder** — `dryspace-inspect` on port 8765, and
`dryspace-inspect-isolated` on 8799 serving the same folder, which exists so the
suite can run on an origin the app has never been served from.

`CLAUDE.md` warns the service worker serves cache-first and has twice caused the
suite to grade stale code. `tests.html` already loads the app as
`index.html?nosw=1`; use `?nosw=1` for anything you open by hand.

---

## 9. What NOT to do

- Do not push, and do not tag. `main`'s root is the release and it still serves
  v1.3.0.
- Do not bump `APP_VER`, `CACHE_VERSION` or `VER_DATE`.
- Do not touch `index.html`, `ds-media-sync.js`, `ds-sharepoint.js`,
  `ds-auth.js` or `sw.js` — including the `catch` in §6.
- Do not delete or rename anything in `Guides/` — `tests.html` checks the names.
- Do not weaken or delete the assertion to make the suite green. The assertion is
  correct; the harness around it is not.
- Do not re-derive anything in §3.

---

## 10. What else is outstanding

Neither of these is yours, and both outrank this one in consequence:

- **`bug tests/OUTSTANDING-baton-status-and-forced-handover.txt`** — the baton
  status columns and forced handover have never been exercised against real
  SharePoint. This is the one that matters.
- **Julie and Mike's *Contribute - No Delete* permission test** — confirm the
  archive move is permitted. v1.4 moves a file at every handover.

The documentation set is complete as of Batch D (`8989eaf`), so `CLAUDE.md`'s
"do not let this reach a field device before that document set exists" is
satisfied.
