/**
 * @author Yumiya
 */
import Module from '../../core/Module'
import STATUSES from 'data/STATUSES'
import ACTIONS from 'data/ACTIONS'

export default class Barrage extends Module {
	static handle = 'barrage'
	static dependencies = [
		'combatants',
	]

	_barrages = []
	_barrageCasts = []
	_unalignedBarrages = []

	constructor(...args) {
		super(...args)

		const buffFilter = {
			by: 'player',
			abilityId: STATUSES.BARRAGE.id,
		}

		const castFilter = {
			by: 'player',
			abilityId: ACTIONS.BARRAGE.id,
		}

		this.addHook('removebuff', buffFilter, this._onBarrageDrop)
		this.addHook('cast', castFilter, this._onBarrageCast)
		this.addHook('complete', this._onComplete)

	}

	_onBarrageDrop(event) {
		this._barrages.unshift(event)

		// Things that can remove barrage:
		// - Single-target weaponskills
		// - Falling off
		// - Death
	}

	_onBarrageCast(event) {
		this.barrageCasts.push(event)

		// Ignores last use alignment
		if (!this.combatants.select.hasStatus(STATUSES.RAGING_STRIKES.id) && this._timeUntilFinish(event) >= ACTIONS.BARRAGE.cooldown * 1000) {
			this._unalignedBarrages.push(event)
		}
	}

	_onComplete() {

	}
}
