import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

// Approximate downtime window to account for aligning GCDs and unreliable FBC procs:
// 2 GCDs at a slow 2.0s GCD, 600ms for animation lock, and another 250ms to deal with
// high end of "sane" ping or a late FBC proc clipping the GCD.
const DEFAULT_AVERAGE_DOWNTIME = 2425

export class OGCDDowntime extends CooldownDowntime {
	protected override defaultAllowedAverageDowntime = DEFAULT_AVERAGE_DOWNTIME
	protected override trackedCds = [
		{
			cooldowns: [this.data.actions.BROTHERHOOD],
			firstUseOffset: 11000,
		},
		{
			cooldowns: [this.data.actions.PERFECT_BALANCE],
			firstUseOffset: 9000,
		},
		{
			cooldowns: [this.data.actions.RIDDLE_OF_FIRE],
			firstUseOffset: 5000,
		},
		{
			cooldowns: [this.data.actions.RIDDLE_OF_WIND],
			firstUseOffset: 10000,
		},
	]
}
