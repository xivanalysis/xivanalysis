# RDM Analysis (Jump's thoughts)

## Cooldowns
- [X] Fleche, Contre Sixte, Acceleration should be used on CD
- [ ] Corps-a-Corps and Displacement should be equal to or greater than the number of melee combos
- [ ] If the downtime in a fight is > 10s Corps-a-Corps and Displacement should be > melee combos
- [ ] TBD how we handle Embolden usage - raid or selfish?
- [ ] If Selfish Embolen use before first Riposte.
- [ ] if raid Embolden check against other raid Cooldowns if possible or if used on 4th or 5th GCD

## Gauge
- [ ] the Wasted Mana metric is not necessarily useful as a global.  Consider doing it by ability with grouping
- [ ] Track the mana gain from Manafication to ensure that the user was (45|45 - 65|65) when used.
- [ ] If Manafication is used in sub optimal ranges, check to see if boss is currently Invuln, if so allow it
- [X] Used Verholy when should have used Verflare or vice versa

## Dualcast
- [ ] It's not worth dumping a proc if you overflow 8+ mana, consider checking this as it's worth wasting dual castr if you aren't wasting this much mana.
- [ ] Ensure not overwriting Verstone/Verfire procs with their finishers
- [X] Ensure that Impact never drops - outside of downtime
- [ ] Determine if possible to verify that the player used vercure to bring up dualcast, but didn't waste it after during a boss invuln phase
- [X] Handle opener exception for Thunder/Areo

## General Casting
- [X] Track Dropping Impactful, Verstone, or Verfire
- [X] Track if Jolt wast cast while Impactful, Verstone, or Verfire were up or if Swiftcast was off CD
- [X] Dont' use Areo/Thunder while Stone/Fire are up
- [X] Don't use Flare/Holy when Fire/Stone are up
- [ ] Figure out how to split out 0 entries in the Overwrite/Invuln/Missed Trans/Plural tags
- [ ] Add support for AOE Checks on Scatter for Target Count

## Melee Combo
- [X] Derping a melee combo, either breaking it, or not finishing it.
- [X] Going into a melee combo without enough mana
- [X] Going into a melee combo with procs up
- [X] Going into a melee combo with low Black and fire is up
- [X] Going into a melee combo with low white and stone is up
- [ ] Allowing Finisher or Combo to timeout

## Weaving
- [ ] Don't use oGCDs after Displacement if > 30 seconds into a fight
