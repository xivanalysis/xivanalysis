- [ ] aflow drift in non-timeline visual?
- [x] show player actions for bahamut
- [ ] show status durations on timeline
- [ ] i mean this is core stuff but down for the count maybe?

# SMN Analysis (Nem's thoughts)

## General Fight Considerations
- [x] Egi use vs comp
- [ ] Important action count totals vs available fight time (i.e. are they losing uses of x)
- [x] DoT uptime
- [ ] Pot use & max use

## Opener
- [ ] Precast actions (r3 and w blade only)
- [ ] Pet Swapping?
- [x] Weave check
    - [ ] Better output for weave checks
- [ ] Opener DWT cut short for AF (check times)

## GCDs
- [ ] R3 vs R2 ratio
- [x] R4 use
- [x] R3s lost to R2s due to unnecessary casts vs big moves
    - [x] Severity rating for suggestion, maybe split into two suggestions
- [x] Average time between gcds

## oGCDs
- [x] Aetherflow
- [ ] Fester vs nonFester count
    - [x] ST entirely Festers apart from 1 painflare, unless a final aether rush is done to rush dwt/bahamut at the end
    - [ ] Cleave/AoE Painflares/Bane where applicable
- [x] Instances of doing > double weaves
- [x] General clipping (handled by weaving module)

## DoTs
- [x] M3 uptime
- [x] B3 uptime
- [ ] # of hardcasts
- [ ] Clipping

## DWT
- [x] R3s/R4s in DWT (generally 6 minimum, check if any R2s are present? Mistaaaaake)
    - [ ] Currently checks for _not_ specified skills. Should that be swapped?
- [x] Time in DWT (cutting short if mismanaging AF vs letting timer go on and letting AF get delayed more and more)
- [ ] Deathflare cancels
- [ ] Ruin spells under Ruination in DWT
- [ ] Tri-Disaster timings (vs alignment where applicable?)
- [ ] Outburst use for cleave/adds (consider targets with/without ruination, r3 vs r4 procs with the debuff)

## Bahamut
- [x] WW cast count
    - [x] (+ actions used to achieve, look at wasted actions? 12 is a colossal meme)
	- [ ] mark wasted actions?
- [x] AM cast count
- [x] look at timestamps of lost action vs summon bahamut to identify ghost
    - [x] if timestamp of final action >= summon time + 20000ms, action 100% ghost
    - [x] if timestamp of final action < summon time + 20000ms by x ms, ghost odds = high
        - [x] evaluate x for AM ghost (with action windup, 1s + ???)
        - [x] evaluate x for WW ghost
- [ ] Table view for Bahamuts instead of bullet list?
- [ ] Bahamut use for cleave/multi target - not sure how feasible this is, maybe a phase2

## Egi Stuff
- [ ] Pet actions #s
- [ ] Better pet action use (ifrit for st, garuda for aoe)
- [ ] Pet auto (burning crush etc) uptime

adding more will have to be done with subtracting things, 2k limit is hard
Alignment is one section I was also thinking of but that's so much harder to evaluate especially if everything is wishy washy
some of it's within your control, the rest is not. Do we want to look at the things that are in a player's control?
There's also a pyramid hierarchy diagram I was thinking of making to show elevations of hanging fruit
because sometimes people focus on stuff far higher up when for them they're still struggling with the first few steps
"Is it my opener?" when they are commiting big errors in play being a frequent one
or "Is it my gear?"
