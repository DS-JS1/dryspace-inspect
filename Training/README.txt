DRYSPACE — SITE INSPECTION APP TRAINING PACK
Version 2.1 · App v1.4 · Form 4.2
Companion to 03_Handover and Version Control Protocol

Replaces the v1.2.1 training pack. That pack is superseded and should not be
issued to anyone — it describes a folder structure and a photo workflow that no
longer match the app.


WHAT IS IN HERE
---------------------------------------------------------------------------
Workflow_Chart.html        The whole picture. Six stages, the handover, what
                           happens to a photo, and where the record goes next.
                           Open in a browser. Prints to A3 landscape, one
                           section per sheet, so any single part can be pinned
                           up on its own.

Quick_Card_Handover.svg    A4 portrait. Print, laminate, one per person and one
                           in each vehicle. The four handover steps and where
                           the files live.

Quick_Card_Photos.svg      A4 portrait. NEW in v1.3 — how site photos get from
                           the device into SharePoint, and what to do when
                           something looks wrong.

Training_Module.html       Self-paced module, about 12 minutes. Works offline,
                           stores nothing, needs no login. Ends with a knowledge
                           check that can be re-run any time.

Setup_and_Use_Deck.html    The slide deck for walking a group through setup
                           and use. 17 slides, about 30 minutes with questions.
                           Open in a browser and present full screen: arrow
                           keys or Space to move, N for the presenter notes.
                           Works offline, stores nothing, needs no login.
                           Replaces Setup_and_Use_Presentation.pptx — see the
                           note at the end of the v1.4 section below.


Onboarding_Emails.md       Two email templates for inviting a new inspector.
                           Copy, paste, change the names. Send the second only
                           after they confirm the app is installed.


MAKING PDFs
---------------------------------------------------------------------------
The .svg and .html files are the editable sources. PDFs are generated from them.

  python tools\make_guides.py

That produces the four guides in Guides\ and both A4 cards here, all named for
the current APP_VER. Run it whenever the version changes — tests.html fails
until the guides match.

Still done by hand:
  Chart      Open Workflow_Chart.html, then Print → Save as PDF → A3 landscape,
             background graphics ON.
  Deck       Open Setup_and_Use_Deck.html, then Print → Save as PDF → A4
             landscape, background graphics ON. One slide per page, presenter
             notes included — that export is the handout.

Background graphics ON matters. Without it the navy headers and the coloured
panels print as empty white boxes.


WHAT CHANGED IN v1.4 — READ THIS BEFORE RETRAINING ANYONE
---------------------------------------------------------------------------
1. The handover is FOUR steps now, not five.
   The app files the record into current/ and moves the old one to archive/
   itself. Anyone trained on v1.3 needs the handover card again — this is the
   change most likely to be done the old way out of habit.

2. An inspection can be picked UP from SharePoint, not just put down.
   "Take over an inspection from SharePoint" on the home screen. On a phone this
   was not possible at all before, which is why field staff were being emailed
   files.

3. Work in progress is backed up automatically, to a wip/ folder.
   A lost or broken device no longer means a lost day. Stress in training that
   wip/ is NEVER the baton — the live record is always the file in current/.

4. The app warns if two people have worked the same inspection.
   It names who and when and asks before continuing. It archives their version
   rather than deleting it.

5. The buttons moved to the top of the form.
   The action row — Hand over through SharePoint, Send report, Share photo &
   video files, Share draft, Print / PDF — sits directly beneath the stage
   selector now, not below every section. Anything showing these at the FOOT of
   the form is out of date.

6. Photos taken over from SharePoint arrive as thumbnails.
   Marked "in SharePoint · tap to fetch". The bytes are already in photos/, so
   they come down on demand. Worth saying in training: with no signal, a
   thumbnail is all you have — fetch what you need before you go down.

NOTE ON THE DECK: Setup_and_Use_Presentation.pptx was DELETED, along with its
exported PDF. It taught the old five-step handover, and it was the only item in
this pack not generated from source — so unlike everything else here, it could
not simply be regenerated at v1.4.

A deck teaching a handover the app no longer performs is worse than no deck at
all, and a versioned filename only makes staleness visible to somebody who thinks
to check. Editing it was judged more work than starting again.

The replacement is Setup_and_Use_Deck.html, built from scratch in August 2026.
It is HTML rather than PowerPoint deliberately, and that is the whole point: the
reason the old deck went stale and could not be recovered is that it was the one
item here not held as editable source alongside the rest. The new one is plain
text in the same folder as everything else, so a grep for a button name finds it,
and it prints to PDF like the chart does.


WHAT CHANGED IN v1.3
---------------------------------------------------------------------------
1. Photos now upload to SharePoint by themselves.
   Previously photos only travelled inside the draft file and the report. Now
   the full-quality originals go to the Site Inspections library. This is the
   single biggest change for field staff and is why Quick_Card_Photos exists.

2. Staff sign in once, with their Dryspace Microsoft account.
   New behaviour. Nothing else in the app requires it, and losing signal does
   not sign anyone out.

3. One folder per inspection, holding everything.
   current/, archive/ and photos/ now sit together in the Site Inspections
   library. The old pack described photos living in a separate media/ folder
   under the job — that is no longer correct.

4. Inspection numbers are written INS-2026-0142.
   The app previously prompted for the short form. Both the app and the folder
   naming now use the year-based form throughout.

5. The app tells you when it has been updated.
   A green bar appears saying a new version is ready, with an Update button, and
   there is a "Check for app update" button on the home screen. Updates no
   longer happen silently.

6. Nothing is deleted until an upload has been confirmed.
   The app reads every uploaded file back and checks it arrived complete before
   treating it as done. Worth saying out loud when training — the first question
   people ask is whether they can lose photos.


HOW TO USE IT
---------------------------------------------------------------------------
New starter    Module first, then hand them both laminated cards. Setup_and_Use_Deck
               if you are onboarding more than one person at once.
Existing team  Walk through Workflow_Chart at a toolbox meeting (15 minutes),
               focusing on sections 02 and 03 — the handover and the photo path.
               The photo card is new to everyone, including experienced staff.
Refresher      The module can be re-run any time; the knowledge check resets.

One thing worth demonstrating rather than describing: take a photo, attach it,
show the count of files waiting, upload it, and show it appear in SharePoint.
That single demonstration answers more questions than any amount of explaining.


KEEPING IT CURRENT
---------------------------------------------------------------------------
These assets say the same things in three different ways, and they will
contradict each other if only one is edited. If the protocol or the app changes,
update all of them in the same sitting.

The Workflow_Chart is now the only overview document — the separate A3 handover
flowchart from the v1.2.1 pack was folded into it, because two charts describing
one process is how they drift apart.
