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

export default class RoyalRoadBandAid extends Module {
	static handle = 'royalroadbandaid'
	static dependencies = [
		'combatants',
		'enemies',
	]

	_critRate = 0
	_critRateList = []

	normalise(events) {
		for (let i = 0 ; i < events.length ; i++) {
			const event = events[i]
			if (event.type === 'damage' && event.ability) {
				if (SNAPSHOTTERS[event.ability.guid]) {
					SNAPSHOTTERS[event.ability.guid].dots.forEach(d => {
						DOTS[d].last = DOTS[d].current
						DOTS[d].current = event.timestamp + WHY_IS_THIS_GAME_LIKE_THIS
					})
				}
			}

			if (event.type === 'damage' && event.tick) {

				let accumulatedCritBuffs = 0

				const dot = DOTS[event.ability.guid]

				if (!dot) {
					// What the fuck?
					return
				}

				let hasSpear = false

				for (let i = 0; i < CRIT_MODIFIERS.length; i++) {

					const modifier = CRIT_MODIFIERS[i]

					let status = undefined

					if (modifier.id === STATUSES.CHAIN_STRATAGEM.id) {
						status = this.enemies.getEntity(event.targetID).getStatus(modifier.id, dot.current <= event.timestamp ? dot.current : dot.last)
					} else {
						status = this.combatants.selected.getStatus(modifier.id, dot.current <= event.timestamp ? dot.current : dot.last)
					}

					if (status) {

						if (status.ability.guid === STATUSES.THE_SPEAR.id) {
							// Royal Road is fucked, so let's not count that
							hasSpear = true
						}
						accumulatedCritBuffs += modifier.id === STATUSES.THE_SPEAR.id ? modifier.strenght * status.strengthModifier : modifier.strenght
					}

				}

				const calculatedCrit = this._adjustDecimal((event.expectedCritRate/1000) - accumulatedCritBuffs)
				console.log('Calculated: ' + calculatedCrit)

				if (hasSpear) {
					// Adjusts the modifier for Spear based on dot crit rate
					if (this._critRate > 0 && calculatedCrit - this._critRate !== 0) {
						if (this._adjustDecimal(calculatedCrit - this._critRate) === -0.05) {
							// Expanded Spear
							this.combatants.selected.getStatus(STATUSES.THE_SPEAR.id, dot.current <= event.timestamp ? dot.current : dot.last).strengthModifier = 0.5
						} else if (this._adjustDecimal(calculatedCrit - this._critRate) === 0.05) {
							// Enhanced Spear
							this.combatants.selected.getStatus(STATUSES.THE_SPEAR.id, dot.current <= event.timestamp ? dot.current : dot.last).strengthModifier = 1.5
						}
					}
					// Don't count this tick for crit guessing
					return
				}

				this._critRateList.push(calculatedCrit)

				this._critRate = 0
				for (let i = 0; i < this._critRateList.length; i++) {
					this._critRate += this._critRateList[i]
				}
				this._critRate = this._adjustDecimal(this._critRate/this._critRateList.length)

				console.log(this._critRate)
			}

		}

		return events
	}

	_adjustDecimal(number) {
		return Math.round(number*1000)/1000
	}

}
