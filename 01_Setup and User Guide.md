# Site Inspection App — Setup & User Guide

**Offline field inspection app for iPad, iPhone, Android and PC**

App v1.4 · Form 4.2 · Project 2.1 — Site Assessment
Live app: https://ds-js1.github.io/dryspace-inspect/

> **What changed in v1.4.** The record itself now moves through SharePoint — handed
> over and picked up through the inspection's own folder, with no file to email.
> Work in progress is backed up automatically. The buttons moved to the top of the
> form. Parts A, D and E changed most.

> **Handover has its own document.** Anything about the baton, who holds a record,
> the library columns, forced handover or reading an inspection without taking it
> is in `03_Handover and Version Control Protocol`. This guide points at it rather
> than repeating it, because two documents describing one process is how they come
> to disagree.

---

## Part A — What has been built

An offline-first web app built from the v4 Site Inspection Form: 13 sections,
154 labelled fields, roughly 400 data points, with every dynamic reveal preserved.

### Key behaviours

- **Continuous autosave** — every keystroke, tick and photo saved within half a
  second. A *"Saved [time]"* indicator confirms it. No Save button, and nothing to
  lose if the battery dies.
- **Works with no signal at all.** Everything is stored on the device.
- **Suspend and resume** — leave an inspection at any point and reopen it later.
  Multiple inspections can be open at once.
- **Edit after completion** — an inspection marked Complete can still be reopened,
  edited and re-sent.
- **Stage tracking** — every inspection shows who holds it, who last edited it and
  when. Stage changes are logged to an audit trail that travels with the record.
- **Measurement schedule** — Section 07 holds a table of wall faces with length,
  height, calculated area, treatment and grade, with running totals.
- **Office pre-fill and handover** — the office fills Section 01 during the
  qualification call, then hands the record to the field team.
- **Photos upload to SharePoint** *(new in v1.3)* — full-quality originals, filed
  automatically into the inspection's own folder.
- **Send** — one button builds a self-contained HTML report (all answers, embedded
  photos, the Dryspace logo) and opens the device share sheet.
- **Data backup** — one tap on the home screen backs up all inspections as JSON.
- **The record travels through SharePoint** *(new in v1.4)* — handed over and
  picked up through the inspection's own folder, with no file to email.
- **Work in progress is backed up automatically** *(new in v1.4)* — so a lost
  phone no longer means a lost day.
- **You can see every inspection in the business** *(new in v1.4)* — not only the
  ones on your device, and you can read one without taking it.

### What changed in v1.4

**The record now moves through SharePoint, not the share sheet.** Tap **Hand over
through SharePoint** and the app uploads the inspection to its `current/` folder
and files the previous version in `archive/`. On a phone this simply was not
possible before — the share sheet offered WhatsApp and Mail and no way to reach
SharePoint at all.

**You can pick an inspection up as well as put it down.** **Take over an
inspection from SharePoint** on the home screen lists everything waiting and
brings the one you choose onto your device. Nobody has to send you a file.

**Choosing is now a list you can filter and tap.** Taking over and recovering used
to be a numbered question with the whole list read out inside it. They are now a
proper list with a filter box across the top — client, address, number or stage —
so finding one job among fifty is a matter of typing three letters.

**Your work is backed up while you type.** Every four minutes, and once when you
leave the form, the app quietly saves a copy to the inspection's `wip/` folder.
If your phone is lost or broken, **Recover work in progress** on the home screen
brings it back. Previously an unfinished inspection existed only on your device.

> A backup in `wip/` is a **working copy, not the baton**. The live record is
> always the file in `current/`. The app keeps them apart on purpose.

**The app will not let two people overwrite each other.** If somebody else has
handed the same inspection over since you picked it up, the app says who and when
and asks before continuing. Their version is archived, never deleted.

**A record you have handed over says so.** Its card carries a **HANDED OVER**
badge, and opening it asks whether you meant to — because the live record is now
the file in SharePoint, and anything you type into the copy changes nothing there.

**The buttons moved to the top of the form.** They used to sit below every
section, so handing over meant scrolling past the whole form to reach them.

**There is now an Upload button on the form itself.** Uploading used to mean going
back to the home screen, which is exactly the step people skipped.

**Both offline paths still exist**, labelled *offline fallback*: *Share draft* and
*Import from a file*. Use them when you have no signal — and remember that the
filing into `current/` and `archive/` is then yours to do by hand.

**Photo upload failures now tell you what went wrong.** Each file shows its own
state, its progress while uploading, and the actual reason if it fails. An upload
that stalls now gives up and says so instead of sitting on *"Uploading…"* for ever.

---

### What changed in v1.3

**Photos now upload to SharePoint by themselves.** Previously the full-quality
originals existed only on the device, and were lost the moment it was wiped or the
inspection deleted. This is the largest change and the reason for the rest.

**You sign in once.** Home screen → *Sign in*, using your Dryspace Microsoft
account. It is remembered. Losing signal does not sign you out.

**Nothing is deleted on trust.** The app reads every uploaded file back out of
SharePoint and confirms it arrived complete before treating it as done.

**The app tells you when it has been updated.** A green bar appears saying a new
version is ready, with an *Update now* button, plus a *Check for app update*
button on the home screen. Updates no longer apply silently.

**One folder per inspection** in the new Site Inspections site. From v1.4 it holds
`current/`, `archive/`, `wip/` and `photos/`. See
`03_Handover and Version Control Protocol` §3.

**Files say whose job they are.** Photos and drafts now carry the client name, so a
file that has been downloaded or emailed is still identifiable.

---

## Part B — Deployment

> **Already done.** Recorded for reference.

- **GitHub account:** DS-JS1 — a Dryspace business asset. Keep the login in the
  password manager.
- **Repository:** github.com/DS-JS1/dryspace-inspect — public. It holds only the
  blank form; no client or inspection data is ever committed to it.
- **Live address:** https://ds-js1.github.io/dryspace-inspect/ — HTTPS via GitHub
  Pages from the `main` branch.
- **Publishing a new version** is covered in `02_Iteration Guide`.

### One-time setup for v1.3 and v1.4

Two things must be in place before photo upload or handover will work:

1. **Entra app registration** with admin consent granted — the app cannot upload
   until a tenant administrator approves it once.
2. **The Site Inspections site**, its permission group, its library settings and
   the eight index columns — see `03_Handover and Version Control Protocol` §10.
   Two of those columns, `BatonStatus` and `BatonHolder`, were added for v1.4; a
   library set up for v1.3 has six and needs the other two.

> **A missing column fails silently, by design.** An upload or a handover is never
> refused because the index could not be written. If the library columns look
> empty after a handover, check their spelling first — `03` §10 explains why.

---

## Part C — Installing on each device

**iPad / iPhone (Safari)**
1. Open the live address **in Safari** — it must be Safari, not Chrome, for install
   to work on iOS.
2. Share icon → **Add to Home Screen** → Add.
3. Open it once from the home-screen icon while still online.

**Android (Chrome)**
1. Open the same address in Chrome.
2. ⋮ menu → **Add to Home screen** (or *Install app*).

**Windows PC (Chrome or Edge)** — for office pre-fill
1. Open the same address.
2. Click the install icon at the right of the address bar.

> **Always use the installed icon, not a browser tab.** Installed apps get
> protected storage; data in an ordinary tab can be cleared by the browser. This
> was confirmed on a real device on 18 August 2026 — an ordinary Safari tab is
> refused durable storage outright.

### Picking up a new version

From v1.3 the app tells you: a green bar appears saying a new version is ready.
Tap **Update now**. You can also check on demand with *Check for app update*.

> **The v1.3 update itself was the exception.** Devices running v1.1.1 had no
> banner and could not be given one retrospectively. For that one update, staff
> opened the app while online, fully closed it (swiped it away), then opened it
> again. Everything from v1.3 onward updates itself.

### Which build am I actually running?

The line at the foot of the home screen reads, for example:

```
Dryspace Inspection App v1.4.0 — Form 4.2 · Version date … · Works fully offline · build 1.4.0-25
```

**Quote the whole line, including the build, in any bug report.** The version on
its own cannot tell one build from another — several different builds all report
v1.4.0. The build number is read from what is actually being served, so it is the
one number that cannot be out of date.

---

## Part D — Using the app

### The home screen

Its buttons, in order:

| Button | What it does |
|---|---|
| **＋ New inspection** | Start one on this device |
| **Take over an inspection from SharePoint** | Lists everything waiting in a `current/` folder; tap one to bring it onto this device and become its holder |
| **Browse all inspections** | Every inspection in the library, whether or not it is waiting |
| **Import from a file (offline fallback)** | Accepts a draft or report file, for a device with no signal |
| **Recover work in progress** | Lists the automatic `wip/` backups. **Not** the way to take a job over |
| **Download data backup (all inspections)** | All field data on this device, as one JSON file |
| **Check for app update** | Asks now rather than waiting for the banner |

The sign-in and sync bar sits below them.

Each inspection on the device gets a card showing its stage, when it was last
updated and by whom, a **DRAFT**, **COMPLETE** or **HANDED OVER** badge, and how
its files stand.

### Set your name once

At the top of any inspection, beside the stage selector, there is a *Your name*
box. Fill it in once and the app remembers it on that device. Your name is stamped
into exported filenames, the audit trail and the library's `LastEditor` column.

### Sign in once — new in v1.3

Home screen → **Sign in**, with your Dryspace Microsoft account. This is what lets
photos upload, records hand over, and work in progress be backed up. It is
remembered, and losing signal does not sign you out.

### The action row — at the top of the form

Directly beneath the stage selector, in this order:

| Button | What it does |
|---|---|
| **Hand over through SharePoint** | Puts the record in `current/` and files the previous version in `archive/`. See `03` |
| **Send report (email / SharePoint)** | Builds the report and opens the share sheet |
| **Share photo & video files** | Shares the untouched originals through the share sheet |
| **Share draft (offline fallback)** | The old file-based handover, for no signal |
| **Print / PDF** | Prints the form as it stands |

Along the very top of the screen sit *‹ All*, the *Saved [time]* indicator,
*Highlight gaps*, *Mark complete*, the Upload button when something is waiting,
and *Send*.

### Office workflow (qualification call)

1. On the office PC, tap **＋ New inspection**. Set the stage to *01 Office* and
   fill Section 01 — HubSpot deal name, client, property, both contacts.
2. Paste the property listing URL if there is one, and upload any floor plans in
   Section 11. **This is the stage to do it** — there is signal at a desk.
3. Change the stage to *02 Field*, then tap **Hand over through SharePoint** at
   the top of the form. The app files it into `current/` and archives the previous
   version for you.
4. Tell the field inspector, with a link to the folder — not the file. Then delete
   your copy once they confirm they have it. See
   `03_Handover and Version Control Protocol`.

### Field workflow (site visit)

1. Tap **Take over an inspection from SharePoint** and pick the job, or
   **＋ New inspection** for a walk-in.
2. Work through Sections 02 to 06 plus 03A. Blank fields are fine.
3. **Do not skip Section 03A.** Asbestos likelihood, hazards, access constraints
   and the discharge point all affect safety and price.
4. Photograph in the **Camera app**, then attach — see Part E.
5. Watch for *"Saved [time]"* in the top bar.
6. To pause, just leave. Resume from the list any time.
7. When finished, set the stage to *03 Technical* and tap **Hand over through
   SharePoint** — **after checking the photos have uploaded.** The card for each
   inspection says whether its files are waiting, uploading, all uploaded, or
   need attention.

### Taking an inspection over

**Take over an inspection from SharePoint** lists everything waiting, one row per
job, with the stage on the row and a filter box across the top. Tap one and it
comes onto your device.

**The photos come across as thumbnails, not as files.** They are already in the
inspection's `photos/` folder, so sending them a second time would be pointless.
Each one shows its thumbnail with **in SharePoint · tap to fetch** underneath —
tap it while you have signal and the full original comes down and behaves like any
other photo on your device.

> **Fetch what you need before you lose signal.** A thumbnail is all you have until
> you do. This is worth thirty seconds in the car.

### Before the first upload — the filing nudge

The folder name is fixed by the **first upload** and cannot be changed afterwards.
So the first time you upload photos on an inspection with blanks in the five
details that decide the filing, the app names them, shows the folder it would file
as, and lets you go back and fill them in.

The five are **Inspection number**, **Client name**, **Property address**,
**Inspection date** and **Your name**. A record with no number, client or address
files as **`Unfiled`**.

- Asked **once per inspection**, and never once the folder is already fixed —
  after that, filling them in changes nothing about the folder.
- **It never blocks the upload.** Tap OK and it goes.
- **It is never asked at capture.** Taking the photo always comes first.

The same check runs again at handover, whichever way the folder stands. If the
folder is already fixed it says so plainly: filling the blanks in now corrects the
record and the library columns but **will not rename the folder or any photo in
it**.

### Seeing where everything is

**Browse all inspections** shows every inspection in the library — not only the
ones waiting, and not only the ones on your device — with the baton state on each
row. Tap one and you can take it over, read it without taking it (**View it**),
open the folder in SharePoint, or, when somebody else holds it, **Ask for the
baton** — which writes the message for you and puts it on the share sheet or the
clipboard.

*View it* opens the record with every field disabled and a **VIEW ONLY — nothing
you change here is saved** bar across the top. Nothing you do there is written
anywhere.

The three baton states and what they mean are in `03` §5.

### Seeing what is still empty

Every field label carries a reference number such as `03.4`, which also shows
whether the field has content:

- **Green with a tick** — this field has something in it. For photo blocks, at
  least one photo is attached.
- **Grey** — nothing entered. Often perfectly correct, which is why grey is quiet.
- **Amber** — only when *Highlight gaps* is switched on. Use it when reviewing
  before handing over.

Each section header shows a count, for example `12/19`. Because sections start
collapsed, this is the fastest way to see where the gaps are.

> **Blank is not the same as wrong.** The form is deliberately broader than any
> single job, so a lot of grey is normal. The counts exist to find genuine gaps,
> not to be driven to 100%.

### Technical workflow — the measurement schedule

Section 07 holds one row per wall face or floor area to be treated:

1. Tap **+ Add wall face / area**.
2. Enter the face name (e.g. "East wall"), length and height in metres. The area
   calculates itself.
3. Choose the treatment and waterproofing grade, and note anything unusual —
   "behind stairs", "obstructed by services".

Totals for linear metres and square metres appear at the foot and carry into the
report.

> **Why this matters.** Before v1.2 this was a paragraph of prose that pricing had
> to interpret. This is the number the quote is built from.

---

## Part E — Photos, video and files

### Take photos in the Camera app — not in the form

Photograph what you need using the **Camera app**, then attach them to the right
field. Two reasons, both worth knowing:

- Your camera roll keeps an **independent second copy**, before the app has it and
  after.
- Photos taken through a browser carry **no location detail**; ones from the Camera
  app do.

### What the app keeps

| Copy | Size | Purpose |
|---|---|---|
| Thumbnail | 240 px | Previews in the form |
| Report copy | 1,600 px, JPEG q0.72 | Embedded in the emailed report |
| **Original** | Untouched | Uploaded to SharePoint as evidence |

Documents, PDFs and video are stored exactly as supplied.

A typical 12-megapixel phone photo drops from roughly 4 MB to around 250 KB for the
report copy — which is what keeps emailed reports deliverable.

### Uploading

There are two Upload buttons, and they do the same thing.

- **On the form**, at the top, and **only when something is waiting**. It reads
  *Upload 3 photos*, and while it runs it reads *Uploading · 2 left · 45%* with a
  bar filling across it. The count only ever falls.
- **On the home screen**, *Upload now* in the sync bar, on the same condition.

Back in signal — car, office, wifi — tap either. Each file is listed with its own
state and, if one fails, the reason.

Wait until the bar says **"All photos uploaded."** Until then, those photos exist
only on your device.

**What a card tells you.** Each inspection's card ends with one of:

| It says | It means |
|---|---|
| `3 files · all uploaded` | Safe in SharePoint |
| `3 files · 1 waiting to upload` | Tap Upload |
| `3 files · 1 uploading` | In progress now |
| `3 files · 1 needs attention` | Tap **Try again**; tell the office if it repeats |
| `no files on this device` | Exactly that — this inspection has no files here. **It does not mean "all uploaded"** |

If something fails: *"No connection"* is normal in a basement. **Needs attention**
means tap **Try again**, and tell the office if it repeats — **before deleting
anything.** A failed upload leaves the original untouched.

> **Photos added after you have handed over.** The app lets you — adding one
> somebody missed is a legitimate thing to do, and the file goes to the right
> folder either way. But it warns you first, because the record waiting in
> SharePoint was written at handover and will not list them. **Hand over again**
> once they have uploaded, and the record catches up with the folder.

### Sending a report when the photos are not on this device

If you took the inspection over, its photos are thumbnails until you fetch them.
Tap **Send report** and the app asks which you want:

- **Bring them down first** — needs signal. Embeds the readable copies. Best for a
  desk, and for printing.
- **Send now** — thumbnails plus a link to each original in SharePoint. Smaller,
  and quick.

Either way the full-resolution original stays in the `photos/` folder and the
report links to it.

### HEIC conversion — the honest position

- **On iPhone and iPad — works.** iOS converts HEIC to JPEG at the moment you pick
  the file.
- **On Windows — does not convert.** The browser cannot decode HEIC, so the file is
  stored untouched. Convert to JPEG before attaching if you are working on a PC.

In practice photos are taken on the iPad, so this rarely bites.

### Video

Short clips up to about 30 seconds can go into the app alongside photos. Anything
longer is recorded with the Camera app and uploaded to the inspection's folder via
the **OneDrive app** — video does not upload through the inspection app.

**Set this on every field device before it goes out:**

- Settings → Camera → Record Video → **1080p HD at 30 fps**
- Settings → Camera → Formats → **High Efficiency**

Roughly 60 MB per minute instead of around 400 MB at 4K, with no loss of useful
detail at review size.

> **Why video is not compressed in the app.** Compressing video inside a browser on
> an iPad means shipping a 25–30 MB library and a process that fails unpredictably.
> The camera setting does the same job reliably, for free.

### Protecting your data

- Each device holds its own inspections. Handing over, sending the report or
  uploading photos is what turns it into shared business data.
- **Only delete an inspection after it has been handed over and its photos show as
  uploaded.** Delete is permanent and includes the photos.
- Use **Download data backup** weekly and file it in SharePoint. It covers field
  data across every inspection on that device — but **not** photos, which are
  covered by the SharePoint upload.
- Follow `03_Handover and Version Control Protocol` for anything passing between
  people.

---

## Part F — Automatic filing of reports (Power Automate)

Optional. Roughly fifteen minutes, one time, using standard M365 connectors with no
premium licence.

> **Photos no longer need this** — they upload directly from v1.3. Nor does the
> record itself, which travels through SharePoint from v1.4. This flow is now only
> for filing the emailed **report** file.

1. Go to `make.powerautomate.com` signed in with your Dryspace M365 account.
   Create → Automated cloud flow, named "DS Inspection Reports".
2. In the trigger, open **Show advanced options**: Include Attachments = Yes, Only
   with Attachments = Yes, Subject Filter = `DS_Report`.
3. Add **Apply to each** → select *Attachments* from the trigger output.
4. Inside it, add the SharePoint action **Create file**: your site address, the
   target library folder, File Name and File Content from the attachment.
5. Save, then test by emailing yourself a report from the app.

---

## Part G — Known limits of v1.4

- **No live cross-device sync** — by design, for offline reliability. Handing over
  through `current/` is the transfer mechanism; it moves when you tap the button,
  not continuously.
- **The automatic backup is a safety net, not a sync.** It writes your work to
  `wip/` while you edit. It does not merge, and it does not tell another device
  anything. Two people editing one inspection still produces two versions — the
  app will warn at handover, but it cannot combine them.
- **The automatic backup needs signal and a signed-in account.** It is silent when
  it cannot run, deliberately — a warning in front of somebody standing on a roof
  helps nobody. It also does nothing until the inspection has a number, a client or
  an address, because until then there is no folder to write to.
- **Nothing is deleted from SharePoint by the app**, ever. Old `wip/` files stay
  until somebody clears them out, and the device copy is yours to delete after a
  handover.
- **The folder name is fixed by the first upload.** Correcting the inspection
  number afterwards fixes the record and the library columns and renames nothing.
- **Photos taken over from SharePoint are thumbnails until you fetch them.** With
  no signal, a thumbnail is all you have.
- **Report photos are compressed** to around 1,600 px to keep emails deliverable.
  The full-quality originals are in SharePoint.
- **Video never travels inside drafts or reports** — it goes via OneDrive.
- **Backups contain field data only** — no photos or video.
- **Reports produced by v1.0** (before 20 July 2026) cannot be re-imported. Reports
  from v1.1 onward can.
- **Print works best from the emailed report file** rather than inside the installed
  app — an iOS limitation.
- **The app address is publicly reachable** — standard for GitHub Pages on the free
  plan. It exposes only the blank form; every answer and photo lives in your tenant.
- **Photo upload needs admin consent**, granted once by a tenant administrator.
- **The Dryspace Guide still shows the 2009 grades.** The form moved to the
  BS8102:2022 classification in v1.2.1, so the Guide is now the document that
  disagrees.
