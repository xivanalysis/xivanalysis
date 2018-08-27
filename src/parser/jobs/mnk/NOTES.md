## how2monk good and punch other things good too

### Uptime
- [?] Don't clip or drop Demolish by more than 2 seconds, unless reapplying would be on GL0
- [ ] Avoid GL0 Demolish applications, if opener or downtime ignore this
- [x] GL3 uptime
- [ ] GL3 efficient recovery
- [x] GL3 holding with RoE
- [ ] Advise when downtime was short enough and damage taken for RoE?
- [x] Wasted RoE
- [ ] GL loading with RoW (warn on WT without RoW after it)
- [ ] General auto-attack uptime
- [ ] Earth Tackle, not even once
- [x] Fists, make sure at least one is up
- [ ] Fists of Fire uptime?
- [x] Dragon Kick uptime and clipping
- [x] Twin Snakes uptime and clipping

### AoE
- [x] Make sure there's enough enemies for RB or AotD effectiveness
- [ ] Allow AotD for Silence if we can tell if the enemy is actually interrupted
- [ ] Warn on RB being used as a range extender

### Tornado Kick
- [ ] Minor on 8th RoF GCD instead of 9th
- [ ] Major if just after RoF drops
- [ ] Check recovery doesn't take more than 4 GCDs (PB is 3, ending before Snap and using RoW is 4)
- [ ] Use before forced downtime longer than RoE can be used, this might be fight specific and is hard to track since FFLogs is weird about GL refreshes
- [ ] Implement setup/recovery scenarios? Usually this is just "fix your opener"

### Positionals
- [ ] Can kinda guess this from the damage mainly because MNK potency is high but it's a bit giri-giri
- [x] Crit the Boot

### Buff Windows
- [ ] RoF basically on CD, take downtime into account or fights that derp a window
- [ ] Brotherhood, same as RoF besides slight variance for duration
- [ ] RoF should last 9 GCDs
- [ ] RoF and BH overlap drift
- [ ] IR for every Howling and second Elixir
- [ ] IR-RoF drift, every second RoF should include an IR
- [ ] Howling and Elixir drift, they should ideally be weaved in the same GCD, or no more than 1 GCD apart

### Forms
- [x] Reset forms by using Opo-Opo form skills in a different form
- [x] Form expiry (taking over 10s to transition)
- [x] Form Shifting under PB (WHY IS THIS A THING?)
- [x] Using formless DK or AotD
- [x] Form Shifting mid-combo

### Chakras
How do we track this? There's a game packet for meditative brotherhood procs but FFLogs doesn't use it
Maybe check for FBC being used at low GL when the next GCD gives a stack
