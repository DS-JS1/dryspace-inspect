DRYSPACE — SITE INSPECTION APP TRAINING PACK
Version 2.0 · App v1.3 · Form 4.2
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
                           in each vehicle. The five handover steps and where
                           the files live.

Quick_Card_Photos.svg      A4 portrait. NEW in v1.3 — how site photos get from
                           the device into SharePoint, and what to do when
                           something looks wrong.

Training_Module.html       Self-paced module, about 12 minutes. Works offline,
                           stores nothing, needs no login. Ends with a knowledge
                           check that can be re-run any time.

Setup_and_Use_Presentation.pptx
                           Slide deck for walking a group through setup and use.
                           This is the EDITABLE SOURCE — a deck has no plain-text
                           original, so the .pptx is what you change.

Setup_and_Use_Presentation_v1.3.0.pdf
                           Generated from the .pptx for sending and printing. Do
                           not edit it. Regenerate and rename on each release,
                           the same as the guides.


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

Background graphics ON matters. Without it the navy headers and the coloured
panels print as empty white boxes.


WHAT CHANGED IN v1.3 — READ THIS BEFORE RETRAINING ANYONE
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
New starter    Module first, then hand them both laminated cards.
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
