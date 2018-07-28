import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'

// TODO: Very certain this doesn't catch all procs correctly
// Use DEBUG_LOG_ALL_FIRE_COUNTS to display procs more easily and figure out why some aren't flagged correctly

export default class Procs extends Module {
	static handle = 'procs'
	static dependencies = [
		'castTime',
		'gcd',
		'suggestions',
	]

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
		this.addHook('cast', {
			by: 'player',
			abilityId: ACTIONS.FIRE_III.id,
		}, this._onCastFireIII)
		this.addHook('cast', {
			by: 'player',
			abilityId: ACTIONS.THUNDER_III.id,
		}, this._onCastThunderIII)
	}

	_onCastFireIII(event) {
		if (this._firestarter) {
			event.ability.overrideAction = ACTIONS.FIRE_III_PROC
		}
	}

	_onCastThunderIII(event) {
		if (this._thundercloud) {
			event.ability.overrideAction = ACTIONS.THUNDER_III_PROC
		}
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
		this._thundercloud = this.castTime.set([ACTIONS.THUNDER_III.id], 0)
	}

	_onApplyFirestarter() {
		this._firestarter = this.castTime.set([ACTIONS.FIRE_III.id], 0)
	}
}
