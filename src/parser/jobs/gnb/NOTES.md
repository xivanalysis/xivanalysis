# GNB Feature Suggestions

## Ammo
- [ ] Check for bad Burst Strikes - (i.e. when at 1 ammo + Bloodfest is on CD + Gnashing is off CD)
- [X] Check for uses of Fated Circle on a single target (requires infrastructure work for `DamageEvent` to accept `'aoedamage'`)
- [X] Fix bug where uncomboed Solid Barrel counts toward Cartridge generation
- [X] Log waste by source somewhere in output
- [ ] Include End of Fight as a potential waste source
	[Ryan note: because of the fact that we use action.ids for that, I am unsure of how to add that to waste, but I did add a suggestion if you have ammo leftover]

## Continuation
- [ ] Add checks for if the next Continuation was even usable before the fight ended - if not, don't penalize
	[Ryan's note: Find test cases of this, seems EXTREMELY niche]
- [ ] Consider keeping track of missed Continuations and logging them in a collapsed Rotation table (WIP)

## No Mercy

- [x] Show Danger Zone instead of Blasting Zone if we detect that the combatant is sub-80 (e.g., there is a Danger Zone used instead of a Blasting Zone)
	[Ryan note: Still uses Blasting Zone Icon, but the counter for the zone skill is incremented]
- [X] Ignore missed GCDs on No Mercy windows that would expire after the end of the fight

## OGCDDowntime
- [X] Figure out how charge systems work (requires infrastructure work)
