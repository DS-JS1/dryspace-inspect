# Handoff — Session B: `held` was written against a folder model that does not exist

**Written:** 22 August 2026, prepared ahead of Session A finishing.
**For:** the session after A. **Read `CLAUDE.md`, `docs/OPEN-ITEMS.md`, then this.**
**Covers:** **OI-12.** **Suggested effort: high.** This is a design decision inside
a protocol with recorded reasons, not a bug with a fix.

> **Line numbers in this brief are as at `ccfed7b`.** Session A edits
> `index.html` and will shift them. Trust the **function names**; treat the
> numbers as a hint.

**No release blocker is open.** This is quality work.

---

## 1. Say the tier first

**Unknown until §2 is settled, and that is deliberate.** The answers range from a
comment change to a change in what `current/` means. Decide after the reading in
§3, say the tier, then edit. `APP_VER` stays `1.4.0`; `CACHE_VERSION` moves if any
app file changes.

---

## 2. The contradiction

Two parts of the app hold incompatible beliefs about **an empty `current/`**.

**`batonState()`** (`index.html:3719`) says an empty `current/` with `BatonHolder`
set means *somebody is working on it* — the `held` state, and the only state in
which an administrator is offered **Force the handover**.

**The handover** says an empty `current/` is an alarm. From the upload, verbatim:

> Upload BEFORE archiving the old one, deliberately. Were this to fail after the
> old file had already been moved, **`current/` would be empty — a state the
> protocol has no procedure for, and which reads as lost data to whoever opens
> the folder.**

And **decision log D39** records the rule underneath that:

> …it keeps the protocol's promise that **`current/` changes only at a deliberate
> handover**.

Follow those two through. If `current/` changes only at a handover, and every
handover *puts a file there* (`putSmall` into `current/`, then the previous file
moves to `archive/`), then after the first handover **`current/` is never empty
again**. So `held` is unreachable — not by accident, but because the folder model
never produces the condition `batonState()` is testing for.

**`held` was written against a folder layout that does not exist.**

### What is actually known, and what is not

**Known.** The one folder observed in `held` — *INS - 22xx - Frinight TestClient* —
got there in run 1 because a tester **moved the file out of `current/` by hand in
SharePoint**. Forced handover then worked correctly from it, on 22 August. The
feature is sound; the route to it is the question.

**Not known.** Whether any ordinary sequence empties `current/`. Nobody has looked
for one, and the reading above is a reading.

**Not observed.** The library/app divergence. Taking over writes
`BatonStatus = In progress` (`takeOverChosen`, around `index.html:4175`) without
moving the file, and `batonState()` returns `waiting` whenever a file is present
without consulting the column — so they *should* disagree after every takeover.
Two screenshots were briefly offered as proof and were twenty-five minutes apart,
which the owner caught. **It has never been seen.**

---

## 3. Do this first — it costs one tap and it decides the session

Hand a record over on a device, then **browse the library in the app and open the
same folder in SharePoint at the same moment**, without touching anything between.

- Both say the same thing → the reading in §2 is wrong somewhere. **Stop and work
  out why before changing anything.**
- App says `WAITING`, column says `In progress` → the divergence is real, and the
  rest of this brief applies.

Then try to reach `held` **without editing SharePoint by hand.** If you find a
sequence, write it down — it changes everything below.

---

## 4. The options, and what each costs

### A · Make the takeover move the file out of `current/`

The intuitive fix, and **it contradicts a recorded decision.** D39 promises
`current/` changes only at a deliberate handover; a takeover is not one. It also
manufactures the empty-`current/` state the handover code calls *"a state the
protocol has no procedure for"*.

Worth separating two cases before dismissing it: an empty `current/` **mid-failure**
is alarming because nobody knows whether data was lost, whereas an empty
`current/` **after a completed takeover** has a clear meaning — somebody has it.
That distinction may be enough to revisit D39. **If you go this way, D39 must be
reopened explicitly in the decision log, not quietly worked around.**

**And the move must happen only after the record is verified on the taking
device.** Moving it first puts a record's only copy in flight.

### B · Make `batonState()` read the column instead of inferring from the file

Probably the better answer, and it is the one I would start from.

`BatonStatus` is written deliberately at both ends (D55) and already carries the
vocabulary — `Waiting`, `In progress`, `Recovered`. Reading it directly makes the
app agree with the library **by construction**, which closes the divergence in the
same change, and needs no alteration to the folder protocol at all.

**Its weakness is real and must be designed for:** column writes are swallowed on
failure by design (`.catch(function(){})`, and that is **OI-3**, still undecided).
So the column can be stale in a way the file's presence cannot. Do not simply swap
one single source of truth for another — consider the column as primary with the
file as corroboration, and **surface a disagreement rather than silently choosing
a winner**. A folder whose column and file disagree is exactly the folder somebody
needs to know about.

### C · Widen the gate so an administrator can force from `waiting` too

Smallest change. It makes the button reachable without touching the model — and it
leaves the contradiction in §2 sitting there for the next person to trip over.
Legitimate as a deliberate, recorded stopgap; poor as a silent one.

### D · Accept it, and document that the state is reached by tidying SharePoint

Honest, and possibly right: forced handover is for when somebody has left or lost
a device, which is rare and already administrative. If this is chosen, the
**`03_Handover Protocol` must say so** — an administrator needs to know that
moving the file out of `current/` is the documented first step.

---

## 5. Do not decide this from the code alone

The baton protocol carries recorded reasons and this session sits on top of
several. **Read these before proposing anything** — they are short:

**Cite these by their words, not their numbers.** The log reuses **D34 and D35
for two different decisions each** — recorded as **OI-15**. Line numbers below are
as at `ccfed7b`.

| Decision | Where |
|---|---|
| *"The record carries a **baton pointer** — the identity and eTag of the `current/` file this device last agreed with"* | log line 134, the **second** D35 |
| *"Two files in `current/` is **refused**, not resolved"* | D37 |
| *"Automatic backup writes to **`wip/`**, never to `current/`"* — and the promise that `current/` changes only at a deliberate handover | D39 |
| *"Recovering a working copy **clears the baton pointer**"* | D42 |
| *"A copy that is no longer the live record must say so, before it is opened"* | D52 |
| *"The folder list must say who holds the record"* | D55 |

The baton-pointer decision matters most for option A: the pointer stores an
**eTag**, and moving a file changes what the next handover compares against. Work
out what a move does to that comparison before choosing it. Note that
`index.html:3378` already cites "D35" meaning this one.

---

## 6. Done means

- **§3's check has been run and written down**, whichever way it came out.
- **A decision-log entry** naming the option chosen and what was rejected —
  including, if option A is chosen, an explicit reopening of D39.
- If the code changed: the change, `CACHE_VERSION` bumped, `CHANGELOG.txt` written
  as the work happened, and **a device run that reaches `held` by the new route.**
  Not a desktop check.
- **OI-12 closed on the register** with what closed it, or re-scoped with what was
  learned.
- `tests.html` at zero failures. It was **557** at the close of 22 August; Session
  A may add to that.

---

## 7. What NOT to do

- **Do not silently work around D39.** Reopen it or respect it.
- **Do not make the app and the library agree by making one of them lie.** They
  disagree because they measure different things; the fix is to decide what the
  question is, not to copy one answer over the other.
- **Do not move a file out of `current/` before the record is verified on the
  device that is taking it.**
- **Do not weaken the forced-handover gate to make a test pass.** It was proved
  working on 22 August; the gate is not the fault.
- **Do not touch `tests.html`'s orphan checks.** They were stabilised on 22 August
  after twenty verification runs — see the changelog.
- Do not push to `main`'s root, and do not tag. The root serves v1.3.0.

---

## 8. State at handover

| | |
|---|---|
| `v1.4` | `ccfed7b` — **Session A will move this** |
| `main` | `0ee925e` — root untouched, **v1.3.0 still live** |
| Beta | `https://ds-js1.github.io/dryspace-inspect/beta/`, build `v1.4.0-30` |
| Tests | 557/557 |
| Tag | none |
| Release blockers | **none** |

Forced handover itself is **proved working** — run on a device on 22 August,
library showed `Recovered` in purple. Whatever is decided here, do not disturb it.
