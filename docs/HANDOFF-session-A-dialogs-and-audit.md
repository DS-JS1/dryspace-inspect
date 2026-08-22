# Handoff — Session A: the dialogs staff cannot read, and the trail nobody can see

**Written:** 22 August 2026, at the close of the baton-test session.
**For:** the next session. **Read `CLAUDE.md`, `docs/OPEN-ITEMS.md`, then this.**
**Covers:** **OI-13** and **OI-14**. **Suggested effort: medium.** The thinking is
done and written down; the risk here is discipline, not reasoning.

**No release blocker is open.** OI-1, OI-2 and OI-11 closed on 22 August. This
session is quality, not gating — but see §2, because one of these is worse than it
was reported and worse than it looks.

---

## 1. Say the tier first

**My read: this pair is MINOR.** OI-13 alone is a patch — a message that was
always meant to be readable is not readable. OI-14 adds a way to see something the
app already records, which is a new capability, and that is minor by
`05_Release Protocol` §1.

**`APP_VER` stays `1.4.0`.** v1.4.0 has never been released, so this folds into it
rather than becoming 1.4.1, and **no new version folder is needed** — the folder is
already `v1.4`. **`CACHE_VERSION` must move** (currently `ds-inspect-v1.4.0-30`),
because `index.html` changes.

**Say the tier in your first reply before editing anything.** Disagree with my read
if you have grounds — just say so and why.

**Already checked, so you need not:** no staff document quotes the dialog wording
in a way that this changes. `Training/Training_Module.html:293` asks *"When do you
delete your copy from your device?"* — the training teaches the very instruction
the app is failing to show, which is corroboration, not a document to update.

---

## 2. OI-13 — iOS truncates the native dialogs

### It was reported as bold text. It is worse than that.

The owner's screenshot of the handover confirmation (`index.html:3349`) ends
**mid-sentence**:

> Tell the next person, with a link to the folder. Delete your copy from

The rest — *"…this device once they confirm they have it"* — is not shown, cannot
be scrolled to, and is the one instruction that stops two people holding the same
record.

### And the fork warning is worse than the handover message

**Start here, not with the handover.** `importRecord()` at `index.html:4251` builds:

```
This inspection already exists on this device.
<name>
<date · editedBy>
WARNING — the copy already on this device is NEWER than the file you are
importing. Replacing it will lose the more recent work.
OK = replace with the imported copy
Cancel = show other options
```

**The last line is what the buttons mean**, and it is last, so it is what gets
cut. A native `confirm()` offers only *OK* and *Cancel*: with that line gone the
reader has no way to know that **Cancel leads to more options rather than
abandoning the import**, and no warning that OK may overwrite newer work.

The follow-up at `index.html:4265` has the same shape — *"OK = keep both (creates a
fork) / Cancel = cancel this import"* is the final line of a longer message.

**So the fault is not only lost guidance. It is lost button semantics on a
destructive choice**, on the exact path this project cares most about.

### The inventory

**40** `alert()` / `confirm()` calls remain in `index.html`, alongside the custom
box (`showDialog` → `pickFromList`, `index.html:3578`). The app has spoken two
visual languages since v1.2; `docs/HANDOFF-v1.4-polish.md` §6 named it and it was
never actioned.

**Convert in this order.** The test is *"is this multi-line, and does the last line
carry meaning?"*

| Line | Dialog | Why it is on the list |
|---|---|---|
| `4251`, `4265` | the fork warning, both halves | button semantics lost on a destructive choice |
| `3349` | handover confirmation | proven truncating; loses "delete your copy" |
| `3211` | `confirmFiling` — the filing gate at handover | multi-line, on the handover path |
| `3543` | recovered work in progress | long, and only ever read once |
| `3786` | ask for the baton | the whole message is the point |
| `2656` | delete from this device | *"This cannot be undone"* is in it |
| `3358` | handover failed | carries the recovery instruction |

### The trap that makes this invisible

**A desktop browser does not truncate.** Neither does the test suite. This fault
can only be seen on a phone, which is why it survived a polish pass that named it.

---

## 3. OI-14 — the audit trail is recorded and cannot be read

`logAudit()` (`index.html:2072`) records everything: created, stage changed, marked
complete, handed over, and — as of 22 August — *"Handover forced by X, recovered
from Y (archive)"*.

**Nothing displays the entries.** `index.html:2095` shows a **count** in the record's
status bar — *"7 logged changes"* — and `index.html:2924` puts the full
`auditTrail` into the exported JSON. Reading it means downloading a backup and
opening a file.

It matters most for the action just proved on a device. A forced handover is taken
over somebody's head; *"who took this, when, and from where"* is the first
question anyone asks, and the app's answer is a number.

### Why these two belong in one session

**OI-14's fix is a natural consumer of OI-13's.** `showDialog` already accepts
`lines: [{k, v}]` and `pickFromList` already has a filter box. Making the *"N
logged changes"* text tappable, opening the entries in the same custom box, closes
OI-14 using exactly the component OI-13 standardises on. Do OI-13 first and OI-14
costs very little.

That is a suggestion, not a prescription. If the trail is long enough that a
chooser reads badly, say so and do something better.

---

## 4. Done means

- **The dialogs in §2's table display in full on an iPhone.** Verified on the
  device, with a screenshot of the fork warning showing its last line. **A desktop
  check proves nothing here** and must not be offered as evidence.
- **Nothing on the capture path was converted without a device test.** See §5.
- **The audit entries are readable on the device without exporting anything** — or
  a decision-log entry saying the count plus the library column is enough, and why.
- `tests.html` passes with zero failures, served over HTTP. It was **557** at the
  close of this session; expect that or more.
- `CACHE_VERSION` bumped, `CHANGELOG.txt` written as the work happens, and
  `docs/OPEN-ITEMS.md` updated — OI-13 and OI-14 moved to the closed table with
  what closed them.

---

## 5. What NOT to do

- **Do not convert a dialog on the capture path without testing it on a phone.**
  `2484` (saving files), `2525` (removing a photo) and `3066`–`3086` (sharing
  files) sit next to photographs. **A custom modal that fails to close is worse
  than an ugly native one that cannot.** Capture is never blocked — that is a
  non-negotiable in `CLAUDE.md`.
- **Do not convert all 40.** The short, single-line ones — *"Sign in to Microsoft
  first"* at `1678`, `3493`, `3908`, `4006` — lose nothing as native dialogs and
  changing them is churn that has to be re-tested for no gain.
- **Do not push to `main`'s root, and do not tag.** The root serves v1.3.0 and
  that is correct. Refreshing `/beta/` is the normal way to get a build onto a
  phone and does not release anything.
- **Do not bump `APP_VER`** — see §1.
- Do not delete or rename anything in `Guides/` — `tests.html` checks the names.
- Do not touch `docs/OPEN-ITEMS.md`'s format without reading why `tests.html`
  polices it.

---

## 6. Working notes

- **Serve over HTTP and open `tests.html`.** `.claude/launch.json` has
  `dryspace-inspect` on port 8765.
- **The service worker serves cache-first.** Load `index.html?nosw=1` for a
  guaranteed fresh copy. It has twice caused the suite to grade stale code.
- **Getting a build onto the phone:** refresh `/beta/` on `main` — that is
  `beta/index.html`, `beta/sw.js` and friends, root untouched. The last eight
  commits on `main` are all that shape.
- **`diagnostics.html` §8c** clears a leftover database if the phone gets into a
  strange state.
- Australian English throughout.

---

## 7. State at handover

| | |
|---|---|
| `v1.4` | `37c0865` |
| `main` | `0ee925e` — root untouched all session, **v1.3.0 still live** |
| Beta | `https://ds-js1.github.io/dryspace-inspect/beta/`, build `v1.4.0-30` |
| Tests | 557/557 |
| Tag | none |
| Release blockers | **none** |

**Next after this: Session B — OI-12**, a design decision about whether taking over
should move the file out of `current/`. High effort, and not this session's job.
