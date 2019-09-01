import ACTIONS from 'data/ACTIONS'
import CooldownDowntime from 'parser/core/modules/CooldownDowntime'

export default class OGCDDowntime extends CooldownDowntime {
	// Approximate downtime window to account for aligning derped setups and GCD pinning:
	// 2 GCDs under slow GL3 (2.07s GCD), 700ms for second half of GCD activation
	allowedDowntime = 4850
	trackedCds = [
		ACTIONS.BROTHERHOOD.id,
		ACTIONS.ELIXIR_FIELD.id,
		ACTIONS.PERFECT_BALANCE.id,
		ACTIONS.RIDDLE_OF_FIRE.id,
		ACTIONS.SHOULDER_TACKLE.id,
	]
}
