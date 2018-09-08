import CoreGlobalCooldown from 'parser/core/modules/GlobalCooldown'
import STATUSES from 'data/STATUSES'
import ACTIONS from 'data/ACTIONS'

export default class GlobalCooldown extends CoreGlobalCooldown {
	static dependencies = [
		...CoreGlobalCooldown.dependencies,
		'combatants',
	]

	_tcjUses = 0

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.TEN_CHI_JIN.id}, this._onCastTcj)
	}

	_onCastTcj() {
		this._tcjUses++
	}

	getUptime() {
		// Include the total TCJ duration (minus 50% of a GCD per cast) in our uptime calculation so it doesn't count against GCD usage
		return super.getUptime() + this.combatants.getStatusUptime(STATUSES.TEN_CHI_JIN.id) - (this._tcjUses * this.getEstimate() / 2)
	}
}
