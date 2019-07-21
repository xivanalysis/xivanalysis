# GNB Feature Suggestions

## Ammo
- [ ] Check for bad Burst Strikes - (i.e. when at 1 ammo + Bloodfest is on CD + Gnashing is off CD)
- [ ] Check for uses of Fated Circle on a single target (requires infrastructure work for `DamageEvent` to accept `'aoedamage'`)
- [X] Fix bug where uncomboed Solid Barrel counts toward Cartridge generation
- [X] Log waste by source somewhere in output
- [ ] Include End of Fight as a potential waste source

## Continuation
- [ ] Add checks for if the next Continuation was even usable before the fight ended - if not, don't penalize
- [ ] Consider keeping track of missed Continuations and logging them in a collapsed Rotation table

## No Mercy
- [ ] Show Danger Zone instead of Blasting Zone if we detect that the combatant is sub-80 (e.g., there is a Danger Zone used instead of a Blasting Zone)
- [X] Ignore missed GCDs on No Mercy windows that would expire after the end of the fight

## OGCDDowntime
- [ ] Figure out how charge systems work (requires infrastructure work)
