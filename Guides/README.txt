DRYSPACE — PRINTED GUIDES
App v1.4 · Form 4.2

The four procedures a person follows away from a screen, as PDFs.


WHAT BELONGS HERE
---------------------------------------------------------------------------
01_Setup and User Guide_v1.4.0.pdf               staff — installing and using it
02_Iteration Guide_v1.4.0.pdf                    you — changing the app safely
03_Handover and Version Control Protocol_v1.4.0.pdf staff — passing a job on
05_Release Protocol_v1.4.0.pdf                   you — shipping a version

The gap at 04 is deliberate. The Dryspace Context Brief exists to be pasted into
an AI tool, and a PDF makes copying harder rather than easier. Same reasoning for
the Field App Architecture Template. Both of those now live outside this app
folder, in 00_AI Tools in Development\_Shared\, because they describe how
Dryspace builds any field app rather than this one. And docs\DECISION-LOG.md
grows continuously, so a printed copy would be stale within a week.


THESE ARE GENERATED — DO NOT EDIT THEM
---------------------------------------------------------------------------
Each PDF is produced from the markdown file of the same name in the folder
above. That markdown is the source. Editing a PDF creates a second version of
the truth that nobody can tell apart from the first.

To regenerate:
  Open the .md in a browser or editor, then Print -> Save as PDF.
  Background graphics ON, or coloured panels print as empty white boxes.

Replace the previous version's PDF rather than keeping both. Two versions on a
shelf is how somebody reads the wrong one.


WHY THE VERSION IS IN THE FILENAME
---------------------------------------------------------------------------
The markdown carries no version; the PDF does. That asymmetry is the point.

The markdown lives in git, which already knows every version. Renaming it each
release would churn the history and break every link pointing at it.

The PDF is a detached thing somebody may be holding weeks later, with no way to
tell whether it still matches the app. With the version in its name, staleness
is visible to anyone: the app's home screen says v1.4, the PDF in your hand says
v1.3, so it is out of date. No process, no discipline, no memory required —
just two numbers that do not match.

tests.html checks these exist for the current version, so a release cannot pass
while the guides are stale.
