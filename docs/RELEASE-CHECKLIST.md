# Release Checklist

Run through this for every released version. The point is that nothing here
depends on remembering — if a step matters, it is written down or automated.

**Not everything waits until the end.** Docs split into two groups by trigger:
those that record *what changed* are written as the change is made, while those
that describe *how the app behaves* can only be finalised once behaviour is
settled. Writing the second group early guarantees rework.

---

## Group A — maintained during development

Updated as each batch lands, not at release. If these drift, the release notes
get reconstructed from memory, which is how detail gets lost.

| Document | Trigger |
|---|---|
| `CHANGELOG.txt` | Every user-visible change, as it is made |
| `docs/v1.3-photo-architecture-plan.md` | Decisions, findings, session notes |
| `02_Claude Iteration Guide` | Only if the build process itself changes |

---

## Group B — updated after testing, before release to staff

These describe behaviour. Finalise them once behaviour is frozen and the release
is approved — but draft notes as you go so this is editing, not authoring.

| Document | Update when |
|---|---|
| `01_Setup and User Guide` | Any change to what staff tap, see, or do |
| `03_Handover and Version Control Protocol` | Any change to export, import or handover |
| `04_Project Context Brief` | Version numbers, feature list, technical summary |
| `Training/` — flowchart, quick card, training module | Any change to the handover flow |

### The .docx / .pdf drift hazard

Every document exists as **both** `.docx` and `.pdf`. Updating one without
regenerating the other leaves two versions of the truth, and the PDF is usually
the one staff actually open. Git cannot help here — both are binary and cannot
be diffed.

**Rule: regenerate the PDF in the same sitting as the DOCX edit, never later.**

---

## Version stamps — all must agree

A mismatch here is silent. The app keeps serving stale cached code and nobody
finds out until a staff member reports a bug that was fixed weeks ago.

| Location | Field |
|---|---|
| `index.html` | `APP_VER` |
| `index.html` | `FORM_VER` |
| `index.html` | `VER_DATE` |
| `sw.js` | `CACHE_VERSION` — must change or devices keep the old app |
| Project folder name | Must match `APP_VER` (required by the Iteration Guide) |
| `field_ids_v*.json` | Filename carries the version |

> **Proposed:** add an assertion to `tests.html` that `CACHE_VERSION` contains
> `APP_VER`. A forgotten cache bump is the highest-consequence, easiest-to-miss
> mistake in this list, and it is trivially checkable.

---

## Release sequence

1. [ ] All logic tests pass — open `tests.html` over HTTP, expect zero failures
2. [ ] Migration rehearsed against a **real** v1.1.1 record exported from a staff
       device, not just the synthetic fixture
3. [ ] Version stamps all agree (table above)
4. [ ] Group B documents updated, DOCX and PDF both regenerated
5. [ ] Commit and tag the release
6. [ ] Deploy — push to the host
7. [ ] Confirm the live version actually changed (check `APP_VER` in the served
       file, not just that the push succeeded)
8. [ ] Staff told to close and reopen the installed app to pick up the update
9. [ ] Copy the released folder to SharePoint as the archived snapshot

### Step 7 is not optional

v1.2.0 and v1.2.1 were both completed and never deployed. Nobody noticed for
two versions because nothing ever checked that live matched intent. Verifying
the served file is what closes that gap.

---

## Per-batch documentation impact

Filled in as each batch lands, so the release list is accurate rather than
reconstructed.

| Batch | Docs affected |
|---|---|
| 0 — Safety net | Plan (session notes). No staff-facing change |
| 1 — Media identity | *TBC* |
| 2 — Auth & upload | Setup Guide, Handover Protocol, Training — expect significant change: staff sign-in is new behaviour |
| 3 — Handover integrity | Handover Protocol, Training flowchart and quick card |
| 4 — Cleanups | *TBC* |
