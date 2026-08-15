# Handover & Version Control Protocol

**How one inspection passes safely from office, to field, to technical, to sales, to admin**

App v1.3 · Form 4.2 · Project 2.1 — Site Assessment
Live app: https://ds-js1.github.io/dryspace-inspect/

> **What changed in v1.3.** Photos now upload to SharePoint by themselves, so the
> old `media/` folder is gone and staff no longer upload photos through OneDrive.
> Everything for one inspection — the handover files and the photos — now sits in
> one folder. Sections 3, 7 and 8 changed most.

---

## 1. The problem this solves

An inspection is worked on by five people in sequence. The office starts it, the
field team completes the assessment, technical writes the specification, sales
prices it, admin issues it.

The app stores each inspection on the device it was entered on. Handover works by
exporting a file and importing it elsewhere — which means the record can be
copied, and two copies can drift apart.

> **The failure mode.** Two people hold a file carrying the same inspection
> number, both edit it, and the version that reaches the client is missing
> whichever changes the other person made. Nobody notices until the client asks
> about something that was quoted from the wrong copy.

Until the record moves to a SharePoint List with a Power Apps front end, discipline
has to do the work the software cannot yet do. This protocol is that discipline.

---

## 2. The one rule

> **One baton, never a copy.**
> At any moment exactly one file is the live record, and it lives in SharePoint.
> The copy on your device is a working scratch pad.

**In practice:** if you are about to email an inspection file to a colleague, stop.
Put it in the folder and send them the link.

---

## 3. SharePoint folder structure

One folder per inspection, in the **Site Inspections** site. The app creates it on
the first upload and names it from the record, so it sorts and searches predictably:

```
Site Inspections  ▸  Shared Documents/
    INS-2026-0142 - Smith - 12 Marine Parade, Kirra/
        current/   ← exactly one draft file, ever. The live record.
        archive/   ← the frozen file from each completed handover
        photos/    ← uploaded by the app itself
```

Each subfolder does one job, and the discipline collapses if they are merged:

- **`current/`** — one file and one file only. Two files here means something has
  gone wrong and must be resolved before anyone edits anything (see §8).
- **`archive/`** — the frozen snapshot at each handover. This is your rollback.
  Never delete from it.
- **`photos/`** — full-quality originals. **The app puts these here.** Nobody
  uploads photos by hand any more.

> **Why its own site.** Inspection media sits in Site Inspections rather than under
> the client folder, because client folders hold quotes and pricing. Uploading
> there would require giving every field inspector access to all of it.

### File naming

The app names exported files for you. Do not rename them.

```
DS_Draft_INS-2026-0142_S02-FIELD_2026-08-15T1430_JS.json
         └ number ──┘ └ stage ─┘ └── when ────┘ └ who
```

You can tell at a glance which file is current, who exported it, and from which
stage — without opening anything.

---

## 4. The handover ritual

Five steps, in this order, every time. **The order matters** — the last step is
what actually stops forks.

1. **Set your stage and name.** At the top of the inspection, choose the Current
   stage and type your name. This is what stamps the filename and the audit trail.
2. **Export.** Tap *Share draft (handover to field team)* at the foot of the form.
3. **Upload to `current/`.** Put the new file into the inspection's `current/` folder.
4. **Move the previous file to `archive/`.** Immediately, so `current/` holds
   exactly one file again.
5. **Delete your device copy.** Only after steps 3 and 4. Then tell the next
   person, with a link to the folder — not the file.

> **Do not skip step 5.** Leaving your copy on the device is how the same
> inspection ends up being edited in two places. If you are worried about losing
> work, that is what `archive/` is for.

**Before you hand over, check the photos have uploaded.** The home screen says
either how many files are waiting or *"All photos uploaded"*. Handing on a record
whose photos are still sitting on your device passes on an incomplete job.

---

## 5. Stages and who holds the baton

The stage selector records who currently owns the record. Changing it is logged to
the audit trail with your name and the time.

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

## 6. Signing in — new in v1.3

Photos upload under the identity of whoever is signed in, so uploads are
attributed to a real person rather than to "the app".

- Sign in once per device, from the home screen, with your **Dryspace Microsoft
  account**. It is remembered.
- **Losing signal does not sign you out.** If you are ever asked to sign in again
  in the field, it is because the sign-in genuinely expired — nothing is lost, and
  the photos are still on the device.
- Access to the Site Inspections site is granted by permission group. Anyone who
  needs it and does not have it should ask the office rather than working around it.

---

## 7. Photos and video

### Photos — the app handles these

Take photos **in the Camera app**, then attach them to the right field in the form.
Not through the form's own camera: the camera roll keeps an independent second
copy, and the location detail survives.

When you are back in signal, tap **Upload now**. The app:

- keeps a full-quality original for evidence and a smaller copy so reports stay
  emailable;
- names every file by job, date and which part of the form it came from;
- files them into that inspection's `photos/` folder;
- **reads every file back out of SharePoint and checks it arrived complete** before
  counting it as done.

Nothing is removed from your device on the strength of an upload that has not been
confirmed.

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

## 8. SharePoint settings to turn on

One-time library settings on the **Site Inspections** site. These are what give you
rollback and protection against deletion. Set them before rollout, not after.

1. **Versioning.** Library settings → Versioning settings → create major versions,
   keep 50. Every overwrite becomes a restorable version.
2. **Recycle bin.** Confirm site recycle bin retention (93 days by default).
3. **Restrict delete.** Give field and technical staff Contribute permissions with
   Delete removed, via a custom permission level.
4. **Add shortcut to OneDrive.** So the folders are reachable from the OneDrive app
   on the iPad — still needed for video.
5. **Add the index columns.** Library settings → Create column. Add these six as
   **Single line of text**, and name them **exactly as written, with no spaces**:

   | Column | Holds |
   |---|---|
   | `InspectionNo` | INS-2026-0142 |
   | `Client` | Smith |
   | `Address` | 12 Marine Parade, Kirra |
   | `Stage` | S02-FIELD |
   | `InspectionDate` | 2026-08-15 |
   | `LastEditor` | Jamie Stone |

   The app fills these in as it creates each inspection folder, so the folder
   list becomes a searchable index of every job — no separate register to keep,
   and nothing that can fall out of step with the folders themselves.

   > **Spaces matter.** A column named "Inspection No" gets the internal name
   > `Inspection_x0020_No`, which will not match and the write is rejected. Create
   > them without spaces.

   If the columns are missing the app carries on and simply does not fill them
   in — an upload is never refused because the index could not be written.

Together these answer the concern about someone accidentally or intentionally
deleting inspection records: versioning restores overwrites, the recycle bin
catches deletions, and the permission level prevents most of them happening.

---

## 9. If something has already gone wrong

**Two files in `current/`**
Do not open either and start editing. Compare the timestamps and initials in the
filenames, agree with the two people involved which is current, move the other to
`archive/`, and note what happened.

**The app warns you are about to overwrite newer work**
Importing an inspection that already exists shows both timestamps, both stages and
both editors, and warns you when the copy on your device is the newer one. Read it
rather than tapping through.

**You are offered "keep both"**
This creates a fork — two records carrying the same inspection number. Only do it
if you have been asked to.

**A photo will not upload**
Tap *Try again*. If it keeps failing, tell the office **before deleting anything**.
A failed upload leaves the original untouched on the device, so nothing is lost
while it is being sorted out.

**Something was deleted**
Site recycle bin first (93 days), then the `archive/` folder, then the weekly data
backup from the app home screen. In that order.

---

## 10. Where this is heading

This protocol is an interim measure and it is honest about that. It is discipline
standing in for software.

The agreed destination is a SharePoint List with one item per inspection and a
Power Apps front end. At that point the record stops being a file and the baton
rule stops being needed.

The field structure locked in v1.2, and the media structure locked in v1.3, are the
specification for that build — so nothing done now is wasted.

> **When to make the move.** The trigger is headcount and volume, not time. While
> it is a handful of people and a manageable number of live inspections, this
> protocol is cheaper than the migration.
