/**
 * @author Yumiya
 */

import Module from '../../core/Module'
import STATUSES from 'data/STATUSES'
import ACTIONS from 'data/ACTIONS'

// Relevant crit buffs
const CRIT_MODIFIERS = [
	{
		id: STATUSES.BATTLE_LITANY.id,
		strenght: 0.15,
	},
	{
		id: STATUSES.CHAIN_STRATAGEM.id,
		strenght: 0.15,
	},
	{
		id: STATUSES.CRITICAL_UP.id,
		strenght: 0.02,
	},
	{
		id: STATUSES.THE_SPEAR.id,
		//fuck royal road
		strenght: 0.10,
	},
	{
		id: STATUSES.STRAIGHT_SHOT.id,
		strenght: 0.10,
	},
]
// Time in milliseconds between a dot (re)application and the actual snapshot of statuses
const WHY_IS_THIS_GAME_LIKE_THIS = 700

// Dots
const DOTS = {
	[STATUSES.STORMBITE.id]: {
		current: 0,
		last: 0,
	},
	[STATUSES.CAUSTIC_BITE.id]: {
		current: 0,
		last: 0,
	},
}

// Actions that (re)apply dots
const SNAPSHOTTERS = {
	[ACTIONS.STORMBITE.id]: {
		dots: [STATUSES.STORMBITE.id],
	},
	[ACTIONS.CAUSTIC_BITE.id]: {
		dots: [STATUSES.CAUSTIC_BITE.id],
	},
	[ACTIONS.IRON_JAWS.id]: {
		dots: [STATUSES.STORMBITE.id, STATUSES.CAUSTIC_BITE.id],
	},
}

export default class CritRate extends Module {
	static handle = 'critrate'
	static dependencies = [
		'combatants',
		'enemies',
	]

	_critRate = 0

	constructor(...args) {
		super(...args)

		this.addHook('damage', {by: 'player'}, this._onDotTick)
		this.addHook('damage', {by: 'player'}, this._onCast)

	}

	_onCast(event) {

		if (SNAPSHOTTERS[event.ability.guid]) {
			SNAPSHOTTERS[event.ability.guid].dots.forEach(d => {
				DOTS[d].last = DOTS[d].current
				DOTS[d].current = event.timestamp + WHY_IS_THIS_GAME_LIKE_THIS
			})
		}
	}

	_onDotTick(event) {
		// Get the crit rate from DoT tick timestamps
		if (event.tick) {

			let accumulatedCritBuffs = 0

			const dot = DOTS[event.ability.guid]

			if (!dot) {
				// What the fuck?
				return
			}

			const buffList = []

			for (let i = 0; i < CRIT_MODIFIERS.length; i++) {

				const modifier = CRIT_MODIFIERS[i]

				let status = undefined

				if (modifier.id === STATUSES.CHAIN_STRATAGEM.id) {
					status = this.enemies.getEntity(event.targetID).getStatus(modifier.id, dot.current <= event.timestamp ? dot.current : dot.last)
				} else {
					status = this.combatants.selected.getStatus(modifier.id, dot.current <= event.timestamp ? dot.current : dot.last)
				}

				if (status) {

					// Royal Road is fucked, so let's not count that
					if (status.ability.guid === STATUSES.THE_SPEAR.id) {
						return
					}

					buffList.push(Object.assign(status))
					accumulatedCritBuffs += modifier.id === STATUSES.THE_SPEAR.id ? modifier.strenght * status.strengthModifier : modifier.strenght
				}

			}
			const calculatedCrit = this._adjustDecimal((event.expectedCritRate/1000) - accumulatedCritBuffs)

			this._critRate = calculatedCrit

		}
	}

	_adjustDecimal(number) {
		return Math.round(number*1000)/1000
	}

	getCurrentCritRate() {
		return this._critRate
	}
}
