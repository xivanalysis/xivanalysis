import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'

// TODO: Very certain this doesn't catch all procs correctly
// Use DEBUG_LOG_ALL_FIRE_COUNTS to display procs more easily and figure out why some aren't flagged correctly

const THUNDER_ACTIONS = [
	ACTIONS.THUNDER.id,
	ACTIONS.THUNDER_II.id,
	ACTIONS.THUNDER_III.id,
	ACTIONS.THUNDER_IV.id,
]

/*
   Value to multiply our first thunder's damage by to filter for T3Ps. Anything above _firstThunderDamage * T3P_DAMAGE_SCALAR
   will be counted. This scalar value is somewhat handwavy and was derived by looking at the values of the hardest hitting
   vanilla T3 casts and the weakest T3P casts across a couple different logs. ~3x seemed to be the norm, so I'm using 2.5x to
   play it safe without having to worry too much about monster direct crit vanilla casts getting counted. This could probably
   be improved even further but this ought to provide a good enough second layer of sanity checking for T3Ps.
*/
const T3P_DAMAGE_SCALAR = 2.5

export default class Procs extends Module {
	static handle = 'procs'
	static dependencies = [
		'castTime',
	]

	_firestarter = null
	_thundercloud = false
	_castingSpell = null

	_firstThunderDamage = null
	_thunderDamages = []

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
		this.addHook('begincast', {
			by: 'player',
		}, this._onBeginCast)
		this.addHook('cast', {
			by: 'player',
		}, this._onCast)
	}

	// Run a normaliser to record the Thunder 3 damage events so we can refer to them later
	// when evaluating the corresponding cast events
	normalise(events) {
		for (let i = 0; i < events.length; i++) {
			const event = events[i]

			if (!this.parser.byPlayer(event) || !event.ability) { continue }

			if (event.ability.guid === ACTIONS.THUNDER_III.id && event.type === 'damage') {
				if (!this._firstThunderDamage) { this._firstThunderDamage = event.amount }
				this._thunderDamages.push({
					timestamp: event.timestamp,
					amount: event.amount,
				})
			}
		}

		return events
	}

	// Keep track of casts we start to help look for instant casts
	_onBeginCast(event) {
		this._castingSpell = event.ability
	}

	// Consolidate old onCast functions into one central function
	_onCast(event) {
		// Skip proc checking if we had a corresponding begincast event or the begincast we recorded isn't the same as this spell (ie. cancelled a cast, used a proc)
		if (!this._castingSpell || this._castingSpell !== event.ability) {
			if (event.ability.guid === ACTIONS.FIRE_III.id) {
				if (this._firestarter !== null) {
					event.ability.overrideAction = ACTIONS.FIRE_III_PROC
				}
			} else if (THUNDER_ACTIONS.includes(event.ability.guid)) {
				if (event.ability.guid === ACTIONS.THUNDER_III.id) {
					// More rigorous check for Thunder 3 procs since FFlogs data is unreliable, check the damage amounts too
					const damage = this._thunderDamages.filter(damages => damages.timestamp === event.timestamp)[0].amount
					if (this._thundercloud || damage > this._firstThunderDamage * T3P_DAMAGE_SCALAR) {
						event.ability.overrideAction = ACTIONS.THUNDER_III_PROC // Mark this as a proc for use elsewhere
						this.castTime.set(THUNDER_ACTIONS, 0, event.timestamp, event.timestamp) // Note that this cast was 0 time
					}
				} else if (this._thundercloud) { // Less-careful about T1/2/4 proc tracking since they're not used in high-end settings as much/at all
					this.castTime.set(THUNDER_ACTIONS, 0, event.timestamp, event.timestamp)
				}
			}
		}
		if (this._castingSpell) { this._castingSpell = null }
	}

	_onRemoveThundercloud() {
		this._thundercloud = false
	}

	_onRemoveFirestarter() {
		if (this._firestarter !== null) {
			this.castTime.reset(this._firestarter)
			this._firestarter = null
		}
	}

	_onApplyThundercloud() {
		this._thundercloud = true // just save a boolean value, we'll handle the castTime information elsewhere
	}

	_onApplyFirestarter() {
		this._firestarter = this.castTime.set([ACTIONS.FIRE_III.id], 0)
	}
}
