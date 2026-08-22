# Handover & Version Control Protocol

**How one inspection passes safely from office, to field, to technical, to sales, to admin**

App v1.4 · Form 4.2 · Project 2.1 — Site Assessment
Live app: https://ds-js1.github.io/dryspace-inspect/

> **What changed in v1.4.** The record itself now travels through SharePoint, the
> same way the photos already did. Handing over and picking up are both buttons —
> on a phone they used to be impossible. The folder list now says **who holds each
> inspection**, an inspection can be **read without being taken**, and an
> administrator can **force a handover** from a lost or broken device. Sections 3,
> 4, 5, 8 and 10 changed most; §5 is new.

---

## 1. The problem this solves

An inspection is worked on by five people in sequence. The office starts it, the
field team completes the assessment, technical writes the specification, sales
prices it, admin issues it.

The app stores each inspection on the device it was entered on. A handover copies
that record somewhere else — which means two copies can exist, and two copies can
drift apart.

> **The failure mode.** Two people hold a file carrying the same inspection
> number, both edit it, and the version that reaches the client is missing
> whichever changes the other person made. Nobody notices until the client asks
> about something that was quoted from the wrong copy.

The app now closes most of that gap itself: it puts the record in one agreed
place, records who last took it, and refuses to overwrite somebody else's work
without telling you whose it is. What it cannot do is delete the copy left on
your device, or make you tell the next person. Those two steps are still yours,
and they are still where forks come from.

Until the record moves to a SharePoint List with a Power Apps front end, discipline
has to do the work the software cannot yet do. This protocol is that discipline.

---

## 2. The one rule

> **One baton, never a copy.**
> At any moment exactly one file is the live record, and it lives in SharePoint.
> The copy on your device is a working scratch pad.

**In practice:** if you are about to email an inspection file to a colleague, stop.
Hand it over through the app and send them a link to the folder.

---

## 3. SharePoint folder structure

One folder per inspection, in the **Site Inspections** site. The app creates it on
the first upload and names it from the record, so it sorts and searches predictably:

```
Site Inspections  ▸  Documents/            (the URL calls this Shared Documents)
    INS-2026-0142 - Smith - 12 Marine Parade, Kirra/
        current/   ← exactly one draft file, ever. The live record.
        archive/   ← the frozen file from each completed handover
        wip/       ← automatic backups of work in progress. Never the baton.
        photos/    ← uploaded by the app itself
```

Each subfolder does one job, and the discipline collapses if they are merged:

- **`current/`** — one file and one file only. Two files here means something has
  gone wrong and must be resolved before anyone edits anything (see §8).
- **`archive/`** — the frozen snapshot at each handover. This is your rollback.
  Never delete from it.
- **`wip/`** — the app's own safety net, written every four minutes while an
  inspection is open and once more on leaving the form. One file per device.
  **A file in `wip/` is not the baton and never becomes one** — nothing that
  lists the baton looks in here. It exists so a lost phone does not lose a day.
- **`photos/`** — full-quality originals. **The app puts these here.** Nobody
  uploads photos by hand any more.

> **Why `wip/` is separate from `current/`.** Every backup changes the file's
> eTag, and the eTag in `current/` is exactly what a handover uses to tell
> "nobody has touched this" from "somebody else has handed over". Backing up into
> `current/` would fire that warning on your own saves, constantly, until people
> learned to ignore it — including the time it was real.

> **Why its own site.** Inspection media sits in Site Inspections rather than under
> the client folder, because client folders hold quotes and pricing. Uploading
> there would require giving every field inspector access to all of it.

### File naming

The app names exported files for you. Do not rename them.

```
DS_Draft_INS-2026-0142_Smith_S02-FIELD_2026-08-15T1430_JS.json
         └─ number ──┘ └who┘ └ stage ┘ └─── when ───┘ └ by
```

Automatic backups in `wip/` are named for the device rather than the moment, so
one device always overwrites its own backup and never somebody else's:

```
WIP_INS-2026-0142_S02-FIELD_JS_A47F2C.json
                                └ device
```

Photos are named the same way as drafts, adding which part of the form they came
from:

```
INS-2026-0142_Smith_2026-08-15_s4-wall-moisture-signs_001.jpg
```

So a file that has been downloaded or emailed still says whose job it is,
without anyone having to look the number up.

You can tell at a glance which file is current, who exported it, and from which
stage — without opening anything.

> **The folder name is fixed by the first upload.** It is built from the
> inspection number, the client and the address, and whichever of those are
> filled in at that moment are the ones it keeps. A record with none of them
> files as `Unfiled`. Filling the number in later corrects the record and the
> library columns but does **not** rename the folder or any photo already in it —
> which is why the app asks about blank fields before the first upload and again
> at the handover.

---

## 4. The handover ritual

Four steps, in this order, every time. **The order matters** — the last step is
what actually stops forks.

> **Changed in v1.4.** Steps 3 and 4 used to be done by hand, and on a phone they
> could not be done at all — the share sheet offered WhatsApp and Mail and no way
> to reach SharePoint. The app now does both itself. What follows is the ritual as
> it now stands; the manual version is kept below it, because it is still what you
> do when you have no signal.

1. **Set your stage and name.** At the top of the inspection, choose the Current
   stage and type your name. This is what stamps the filename and the audit trail.
2. **Tap *Hand over through SharePoint***. The button sits **at the top of the
   form**, in the row directly beneath the stage selector — not at the foot. The
   app uploads the record to this inspection's `current/` folder and moves the
   previous file into `archive/` — old steps 3 and 4, in that order, without you.
3. **Tell the next person**, with a link to the folder — not the file.
4. **Delete your device copy**, once they confirm they have it.

> **The buttons moved in v1.4.** *Hand over through SharePoint*, *Send report
> (email / SharePoint)*, *Share photo & video files*, *Share draft (offline
> fallback)* and *Print / PDF* all sit in one row at the top of the form. They
> used to be below every section, which on a phone meant scrolling past eleven
> sections to hand over. If you are training somebody from an older card, this is
> the difference.

### What the app asks you before it sends anything

**Blank filing details.** Five fields decide how a record *files* rather than what
it *says*, and the app names any that are blank before it does anything:

| Field | What it decides |
|---|---|
| Inspection number | The folder sorts by it, and every photo filename carries it |
| Client name | Names the folder, and pins into every photo filename |
| Property address | Names the folder |
| Inspection date | Indexed as a library column |
| Your name | Records who handed the record on |

It shows the folder the record will file as, and tells you the truth about
whether filling them in now would still change it. **OK hands over anyway;
Cancel goes back.** It asks once and it never blocks — a blank field mid-inspection
is legitimate, and a permanent warning is one people stop seeing.

This runs **before** anything is listed, moved or written, so cancelling leaves
SharePoint exactly as it was.

### What the app stops you doing

**The app will stop you** rather than guess, in two cases:

- **`current/` already holds two files.** It refuses and sends you to §8. Which
  of the two is the baton is not something software should decide.
- **Somebody else has handed over since you picked this up.** It shows what is in
  `current/` now, when it changed, and what you took, then offers **Stop** or
  **Continue anyway**. Continuing archives their file rather than deleting it, so
  their work is still recoverable — but it stops being the live record.

> **If the handover half-succeeds.** The app uploads your record to `current/`
> *before* it moves the old one to `archive/`, deliberately. If the move is
> refused — a permissions problem, usually — your record is safely the live one
> and there are simply two files in `current/`. The app says so and points at §8.
> An empty `current/` would be worse: it reads as lost data to whoever opens the
> folder, and there is no procedure for it.

### After you have handed over

The card on the home screen changes. It reads **HANDED OVER** with the date, says
the live record is in SharePoint, and sorts below any inspection you still hold.
Opening it asks first, and points you at *Take over an inspection from SharePoint*
— which brings down whatever has happened since, rather than reviving a snapshot.

> **Adding a photo after you have handed over.** It will upload to the right
> folder, but the record waiting in `current/` was written at the handover and
> will not know about it — so the next person will not see it attached. The app
> warns you and names the remedy: **hand the inspection over again** once the
> photo has uploaded, so the record catches up with the folder. It does not block
> you; adding a missed photo is a legitimate thing to do.

### Picking the baton up

**Tap *Take over an inspection from SharePoint*** on the home screen. It lists
every inspection with a file waiting in `current/` and brings the one you choose
onto your device. Nobody has to send you anything.

The list can be filtered by typing, and each row shows the inspection, the stage
it is at, and when it was handed over — so "the ones waiting on technical" is one
word rather than a scroll.

Taking it over makes you the holder, and the library columns say so within
seconds.

**Photos already uploaded stay in SharePoint.** They are not copied down, because
they are already beside the record in `photos/`. You will see each of them on the
form as a **thumbnail**; **tap one to bring the full-size original onto this
device** when you actually need it. A report sent from this device says which
photos it is showing as thumbnails rather than quietly looking complete.

### When you have no signal

Both paths still exist and are labelled *offline fallback*:

- *Share draft (offline fallback)* exports the file to the share sheet, photos
  embedded, exactly as before.
- *Import from a file (offline fallback)* takes one back in.

If you use these, **old steps 3 and 4 are yours again** — put the file in
`current/` and move the previous one to `archive/` as soon as you have signal.

**Before you hand over, check the photos have uploaded.** If anything is waiting,
an **Upload** button appears at the top of the form naming the count — *Upload 3
photos* — and shows progress while it runs: *Uploading · 2 left · 45%*. It
disappears when there is nothing left to send. The home screen says the same
thing across every inspection, and each card reads *3 files · all uploaded* or
*3 files · 1 waiting to upload*. Handing on a record whose photos are still
sitting on your device passes on an incomplete job.

---

## 5. Seeing where every inspection is

New in v1.4. Until now the folder list said what each inspection *was* and
nothing about who *had* it — so the one question this protocol exists to answer
could only be answered by ringing round.

### Four states, one vocabulary

The same words and the same colours are used by the app's browse list, the
take-over list, and the SharePoint library:

| Badge | Colour | What it means |
|---|---|---|
| **WAITING** | green | Nobody has it, and a file is sitting in `current/` ready to be picked up. Shows *last held by* whoever sent it. |
| **IN PROGRESS** | amber | Somebody has it on their device. Shows *held by* their name. |
| **NOT HANDED OVER** | grey | Photos have uploaded, but the record has never been sent. |
| **NO FILE IN CURRENT/** | red | The library says the record is waiting, and there is nothing in `current/` to pick up. Somebody moved or deleted it in SharePoint. |

> **What decides the badge — changed in v1.4.** The state is read from the
> `BatonStatus` **column**, not from whether a file is sitting in `current/`.
> Those are two different questions: `current/` says what the live record **is**,
> and the column says **who has it**. The app used to answer the second with the
> first, and because a takeover leaves the file exactly where the handover put it
> (§4), a record already on somebody's device read **WAITING** and was offered to
> the next person — which is the one thing this protocol exists to prevent.
> Decision log **D60** and **§4k**.

> **So a file in `current/` does not mean the record is free.** When a folder
> reads **IN PROGRESS**, the file still in `current/` is the copy that person
> took. It is not waiting for you, and the app will not offer it to you.

> **Why NOT HANDED OVER exists.** A folder is created the moment the first
> *photo* uploads, so an inspection nobody has ever handed over has an empty
> `current/` too. Reading that as "somebody has it" sent people looking for a
> colleague who was never involved.

> **Why NO FILE IN CURRENT/ exists.** Nothing the app does can produce it: a
> handover uploads the new file **before** it archives the old one, so `current/`
> holds one file or two, never none. It means somebody moved or deleted the file
> in SharePoint by hand. It is a real alarm, and it is not the same as *NOT
> HANDED OVER* — there, nothing was ever sent.

### Browse all inspections

*Browse all inspections* on the home screen lists **every** folder in the library
with its state said plainly, and tells you how many of them are waiting. Tap one
and you are offered, depending on its state:

- **Take it over** — only when the record is **WAITING**, which means nobody
  holds it. Bringing an inspection down makes you the holder.
- **Ask for the baton** — when somebody else has it. See below.
- **Force the handover** — administrators only, and only when the record cannot
  be picked up the ordinary way: somebody holds it (**IN PROGRESS**), or the file
  that should be in `current/` is gone (**NO FILE IN CURRENT/**). See §8.
- **View it** — read it without taking it. See below.
- **Open the folder in SharePoint** — the photos, `current/` and `archive/`.

> ***Take over* deliberately lists less.** It shows only what is actually waiting.
> An inspection sitting on somebody's device is not waiting for anyone, and
> offering it would invite two people to pick up the same job.

### Reading an inspection without taking it

Technical, sales and admin often need to read a job without becoming responsible
for it. **View it** opens the record in the form with **every field disabled** and
a banner reading *VIEW ONLY — nothing you change here is saved*. Nothing is
written to your device and nothing is written to SharePoint.

- If the inspection is **waiting**, you are reading the version in `current/`.
- If **somebody holds it**, you are still reading the file in `current/` — which
  is the copy they took — and the banner says so rather than calling it "ready to
  be picked up".
- Only when `current/` is **empty** does it fall back to the most recent file in
  `archive/`. "You cannot look at it because a colleague has it" is not an answer
  anybody would accept.

### Asking for the baton

When somebody else holds an inspection you need, **Ask for the baton** composes a
message through the share sheet naming the inspection, its stage, who holds it,
who wants it, and what they have to do. Send it by whichever channel that person
actually reads — SMS, WhatsApp, Teams, email.

On a desktop browser with no share sheet it is copied to the clipboard instead,
and the app says so.

> **Why not a notification.** In-app push would need the app installed to the
> Home Screen, permission granted, *and* a server to send from. The app is static
> files on GitHub Pages, so anyone running it in a browser tab would silently
> receive nothing — which is worse than no feature at all. Revisit when there is
> a server.

---

## 6. Stages and who holds the baton

The stage selector records who currently owns the record. Changing it is logged to
the audit trail with your name and the time, and it is written to the library's
`Stage` column at every upload and every handover.

| Stage | Who holds it | What they complete |
|---|---|---|
| `S01-OFFICE` | Office / admin | Section 01 — client and property details, documents, listing URL |
| `S02-FIELD` | Field inspector | Sections 02–06 and 03A — assessment, photos, hazards, access, discharge point |
| `S03-TECH` | Technical team | Sections 07–09 — repair approach, measurement schedule, drainage design |
| `S04-SALES` | Sales | Section 10 — pricing, timeline, exclusions, provisional sums |
| `S05-ADMIN` | Admin | Contract details, QBCC, final checks before the quote is issued |
| `S06-CLOSED` | Nobody — read only | Issued to the client. Reopen only by agreement. |

> **Why 03A is lettered.** The Safety, Access & Discharge section was numbered 03A
> rather than 04 so every existing section kept its number, and no existing SOP or
> downstream reference had to be renumbered.

---

## 7. Signing in, and who is an administrator

Photos and records upload under the identity of whoever is signed in, so
everything is attributed to a real person rather than to "the app".

- Sign in once per device, from the home screen, with your **Dryspace Microsoft
  account**. It is remembered.
- **Losing signal does not sign you out.** If you are ever asked to sign in again
  in the field, it is because the sign-in genuinely expired — nothing is lost, and
  the photos are still on the device.
- Access to the Site Inspections site is granted by permission group. Anyone who
  needs it and does not have it should ask the office rather than working around it.

### Administrators

One capability is restricted: **forcing a handover** (§8). It is offered only to
an account listed in the app's administrator list.

- The list is checked against the **signed-in Microsoft account**, not the name
  typed into the form — so it cannot be granted by typing somebody else's name.
- It currently holds **one address: `jamie@dryspace.com.au`**. To everyone else
  the option does not appear at all.
- The list is **empty by default** in the code. Nobody is an administrator until
  an address is deliberately added, so the feature cannot turn up by accident on
  somebody's phone.

Adding or removing an address is a code change to `SP_CONFIG.admins` in
`index.html`, which means a release. It is not a setting in SharePoint.

---

## 8. If something has already gone wrong

> The app points here by name. Two of its error messages say **"Handover Protocol
> §8"**, so this section stays numbered 8.

**Two files in `current/`**
Do not open either and start editing. Compare the timestamps and initials in the
filenames, agree with the two people involved which is current, move the other to
`archive/`, and note what happened. If this happened because a handover reported
that it could upload but could not archive, the **newer** file is yours and is
the live record — the timestamps in the filenames make that obvious.

**`current/` is empty and you expected a file**
Check the badge before assuming the worst. **NOT HANDED OVER** in grey means the
record has never been sent from anybody's device — the folder exists because
photos were uploaded to it. **IN PROGRESS** in amber means somebody has it; the
name is on the row, and *Ask for the baton* will compose the message for you.

**NO FILE IN CURRENT/** in red is the one to act on: the library says the record
is waiting and there is nothing there. The app cannot empty `current/`, so
somebody moved or deleted the file in SharePoint. Look in `archive/` and in
`wip/` first — the file is usually one of those, moved by hand. If it cannot be
found, an administrator can **Force the handover** from that folder, which brings
the most recent copy still in it back onto a device and marks the library
`Recovered`.

**The app warns you are about to overwrite newer work**
Importing an inspection that already exists shows both timestamps, both stages and
both editors, and warns you when the copy on your device is the newer one. Read it
rather than tapping through.

**Somebody else has handed over since you picked this up**
Choose **Stop** and go and talk to them first. **Continue anyway** does not delete
their work — it files their version into `archive/` and makes yours the live
record — but it does mean their file stops being what the next person picks up.

**You are offered "keep both"**
This creates a fork — two records carrying the same inspection number. Only do it
if you have been asked to.

**A device is lost, broken, or its owner has left**
This is what **Force the handover** is for, and it is administrators only (§7).
Browse all inspections → the inspection → *Force the handover*. It is offered on
**IN PROGRESS** and on **NO FILE IN CURRENT/** — the two states where the record
cannot be picked up the ordinary way — and never on one that is simply waiting,
where taking it over already works. The dialog says which of the two it was
reached from, because *"currently held by"* is a lie about somebody who handed
the record over properly. It takes the most
recent copy in SharePoint — the automatic backup in `wip/` if there is one,
otherwise the last file in `archive/` — brings it onto the administrator's device,
and marks the library so everyone can see it was taken rather than handed on:

```
BatonStatus = Recovered
BatonHolder = Jamie Stone, recovered from Peter Walsh
```

Both names are kept deliberately: *who had it before this was taken off them* is
the first question anybody asks. The recovered copy does **not** hold the baton
pointer, so if the original device ever resurfaces and tries to hand over, it
meets the warning rather than silently burying the recovered work. Hand it over
normally when you are done and it returns to the usual flow.

> **What forcing a handover cannot recover.** The automatic backup runs every
> four minutes. **A device that dies between backups loses up to four minutes of
> work**, and no feature fixes that. If the last backup is old, the confirmation
> says whose work it is taking and from when — read it before confirming.

> **If it says there is nothing to recover**, there is no `wip/` backup and
> nothing in `archive/` yet: the only copy really is on the missing device.

**Work in progress needs bringing back on a device you still have**
*Recover work in progress* on the home screen lists what has been backed up and
brings a copy down. Recovering one deliberately **clears the baton pointer** —
this device has not agreed with anything in `current/`, and the next handover will
say so and ask. That is the warning working, not a fault.

**A photo will not upload**
Tap *Try again*. If it keeps failing, tell the office **before deleting anything**.
A failed upload leaves the original untouched on the device, so nothing is lost
while it is being sorted out.

**Something was deleted**
Site recycle bin first (93 days), then the `archive/` folder, then the
*Download data backup (all inspections)* file from the app home screen. In that
order.

---

## 9. Photos and video

### Photos — the app handles these

Take photos **in the Camera app**, then attach them to the right field in the form.
Not through the form's own camera: the camera roll keeps an independent second
copy, and the location detail survives.

When you are back in signal, tap **Upload** at the top of the form, or **Upload
now** on the home screen. The app:

- keeps a full-quality original for evidence and a smaller copy so reports stay
  emailable;
- names every file by job, date and which part of the form it came from;
- files them into that inspection's `photos/` folder;
- **reads every file back out of SharePoint and checks it arrived complete** before
  counting it as done.

Nothing is removed from your device on the strength of an upload that has not been
confirmed.

Each file has its own status and its own reason if it stops, rather than one line
saying *Uploading…* for everything. If something needs attention the app says so
rather than claiming completion.

> **The first upload fixes the folder name.** If the inspection number, client or
> address is still blank, the app asks once before that first upload, names what
> is blank, and shows the folder it would file as. Cancel, fill them in, and
> upload — after the first file lands the folder name cannot be changed.

### Video — still manual

Video does not travel inside drafts or reports, and does not upload through the
app. It is too large.

**Set this on every field device before it goes out:**

- Settings → Camera → Record Video → **1080p HD at 30 fps**
- Settings → Camera → Formats → **High Efficiency**

Roughly 60 MB per minute instead of around 400 MB, with no loss of useful detail at
review size — a six-fold reduction for nothing.

Record with the Camera app, then upload to the inspection's folder using the
OneDrive app, which uploads in the background and can be left running.

> **This replaces the WhatsApp habit.** WhatsApp was used because it compresses and
> transfers in one step. This does the same thing without putting client property
> footage through a consumer messaging service.

---

## 10. SharePoint settings to turn on

One-time library settings on the **Site Inspections** site. These are what give you
rollback and protection against deletion. Set them before rollout, not after.

1. **Versioning.** Library settings → Versioning settings → create major versions,
   **keep 100**. Every overwrite becomes a restorable version. *(Done 15 Aug 2026.)*
2. **Recycle bin.** 93 days — the Microsoft default, and not adjustable. Deletions
   are recoverable within that window. *(Confirmed 15 Aug 2026.)*
3. **Restrict delete.** A custom permission level named **Contribute - No Delete**,
   assigned to field and technical staff. They can upload and edit but cannot
   delete. *(Created and assigned to Julie and Mike, 15 Aug 2026.)*
4. **Documents in the left navigation.** So the library is one click from the site
   home rather than buried. *(Done 15 Aug 2026.)*
5. **Add shortcut to OneDrive.** So the folders are reachable from the OneDrive app
   on the iPad — still needed for video.
6. **Add the index columns.** Library settings → Create column. Add these eight as
   **Single line of text**, and name them **exactly as written, with no spaces**:

   | Column | Holds | Written when |
   |---|---|---|
   | `InspectionNo` | INS-2026-0142 | Photo upload, handover, takeover |
   | `Client` | Smith | Photo upload, handover, takeover |
   | `Address` | 12 Marine Parade, Kirra | Photo upload, handover, takeover |
   | `Stage` | S02-FIELD | Photo upload, handover, takeover |
   | `InspectionDate` | 2026-08-15 | Photo upload, handover, takeover |
   | `LastEditor` | Jamie Stone | Photo upload, handover, takeover |
   | `BatonStatus` | Waiting / In progress / Recovered | Handover, takeover, forced handover |
   | `BatonHolder` | Jamie Stone | Handover, takeover, forced handover |

   The app fills these in as it creates each inspection folder, so the folder
   list becomes a searchable index of every job — no separate register to keep,
   and nothing that can fall out of step with the folders themselves.

   > **Spaces matter.** A column named "Baton Status" gets the internal name
   > `Baton_x0020_Status`, which will not match and the write is rejected. Create
   > them without spaces.

   *(The first six created 15 Aug 2026 and added to the default All Documents
   view. `BatonStatus` and `BatonHolder` added for v1.4.)*

   If the columns are missing the app carries on and simply does not fill them
   in — an upload or a handover is never refused because the index could not be
   written. **A column problem therefore fails silently, by design.** If the
   columns look empty after a handover, check the spelling before looking at
   anything else.

7. **Colour the `BatonStatus` column.** Column header → Column settings → Format
   this column → **Advanced mode** (the link is at the *bottom* of that pane,
   above Save/Cancel). Replace everything in the box with:

   ```json
   {
     "$schema": "https://developer.microsoft.com/json-schemas/sp/v2/column-formatting.schema.json",
     "elmType": "div",
     "style": {
       "display": "inline-block",
       "padding": "2px 10px",
       "border-radius": "12px",
       "font-weight": "600",
       "color": "#ffffff",
       "background-color": "=if(@currentField == 'Waiting', '#15803d', if(@currentField == 'In progress', '#b45309', if(@currentField == 'Recovered', '#7e22ce', '#6b7280')))"
     },
     "txtContent": "=if(@currentField == '', 'Not handed over', @currentField)"
   }
   ```

   The three colours are the same hex values the app uses, so green, amber and
   grey mean the same thing in SharePoint as they do on a phone. **Purple for
   `Recovered` must be present** — without it a forced handover shows grey and
   reads as a failure when it is not.

> **`Recovered` is a SharePoint-only word.** The app writes it and reads it, but
> shows it as **IN PROGRESS**, held by the administrator, with the previous
> holder's name carried along in `BatonHolder`. That is correct — somebody does
> now hold it — but if you are comparing a screen against the library, this is
> the one place the two vocabularies differ.

> **The app reads `BatonStatus` back — changed in v1.4, and this paragraph used to
> say the opposite.** It is what decides WAITING / IN PROGRESS, with the file in
> `current/` corroborating rather than deciding; **NO FILE IN CURRENT/** is what
> it says when the two cannot both be true. The column is therefore no longer
> only for sorting and colouring: **editing it by hand changes what the app
> offers.** Setting a waiting record to *In progress* hides *Take it over* from
> everybody; setting a held one to *Waiting* offers it to the next person while
> somebody still has it. The next handover or takeover overwrites whatever you
> typed. Decision log **D60** and **§4k**.

> **If a column write fails, nothing says so.** The app never lets a column
> problem block a handover — the record is the job and the columns are the index
> (D24) — so a failed write is silent, and a folder can sit reading *Waiting*
> after somebody has taken it. That is **OI-3**, and it is an open decision rather
> than an oversight. If a folder's badge disagrees with what you know to be true,
> the fix is a handover or a takeover, which rewrites both columns.

> **Verify the permission level with a real person, not on paper.** Ask someone on
> *Contribute - No Delete* to upload a file and then try to delete it. A permission
> level that looks right in settings and does not bite in practice is worse than
> none, because it is trusted.
>
> **Still open:** whether *Contribute - No Delete* permits the **archive move**.
> v1.4 moves a file at every handover, and a refusal there leaves two files in
> `current/` every time. Answer it by having Julie or Mike hand one inspection
> over **twice** and looking at `archive/`.

Together these answer the concern about someone accidentally or intentionally
deleting inspection records: versioning restores overwrites, the recycle bin
catches deletions, and the permission level prevents most of them happening.

---

## 11. Where this is heading

This protocol is an interim measure and it is honest about that. It is discipline
standing in for software.

The agreed destination is a SharePoint List with one item per inspection and a
Power Apps front end. At that point the record stops being a file and the baton
rule stops being needed.

The field structure locked in v1.2, and the media structure locked in v1.3, are the
specification for that build — so nothing done now is wasted.

**One known gap to close first.** A takeover reads the list of photos out of the
record in `current/`, which was written at the moment of handover. A photo
uploaded after that is in the right folder and referenced by nothing. The app
warns and names the remedy (§4), but the real answer is for a takeover to
reconcile against the `photos/` folder itself — the folder is the index, and a
list written at one moment cannot stay true. Worth doing before v1.5.

> **When to make the move.** The trigger is headcount and volume, not time. While
> it is a handful of people and a manageable number of live inspections, this
> protocol is cheaper than the migration.
