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

### Output format: PDF only

Guides and outputs are produced as **PDF only**. Other formats are generated
manually if and when a specific need arises.

This removes the dual-format drift that existed previously, where every document
lived as both `.docx` and `.pdf` and updating one without regenerating the other
left two versions of the truth — with the PDF usually being the one staff opened.

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

---

## Planned automation (TODO)

Releases are irregular and months apart. Anything that depends on remembering
detail between sessions will eventually be forgotten, so the goal is to make the
checklist enforce itself rather than be recalled.

**Already automated** — `tests.html` gates on `CACHE_VERSION` matching `APP_VER`,
the field id manifest existing and agreeing, and `CHANGELOG.txt` carrying an
entry for the current version. These fail loudly rather than waiting to be checked.

**Still to build:**

- [ ] **Document freshness check.** Extend `tests.html` to compare the server's
      `Last-Modified` header for each Group B document against `index.html`.
      Any doc older than the code it describes is flagged. Catches "the guide
      still describes the previous version" without anyone having to notice.
- [ ] **Release preflight page.** A single page that runs every gate and prints
      a go / no-go, so releasing is one check rather than a remembered list.
- [ ] **Scheduled reminder.** A recurring prompt to run preflight when a release
      is pending — approved and actioned in one step rather than recalled.
- [ ] **Shared module extraction.** Version stamps, release gates and the media
      sync layer should live in one place once the second PWA exists, so a fix
      lands everywhere rather than being ported by hand.

### Why this matters more than it looks

Additional PWAs are planned (job update / job record, silica exposure worksheet),
eventually to be merged into a single native app. Every process that currently
depends on memory gets multiplied by the number of apps. Automating the release
gates once, now, is what stops that becoming unmanageable later.
