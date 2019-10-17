# WAR TODOs

## Known Bugs
- [ ] Storm's Eye uptime can go over 100% because the denominator of uptime
      subtracts out invuln time, but the numerator doesn't. Likely to be fixed
      in core, rather than in this module specifically.

## Offensive Cooldown Usage

- [ ] Track how often offensive cooldowns were available but unused for.
- [ ] Upheaval tracking (maybe count the drift in seconds, as well as percent
      usage?)
- [ ] Infuriate tracking (Depends on having something for charge actions)
- [ ] Maybe IR tracking? A lack of IRs should be obvious from its own module,
      but downtime could make things look weird when they're actually ok.
