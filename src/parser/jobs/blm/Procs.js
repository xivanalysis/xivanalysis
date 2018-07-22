import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'

export default class Procs extends Module {
	static dependencies = [
		'castTime',
		'gcd',
		'suggestions',
	]
	name = 'Proc Cast Times'

    _firestarter = null
	_thundercloud = null

	constructor(...args) {
		super(...args)
		this.addHook('removebuff', {
			by: 'player',
			abilityId: STATUSES.THUNDERCLOUD.id,
		}, this._onRemoveThundercloud)
		this.addHook('removebuff', {
			by: 'player',
			abilityId: STATUSES.FIRESTARTER.id,
		}, this._onRemoveFirestarter)
		this.addHook('applybuff', {
			by: 'player',
			abilityId: STATUSES.THUNDERCLOUD.id,
		}, this._onApplyThundercloud)
		this.addHook('applybuff', {
			by: 'player',
			abilityId: STATUSES.FIRESTARTER.id,
		}, this._onApplyFirestarter)
	}

	_onRemoveThundercloud() {
		if (this._thundercloud !== null) {
			this.castTime.reset(this._thundercloud)
			this._thundercloud = null
		}
	}

	_onRemoveFirestarter() {
		if (this._firestarter !== null) {
			this.castTime.reset(this._firestarter)
			this._firestarter = null
		}
	}

	_onApplyThundercloud() {
		// TODO: This approach probably incorrectly counts hardcast thunder as instant if you gain thundercloud mid cast
		// TODO: How do we make this set cast time for all thunder versions?
		this._thundercloud = this.castTime.set([ACTIONS.THUNDER_3.id], 0)
	}

	_onApplyFirestarter() {
		this._firestarter = this.castTime.set([ACTIONS.FIRE_3.id], 0)
	}
}
