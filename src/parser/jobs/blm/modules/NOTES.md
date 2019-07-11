## BLM Things
## List of BLM things to handle, with notes below completed or in-progress features
## Please try to keep this up to date, so there's a quick summary of what's in and what still needs work

Shadowbringers Updates:
Done:
- Added Action definitions for new actions
- Updated Gauge events to handle new actions
- Updated RotationWatchdog due to Convert becoming Manafont (assumed)
Needed:
- Review RotationWatchdog for new rotations (incl Despair usage)
- Double-check oGCDs after Xenoglossy aren't penalized
- Review of updates developed prior to expac to ensure they're working once post-expac logs are available
- Actual Action IDS/Icons for the new stuff in BLM.js

Letting procs drop
- Suggestions added, done.

Clipping gcds. Include fast-cast B3/F3
- Clipping/weaving checks are in for Triple and Procs
- TODO: Fast-cast F3/B3 weaving
- done.
- TODO: Add exceptions for Addle, Apoc, Shift, maybe Lucid
- done.
- TODO: Add exception for Eno in opener
- done.

Downtime between casts

Ending ice with hard thunder
- NOTE: May be able to cover this with FireCounter module
- T3inUI.js keeps track of that but not if F4s are being lost because of it.
- RotationWatchdog does both things now, so done.

Skipping B4 and getting less than 5 F4 next rotation
- incuclded in RotationWatchdog

Not getting 6+ F4 per rotation with B4
- Basic check for 6 F4 per rotation (8 with Convert) is in
- TODO: Add previous ice phase info to show bad T3 usage better
- done. Is included in RotationWatchdog
- TODO: Ignore phase-ending or battle-ending rotations
- added a suggestion for missing F4s due to B4 usage

Be fancy and analyze last rotations before phase/fight end to determine of skipping B4 previous rotation would have been a gain
- is added for the last Fire rotation at least if you actually end in AF and shows how many F4s you missed due to B4 usage.

Extraneous F1s per rotation
- is added now

Missing Sharp or Triple uses
- is added for all OGCDs

Missing LL uses. Ideally based on fight duration and inactive fight segments
- also added.

LL vs Circle of Power buff comparison
- added under LeyLines. It gives you the percentage of how long you've been in the circle.
- Now enhanced to track actual LL duration during the fight and show on the timeline

Scathe use outside of finishers

Overwritten or missing Fouls
- is in and should also work. More testing is appreciated.
- also added tracking of dropped fouls due to dropping eno

Missing aoe buffs compared to party

Eno dropping
- is in and should work. Needs probably more testing but I got rid of all the bugs I found

T4/T4p hitting 2 or less targets

Foul or Flare hitting 1 target when 2+ are active and in proximity

Custom proc icons for Firestarter and Thundercloud usage?
- Added to Rotation view
- TODO: General Rotation/Timeline support for job-specific display is planned
- TODO: FFLogs seems to randomly miss Thundercloud buff, which makes the current implementation unreliable. See https://www.fflogs.com/reports/FNaDPhvGTzJd8Wwn#fight=20&type=damage-done&translate=true for a parse with 22 t3p, but only one tc buff.
- We're pretty sure above log is just broken, haven't found any other instances of this actually being a problem. Considering TODO a non-issue until other evidence surfaces.

Check for movement during Swift/Triple or subsequent cast(s). Clipping is fine/less bad if movement was required

Check for Fouls that could be held for adds

Warn about T4/T4p usage on 2 or fewer targets

Confirm that proc marking carries over to all sections, especially Weaving. Fix it if it doesn't

Confirm last rotation check works correctly in Kefka. Fix it if not. See https://www.xivanalysis.com/analyse/kMAJTPDcBgqWYFfL/6/1/

Allow losing Convert uses if Convert's used during buff windows or for AOE

Check for hardcast T3 as first ice cast after fast-cast F3

Check for overkill on hardcasts (especially F4, Foul). Add notes about not hardcasting on things that are dead or will die before the cast can finish. Ignore end-of-fight casts (but do watch adds)

RotationWatchdog now ignores rotations that don't contain any Fire casts

Added a bugfix to keep Transpose spam during extended boss downtime from oscillating between recording a rotation and not

TODO: Add a re-opener module to handle the more intricate cases that a boss returning to the field causes that differ from the standard rotation
