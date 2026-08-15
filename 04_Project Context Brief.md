# Project Context Brief — Dryspace Site Inspection App

**Purpose of this document:** background to paste into an external AI tool so it can
produce training material — presentations, animations, videos — about the Dryspace
Site Inspection App. It assumes the reader knows nothing about the business, the
trade, or the app.

**Current version:** App v1.3 · Form 4.2
**Live app:** https://ds-js1.github.io/dryspace-inspect/

---

## 1. The business

**Dryspace Solutions** is a specialist basement and below-ground waterproofing and
remediation company based in Queensland, Australia, working across residential,
commercial and mixed-use properties.

The point of difference is **internally applied waterproofing systems** — fixing wet
basements from the inside, where digging up the outside is not possible, not
practical, or not what the client wants. External excavation is referred out.

Core systems:

- **Cavity drain systems** — primarily Newton Waterproofing (UK) products
- **High-pressure resin crack injection**
- **Negative hydrostatic coatings** — membranes applied to the inside face of a
  wall, working against water pressure

A small business in a growth phase, building systems so the work does not depend on
one person's head. Tools in use: Microsoft 365 and SharePoint, QuotientApp for
quoting, HubSpot as CRM, iPads in the field.

---

## 2. The problem the app solves

A basement waterproofing quote can only be as good as the site inspection behind it.
Before the app, inspections were captured inconsistently — different inspectors
recorded different things, some details were remembered rather than written down,
and the person writing the quote often had to ring the inspector to fill gaps.

Three constraints shaped the solution:

1. **Basements have no mobile signal.** Anything requiring a live connection fails
   at the exact moment it is needed.
2. **The information feeds downstream systems.** What is captured on site becomes
   the proposal, then the quote, then the contract. A gap at inspection becomes a
   gap in the quote.
3. **Five different people touch one job** — office, field, technical, sales, admin
   — so the record has to pass between them without being lost or duplicated.

---

## 3. Where the form sits — the Critical Client Flow

Dryspace maps its customer journey as the **Critical Client Flow**, in four phases:
Contact to Contract, Contract to Commencement, Commencement to Completion,
Completion to Closeout.

```
Site Inspection App  →  Proposal Builder  →  Quote Assembly  →  QuotientApp  →  Client
      (2.1)                  (3.0)               (4.0)
```

Everything downstream depends on it. If a data point is not captured cleanly at
inspection, it cannot be used reliably later.

---

## 4. What the Site Inspection Form actually is

A structured record of everything observed and decided about one basement
waterproofing job. Completed on an iPad on site, then added to by the office and
technical team afterwards.

**13 sections, 154 labelled fields, around 400 individual data points.** It is
deliberately broader than any single job — most inspections leave a lot blank, and
that is correct and expected. A wide form filled in accurately beats a narrow form
that forces guesses.

| Section | Covers |
|---|---|
| **01** Job & Client Details | Client, property, both contacts, lead source, referrer, title photo |
| **02** Client Brief | What the client reported, in their words |
| **03** Site & Structural Overview | Basement type, wall construction, slab design, retained soil height, waterproofing grade |
| **03A** Safety, Access & Discharge | Asbestos likelihood, hazards, parking and carry route, where the water will discharge to |
| **04** Inspection Observations | Where water is getting in, signs of moisture, photos |
| **05** Assessment | Likely causes and moisture sources — the diagnosis |
| **06** Existing Elements | What has to be removed or worked around |
| **07** Repair Approach | Recommended system, and the measurement schedule |
| **08** Drainage Design | Outlet locations and types, maintenance access points |
| **09** Reinstatement & Finishes | Putting the room back together afterwards |
| **10** Pricing & Timeline | Duration, availability, insurance, exclusions, provisional sums |
| **11** Photos, Video & Documentation | Site media, sketches, floor plans, 3D scans |
| **12** Inspector Notes | Anything else, follow-up actions, target date to issue the quote |

Sections 01–06 and 03A are completed on site; 07–12 afterwards in the office.

---

## 5. What the app is, technically

An **offline-first Progressive Web App** — a single self-contained web page that
installs to the home screen of an iPad, iPhone, Android device or Windows PC and
then behaves like a normal app.

The things worth conveying to a non-technical audience:

- **It works with no signal at all.** Everything is stored on the device.
- **It saves continuously** — every keystroke, tick and photo, within half a second.
  A *"Saved [time]"* indicator confirms it. Losing signal, locking the screen or a
  flat battery does not lose data.
- **There is no server and no database.** Inspection data never leaves the device it
  was entered on until someone chooses to send or upload it.
- **Photos are kept three ways** *(v1.3)*: a thumbnail for previews, a 1,600 px copy
  so emailed reports stay deliverable, and the **untouched original** as evidence.
  A typical phone photo drops from about 4 MB to around 250 KB for the report copy.
- **Photos upload to SharePoint** *(v1.3)* when the device is back in signal, filed
  automatically into that inspection's own folder. Nothing is deleted from the
  device until the app has read the file back and confirmed it arrived complete.
- **Staff sign in once** *(v1.3)* with their Dryspace Microsoft account. Losing
  signal does not sign anyone out.
- **The app announces its own updates** *(v1.3)* rather than changing silently.
- **Sending** builds a single self-contained report file — every answer plus the
  photos embedded — which can be emailed or filed to SharePoint. It also carries a
  hidden machine-readable data block that the next system reads directly, so
  nothing is retyped.

---

## 6. Who uses it, and when

Each inspection has exactly one owner at a time. The app tracks this as a **stage**:

| Stage | Who | What they complete |
|---|---|---|
| **S01 OFFICE** | Office / admin | Section 01 — client and property details, during the qualification call |
| **S02 FIELD** | Field inspector | Sections 02–06 and 03A — the site visit itself |
| **S03 TECHNICAL** | Technical team | Sections 07–09 — the specification and measurements |
| **S04 SALES** | Sales | Section 10 — pricing and timeline |
| **S05 ADMIN** | Admin | Contract details and final checks |
| **S06 CLOSED** | Nobody | Issued to the client, read only |

---

## 7. The handover rule

Because the app stores data on each device, handover happens by exporting a file and
importing it elsewhere — which means the record could be copied, and two copies can
drift apart. The governing rule is:

> **One baton, never a copy.** At any moment exactly one file is the live record,
> and it lives in SharePoint. The copy on your device is a working scratch pad.

Five steps at every handover: set your stage and name → export → upload to the
inspection's `current/` folder → move the previous file to `archive/` → **then**
delete your device copy.

From v1.3, everything for one inspection lives in **one folder**:

```
Site Inspections ▸ INS-2026-0142 - Smith - 12 Marine Parade, Kirra/
    current/   the live record
    archive/   every past handover
    photos/    uploaded by the app itself
```

Files are named automatically and carry the client name, so a file that has been
downloaded or emailed still says whose job it is:
`DS_Draft_INS-2026-0142_Smith_S02-FIELD_2026-08-15T1430_JS.json`.

---

## 8. Version history (context only)

- **v1.0** — first release, built from the paper form
- **v1.1** — office pre-fill and handover between devices
- **v1.2** — permanent field ids so the form can be edited without losing saved
  data; stage tracking and audit trail; Safety, Access & Discharge section;
  measurement schedule
- **v1.2.1** — completion indicators, "None apply" options, BS8102:2022 grades
- **v1.3** — photos upload to SharePoint with verification; Microsoft sign-in;
  update detection; automated test suite; one folder per inspection

> v1.2 and v1.2.1 were completed but never deployed — the photo problem made the app
> unusable in practice, so work moved straight to v1.3. Field devices went from
> v1.1.1 to v1.3.

---

## 9. Terminology — please get these right

| Term | Meaning |
|---|---|
| **Cavity drain system** | Waterproofing that manages water rather than blocking it — a studded membrane on the wall, a drainage channel at the floor, water directed to a discharge point. The core Dryspace method. |
| **Newton System 500** | The specific cavity drain system used (Newton Waterproofing, UK). |
| **Bunded BaseDrain / Rebated BaseDrain / BaseBoard** | Three drainage channel options, from most robust to slimline. |
| **Newton Jetting Eyes** | Access points that let the drainage channel be flushed and maintained. Required under BS8102. |
| **Type A / Type B / Type C** | The three waterproofing approaches in BS8102. Type A = barrier (membrane), Type B = structurally integral, Type C = drained cavity. |
| **BS8102:2022** | The British Standard for protecting below-ground structures from water. Dryspace works to it. |
| **Grades 1a, 1b, 2, 3** | How dry the finished space must be — 1a tolerates some seepage (a carpark), 3 tolerates none (a bedroom). |
| **Infill slab / raft slab** | Whether the floor was poured inside the walls (creates a weak wall-floor junction) or the walls sit on top of the slab (better). |
| **Negative hydrostatic membrane** | A coating applied to the inside face, working against the water pressure pushing through. |
| **Efflorescence** | White powdery salt deposits left on masonry as water evaporates. A classic sign of water movement. |
| **Hydrostatic pressure** | The pressure of groundwater pushing against the structure. |
| **Legal point of discharge** | Where collected water is legally allowed to be released — council stormwater, a pit, or the ground. |
| **QBCC** | Queensland Building and Construction Commission. Home Warranty Insurance is required on most residential work. |
| **SWMS** | Safe Work Method Statement — the written safety plan for a job. |
| **ACM** | Asbestos Containing Material. Buildings before 1990 are presumed to contain it until tested. |
| **Quotient / QuotientApp** | The quoting platform the finished numbers are entered into. |

---

## 10. Brand and tone

- **Colours:** Dryspace navy `#123A5F` (primary), white, light blue `#E8F1FA` for
  highlights. Amber `#FDF6E3` for cautions, muted red `#FBEBEA` for warnings.
- **Language: Australian English throughout** — "metres", "organised", "colour",
  "labour". Not American spelling.
- **Tone:** plain, practical, respectful of a trade audience. These are experienced
  tradespeople, not office workers — explain the tool, never the trade. No corporate
  filler, no exclamation marks, no talking down.
- **Units:** metres and millimetres. Dates in Australian format with the day name,
  e.g. "Monday 20/7/2026".

---

## 11. If you are building training material

**Audience:** Dryspace field inspectors and office staff. Comfortable with an iPad,
not interested in technology for its own sake. They want to know what to tap and why
it matters.

**Suggested running order:**

1. **Why this exists** — one good inspection is the whole quote. Keep it short.
2. **Installing it** — open the link in Safari, Add to Home Screen. Stress: use the
   installed icon, never a browser tab.
3. **It works with no signal** — the single most important reassurance. Show the
   "Saved" indicator.
4. **The office start** — Section 01 filled at a desk before anyone drives anywhere.
5. **On site** — working through the sections, the completion indicators turning
   green, why Section 03A must not be skipped.
6. **Photos** — take them in the Camera app, attach them, then upload when back in
   signal. Show *"All photos uploaded"* — that is the confirmation people need.
7. **The measurement schedule** — wall face, length, height, treatment. This is what
   pricing works from.
8. **Handing over** — the five steps, and why deleting your own copy is the one that
   matters.
9. **Sending** — one button, report goes to email or SharePoint.

**Things to get right:**

- Blank fields are normal. Never imply the form must be filled completely.
- The app is a capture tool, not a decision-maker. It records what the inspector
  judges; it does not diagnose.
- Photos live on the device until they are uploaded, and nothing is deleted until
  the app has confirmed the upload arrived complete. Say this plainly — "will I lose
  my photos" is the first question people ask.
- Video does not go through the app. It goes via OneDrive.

**Things to avoid:**

- Do not explain waterproofing to waterproofers.
- Do not use stock imagery of clean, dry, well-lit basements. The real ones are
  cramped, damp and full of the client's belongings.
- Do not imply the app replaces judgement, experience or a site visit.
