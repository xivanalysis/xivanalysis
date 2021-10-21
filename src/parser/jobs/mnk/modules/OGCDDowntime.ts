import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

// Approximate downtime window to account for aligning GCDs and unreliable FBC procs:
// 2 GCDs at a slow 2.0s GCD, 600ms for animation lock, and another 250ms to deal with
// high end of "sane" ping or a late FBC proc clipping the GCD.
const DEFAULT_AVERAGE_DOWNTIME = 2425

// Chakra delay offset is to allow for delaying other CDs to place an FBC since they can
// pop super fast during BH and are largely higher potency than other cooldowns. All
// other cooldowns should be used by the 16th second of the fight tho so here we are.
const MAX_CHAKRA_DELAY_OFFSET = 16000

export default class OGCDDowntime extends CooldownDowntime {
	override defaultAllowedAverageDowntime = DEFAULT_AVERAGE_DOWNTIME
	override trackedCds = [
		{
			cooldowns: [this.data.actions.BROTHERHOOD],
			firstUseOffset: 11000,
		},
		{
			cooldowns: [this.data.actions.ELIXIR_FIELD],
			firstUseOffset: MAX_CHAKRA_DELAY_OFFSET,
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
			cooldowns: [this.data.actions.SHOULDER_TACKLE],
			firstUseOffset: 2000,
		},
		{
			cooldowns: [this.data.actions.TORNADO_KICK],
			firstUseOffset: MAX_CHAKRA_DELAY_OFFSET,
		},
	]
}
