import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'

// TODO: I dunno if this deserves an entire file to itself
export default class Enkindle extends Module {
	static dependencies = [
		'cooldowns'
	]

	on_applybuff(event) {
		// Only care about further ruin
		if (event.ability.guid !== STATUSES.FURTHER_RUIN.id) { return }

		// Further Ruin (R4 proc) also reduces the CD on Enkindle by 10 seconds
		this.cooldowns.reduceCooldown(ACTIONS.ENKINDLE.id, 10)
	}
}
