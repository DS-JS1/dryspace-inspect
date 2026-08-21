# Handoff — Batch D: the `Guides/` PDFs, the quick cards, and `05_Release Protocol`

**Written:** 21 August 2026, at the end of Batch C.
**For:** the next session. Read this file before anything else except `CLAUDE.md`.
**Model:** Opus, normal effort. Batch D is the smallest of the four batches but it
is the one that produces the files staff are handed. A PDF that is regenerated
from the wrong source, or not regenerated at all, is invisible until somebody is
holding it on site.

---

## 1. Say the tier first

**This is a patch-tier, documentation-only change.** Say so in your first reply,
before touching anything — `CLAUDE.md` requires it, and it is how the owner knows
this file was loaded.

`APP_VER` stays `1.4.0`. `CACHE_VERSION` stays `ds-inspect-v1.4.0-25`. **No app
file is touched.** If you find yourself editing `index.html`, `ds-*.js`, `sw.js`
or `tests.html`, stop — different job, different tier.

Batch D *generates* files. That is not the same as editing code, and it does not
change the tier.

---

## 2. What is done, and what is left

| | |
|---|---|
| **Batch A — DONE** | `03_Handover and Version Control Protocol` (`b7cd864`) |
| **Batch B — DONE** | `01_Setup and User Guide`, `02_Iteration Guide` (`980276f`) |
| **Batch C — DONE** | `_Shared/Dryspace Context Brief.md`, the whole `Training/` set, and a new deck built from scratch |
| **Batch D — YOURS** | Regenerate `Guides/` and the two quick cards; export the chart and the deck; fix `05_Release Protocol` |

**The markdown has settled.** That was the reason PDFs were held back to last, and
it no longer applies. Nothing in Batches A–C is expected to change again.

---

## 2a. State you are starting from

**Both repositories are committed and pushed** as of 21 August 2026. The app repo
is at `d989308` on `v1.4`, matching `origin/v1.4`; `_Shared` is clean and in sync
on `main`. Batches A, B and C are all in. You start from a clean tree.

> **One test-only change landed after Batch C closed.** The orphan-bytes test
> was flaky — it asserted the *count* `sweepOrphanBytes()` returned, which any
> other sweeper could take to zero first. It now asserts the outcome per key.
> **If you see a failure in the byte-sweep tests, it is real** — the known
> flakiness is gone, and confirmed over three consecutive clean runs. Do not
> write a failure off as the known one.

### Superseded: the dirty-tree warning

### Superseded detail

Verified 21 August 2026, at the close of Batch C:

| Repository | State |
|---|---|
| App repo (`v1.4`) | **10 files uncommitted** — Batch C's Training set, the new deck, CHANGELOG, decision log, this handoff. `origin/v1.4` is at `980276f`, which is Batch B |
| `_Shared` (`main`) | **`Dryspace Context Brief.md` uncommitted.** Batch C edited it and did not commit |

**Decide deliberately: commit Batch C first, or carry it and commit everything
together.** Do not discover it halfway through. Two repositories means two
commits and two pushes either way — see §6.

Also verified at the same moment, so you need not re-derive it:

- **Suite: 550 assertions, zero failures**, served over HTTP.
- `APP_VER 1.4.0` · `FORM_VER 4.2` · `VER_DATE '18 August 2026'` ·
  `CACHE_VERSION ds-inspect-v1.4.0-25`.
- **`VER_DATE` is stale.** It says 18 August; the app has changed every day
  since. It is a release stamp, so it moves when the release is cut — not
  now, and not by you unless you are also cutting the release.
- The app's root on `main` still serves **v1.3.0**. Nothing this batch does
  changes that.

---

## 3. Your job, in order

### 3.1 Fix `05_Release Protocol.md` first

Lines **109–112** still name the printed guides as `_v1.3.pdf`. The files on disk
have been `_v1.4.0.pdf` since 18 August. This was left deliberately across three
batches so that **the fix and the regenerated files move in the same commit** —
that is the whole point, so do the fix before you run the generator, not after.

**All four rows are wrong, not just `02`.** Earlier handoffs named
`Guides/02_Iteration Guide_v1.3.pdf` as *the* stale reference; Batch C opened the
table and found `01`, `02`, `03` and `05` all still saying `_v1.3.pdf`. This is
the same lesson a third time: the note you inherit describes what somebody
happened to notice, not what is there. Open the table.

Note also that the current filenames are `_v1.4.0.pdf` — full three-part version,
because `make_guides.py` reads `APP_VER` — whereas the stale rows say `_v1.3.pdf`.
Do not "fix" them to `_v1.4.pdf`.

### 3.2 Regenerate what the tool generates

```
python tools\make_guides.py
```

Verified in Batch C by reading the script: it produces **the four PDFs in
`Guides/`** and **both A4 quick cards in `Training/`**, all named for `APP_VER`
read out of `index.html`. It does **not** produce the chart or the deck.

Sources are `.md` for the guides and `.svg` for the cards. **Edit the source,
never the PDF.**

### 3.3 Export the two by-hand items

Neither is produced by `make_guides.py`. Both are listed under *"Still done by
hand"* in `Training/README.txt`.

| File | Export as |
|---|---|
| `Training/Workflow_Chart.html` | Print → Save as PDF → **A3 landscape** |
| `Training/Setup_and_Use_Deck.html` | Print → Save as PDF → **A4 landscape** |

**Background graphics ON for both.** Without it the navy headers and every
coloured panel print as empty white boxes — this is called out in `README.txt`
and it is not a cosmetic problem, because the warning callouts are the ones that
lose their colour.

The deck's print stylesheet puts **one slide per page and forces the presenter
notes visible**, on purpose: that export is the handout the presenter runs the
session from. If the notes are missing from your PDF, the print CSS did not
apply — do not ship it.

---

## 4. What Batch C changed that you are about to render

Read these before you regenerate anything that contains them. All were verified
against build `v1.4.0-25` by reading the code.

- **`Training/Workflow_Chart.html` §02 was rebuilt.** It was still the v1.3
  **five-step** handover — under a footer stamped *v1.4 · Form 4.2*. It is now
  four steps. **Your A3 export is the first one that will carry the correction**,
  so check the four boxes are there before you file it.
- **`Training/Quick_Card_Handover.svg`** had one stale string, its `aria-label`.
  The **visible card was already correct** and was not touched. Your regenerated
  PDF should be visually identical to the existing one. **If it is not, something
  else changed and you should find out what before shipping it.**
- **`Training/Quick_Card_Photos.svg`** was read in full and is correct. Untouched.
  Same expectation: a byte-identical-looking export.
- **`Training/Setup_and_Use_Deck.html` is new** — 17 slides, replacing the deleted
  `.pptx`. HTML on purpose; the reasoning is decision log **§4a**, and it is not a
  decision to revisit casually.
- **`Training_Module.html`** said *"Six questions"* over a check holding eight.
  Fixed. Otherwise it was current.
- **`_Shared/Dryspace Context Brief.md`** — separate repository, see §6.

---

## 5. Testing

Server config is at `.claude\launch.json` **in the session working directory, not
in the project folder** — `dryspace-inspect`, port 8765. Batch C added a second
entry, `dryspace-inspect-isolated` on port 8799, serving the same folder; it
exists so the suite can be run on an origin the app has never been served from.
Keep it or delete it, but know why it is there — see the warning below.

Open `tests.html` over HTTP. **Expect 550 assertions and zero failures, before
you start and when you finish.** Generating PDFs should not move the count.

`tests.html` checks that each `Guides/*.pdf` exists at the current `APP_VER`.
**Do not rename or delete them** — that fails the suite. Regenerating them in
place is exactly what the check wants.

> ### Two assertions in this suite are flaky. Do not chase them.
>
> Batch C opened with **"2 of 550 assertions FAILED"**, both inside
> *bytes already orphaned are swept up*:
>
> ```
> FAIL  the sweep found it (0)
> FAIL  and reclaimed it
> ```
>
> **It is not a regression, and the app is not at fault.** `sweepOrphanBytes()`
> called by hand on the same page reclaims the exact record the assertion says it
> missed, and the suite passes 550/0 on other runs with nothing changed between
> them.
>
> Batch C formed two tidy explanations and **disproved both by testing them** — a
> stale service worker (it failed again with none controlling the page), and
> leftover data in the `bytes` store (it passed again with that residue seeded on
> purpose). Do not re-derive either; they are dead ends, recorded so you do not
> spend the afternoon Batch C spent.
>
> What remains is a race. `tests.html` defines these two checks with `later()`,
> whose IIFE bodies begin executing immediately, so they run concurrently with
> each other **and** with the app's start-up chain — which calls
> `sweepOrphanBytes()` itself. Two sweeps over one key, order undefined. The
> exact interleaving was not pinned down, because doing so means editing
> `tests.html` and Batch C was not permitted to.
>
> **A failing run leaves `__already-orphaned__` behind in the store**, so it
> looks stable when you reload. That is the trap.
>
> **Rate, measured at the close of Batch C:** eight consecutive runs driven back
> to back all passed 550/0, as did the final top-level run. The failures
> clustered earlier in the session, on top-level page loads while other work was
> in flight — consistent with load-time contention. So a clean run is not proof
> the flake is gone, and a failing one is not proof anything broke.
>
> **What to do:** re-run. If a run fails on those two assertions and nothing
> else, it is this flake — say so in your summary and move on. Deleting the
> `ds-inspections` database gives you a clean next run. A real regression will
> not come and go.
>
> **If you are ever in a batch that may touch `tests.html`,** this is worth
> fixing: give the two orphan tests their own key namespace and sequence them
> after boot. Two assertions that cry wolf are worse than none, because the next
> genuine failure here gets waved through.
>
> Separately, and still true: `CLAUDE.md` warns that the service worker serves
> cache-first and has twice caused the suite to grade stale code. Use
> `index.html?nosw=1` for a guaranteed fresh copy of the app.

---

## 6. `_Shared` is a separate repository

`_Shared/Dryspace Context Brief.md` was updated in Batch C. It lives two levels
up, in **its own git repository, on branch `main`**, with its internals at
`~/dev/.git-dryspace-shared`, outside the sync root for the same OneDrive reason
as this repository.

**It is a separate commit.** Batch C did not commit it — the commands were handed
to the owner. Check with the owner whether that commit was made before assuming
the working tree there is clean.

You are not expected to change it. If you find it contradicting anything you
render, that is a finding worth raising rather than a file to quietly edit.

---

## 7. Read before rewrite — still the rule

Batch A found four wrong statements in `03` this way. Batch B found two of the
same errors again in `01`, plus two wrong assertion counts in `02`. Batch C found
the Context Brief instructing an external AI to teach the five-step handover, and
an entire chart section still on v1.3 beneath a v1.4 footer.

**The pattern has not varied once:** the file's own version stamp was right, and
its body was wrong. Nothing in this repository looks across files except you.

Grep the whole folder, not just the code:

```
grep -rn "Setup and User Guide\|Iteration Guide\|Handover and Version Control" . \
  --include=*.md --include=*.txt --include=*.html
```

**And read the sentence, not the digit.** `Workflow_Chart.html` says *"six stages,
five handovers"*, which is **correct** — six stages means five transitions. A
search-and-replace on "five" would have broken it. Batch C nearly did.

---

## 8. When you are done

Working tree should contain the regenerated PDFs, `05_Release Protocol.md`, and
the two log files.

```
git status --short
git add Guides Training "05_Release Protocol.md" CHANGELOG.txt docs/DECISION-LOG.md docs/HANDOFF-v1.4-polish.md
git commit -m "docs: regenerate the guides and cards at v1.4.0, and fix the release protocol's guide table"
```

**Hand the commands to the owner. Do not run `git push`.** Pushing to `main` *is*
the release.

Update the **Progress** block in `docs/HANDOFF-v1.4-polish.md` §5.

**Batch D closes the documentation set.** `CLAUDE.md` says v1.4 must not reach a
field device before that set exists — so when you finish, say plainly in your
summary whether it now does, and what remains between here and a release. Two
things outside the documentation are still owed and are **not** yours to do:
the outstanding baton-status and forced-handover test against real SharePoint
(`bug tests/OUTSTANDING-baton-status-and-forced-handover.txt`), and Julie and
Mike's *Contribute - No Delete* permission test.

---

## 8a. What has to be true before v1.4 can be released

**Batch D does not release anything.** It is the last piece of preparation. This
list is here so the owner can see the whole gate in one place, and so you do not
half-perform it by accident.

From `05_Release Protocol.md` §2, every tier:

| Gate | State after Batch D |
|---|---|
| `tests.html` zero failures | Done — 550 assertions |
| `APP_VER`, `FORM_VER`, `VER_DATE` | `VER_DATE` still says 18 August. **Moves when the release is cut** |
| `CACHE_VERSION` bumped | Done — `-25` |
| `CHANGELOG.txt` entry | Done, and kept current batch by batch |
| Committed with a message saying why | Yours to do |
| **Tagged in git** | **Not done.** Only `v1.3.0` exists |
| `Guides/` regenerated | **This batch** |

And two gates that are not in the protocol but are real:

- **`CLAUDE.md`: "Do not let this reach a field device before that document set
  exists."** Batch C rebuilt the deck, so this is satisfied once your PDFs land.
- **`bug tests/OUTSTANDING-baton-status-and-forced-handover.txt` has never been
  run.** The baton status columns and forced handover have not been exercised
  against real SharePoint even once. **This is the one that matters.** Everything
  else in v1.4 has been used on a real device; these two have only been reasoned
  about, and reasoning is what was wrong three times this week.

**Releasing is a different operation from anything done so far.** Every deploy in
this project has been a `/beta/` refresh: copying seven files into `beta/` on
`main`, leaving the root alone. A release means putting v1.4 at the **root of
`main`**, which is what staff load. Pushing `main` *is* the release — there is no
staging step after it. Do not do it as part of this batch.

---

## 9. What NOT to do

- Do not push, to any branch, in either repository.
- Do not bump `APP_VER` or `CACHE_VERSION`.
- Do not touch `index.html`, `ds-media-sync.js`, `ds-sharepoint.js`, `ds-auth.js`,
  `sw.js` or `tests.html`.
- Do not edit a PDF, or a card's PDF instead of its `.svg`.
- Do not rename or delete anything in `Guides/` — `tests.html` checks the names.
- Do not rebuild the deck as `.pptx` — decision log §4a.
- Do not "fix" the Quick Card Handover SVG. It is correct; Batch C already
  confirmed this by reading it, twice, and the brief that said otherwise was
  wrong.
- Do not reopen D45 or D49 (the Blob question), or B5 (the v1.3 mobile upload
  fault). Both settled on evidence.
- Do not add anyone to `SP_CONFIG.admins`.
- Do not restate the handover procedure outside `03`. Point at it.
