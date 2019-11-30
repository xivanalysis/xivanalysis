import ACTIONS from 'data/ACTIONS'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

// Approximate downtime window to account for aligning derped setups and GCD pinning:
// 2 GCDs under slow GL3 (2.07s GCD), 700ms for second half of GCD activation
const DEFAULT_ALLOWED_DOWNTIME = 4850

export default class OGCDDowntime extends CooldownDowntime {
	defaultAllowedAverageDowntime = DEFAULT_ALLOWED_DOWNTIME
	trackedCds = [
		{cooldowns: [ACTIONS.BROTHERHOOD]},
		{cooldowns: [ACTIONS.ELIXIR_FIELD]},
		{cooldowns: [ACTIONS.PERFECT_BALANCE]},
		{cooldowns: [ACTIONS.RIDDLE_OF_FIRE]},
		{cooldowns: [ACTIONS.SHOULDER_TACKLE]},
	]
}
