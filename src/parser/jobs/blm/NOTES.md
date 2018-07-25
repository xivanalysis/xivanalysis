## BLM Things
## List of BLM things to handle, with notes below completed or in-progress features
## Please try to keep this up to date, so there's a quick summary of what's in and what still needs work

Letting procs drop

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
 
Skipping B4 and getting less than 5 F4 next rotation

Not getting 6+ F4 per rotation with B4
- Basic check for 6 F4 per rotation (8 with Convert) is in
- TODO: Add previous ice phase info to show bad T3 usage better
- TODO: Ignore phase-ending or battle-ending rotations
- TODO: Check for fast F3 > ... > fast B3 to avoid showing F3 > trans > trans > trans > B3

Be fancy and analyze last rotations before phase/fight end to determine of skipping B4 previous rotation would have been a gain

Extraneous F1s per rotation

Missing Sharp or Triple uses

Missing LL uses. Ideally based on fight duration and inactive fight segments

LL vs Circle of Power buff comparison

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
