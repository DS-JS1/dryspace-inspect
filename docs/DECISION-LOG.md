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
| **1.3.0** | in development | Photos upload to SharePoint with verification; Microsoft sign-in; update detection; automated test suite; media keyed by `data-mfid`; unified inspection folder. | Not yet |

### Why 1.2.0 and 1.2.1 were never deployed

Both were completed in the working folder and never pushed. The photo-persistence
problem made the app unusable in practice, so work moved straight on to v1.3
rather than shipping an intermediate version that still had the blocking fault.

**Consequence to remember:** every device in the field is on **1.1.1**. When v1.3
ships, records migrate 1→2→3→4 in a single pass, in the field. That migration is
covered by the test suite against the real v1.1.1 build.

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

### Move the shared documents up a level

**Trigger: starting the second app** (progress inspections, completion reports,
competency assessments, or equipment damage).

`docs/FIELD-APP-TEMPLATE.md` and `04_Project Context Brief.md` describe how
Dryspace builds **any** field app, and the business and trade behind them. Neither
is about the Site Inspection App, yet both live inside its folder.

**The risk is concrete:** when v1.4 ships and v1.3 goes to Superseded, the
specification for four unbuilt apps goes with it.

**Intended shape:**

```
00_AI Tools in Development/
    _Shared/                            ← applies to every app; its own repository
        Field App Architecture Template.md
        Dryspace Context Brief.md
    01_Contact to Contract/
        Dryspace Inspection App v1.3/   ← this app only
```

Above `01_Contact to Contract`, because the template reaches beyond that phase —
the equipment damage app is not Contact-to-Contract at all.

**Why not now.** Moving breaks cross-references in `CLAUDE.md` and
`02_Iteration Guide.md`, and takes both documents out of version control — and the
template is the document most likely to be revised as siblings are built, so
losing its history costs most. Set `_Shared` up as its own small repository at the
same time. Today it buys nothing; at app number two it costs the same and the
benefit is real.

---

## 5. Open questions

| Question | Blocking | Notes |
|---|---|---|
| ~~Admin consent for the Entra app~~ | **Resolved 17 Aug 2026** | Granted tenant-wide. Note for sibling apps: each new app registration needs its own consent, and it requires a tenant administrator. |
| **Does iOS preserve EXIF GPS through the Safari file picker?** | No | Decides whether the Google Photos Maps plan is achievable. Needs a real device test. |
| Should the app be **publicly reachable**? | No | Currently public on GitHub Pages. Cloudflare Access with one-time PIN would make it staff-only, free, and matches the mental model. Decide before wider rollout. |
| **Google Photos as secondary backup** | No | Scheduled server-side sync reading from SharePoint. No first-party Power Automate connector exists, so it needs a custom connector or script. |
| **Analytics across records** | No | Cross-job querying needs a structured database downstream. The apps produce the data; they do not provide the querying. A SharePoint List, one item per inspection, is the agreed destination — see the Handover Protocol §10. |
| ~~Who holds Global Administrator~~ | **Resolved 17 Aug 2026** | Now held internally. Worth reviewing periodically — a tenant whose only administrator is unreachable is a business risk well beyond this project. |
