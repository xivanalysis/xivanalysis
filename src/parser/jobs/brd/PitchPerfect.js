/**
 * @author Yumiya
 */
import Module from 'parser/core/Module'
import ACTIONS, {getAction} from 'data/ACTIONS'
//import {getStatus} from 'data/STATUSES'
import STATUSES from 'data/STATUSES'
import math from 'mathjsCustom'

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

const DHIT_MOD = 1.25

const DISEMBOWEL_STRENGTH = 0.05
const TRAIT_STRENGTH = 0.20

const DEVIATION_PRECISION = 3

export default class PitchPerfect extends Module {
	static handle = 'pitchPerfect'
	static dependencies = [
		'additionalEvents', // eslint-disable-line xivanalysis/no-unused-dependencies
		'combatants',
		// Relying on the normaliser from this for the hit type fields
		'hitType', // eslint-disable-line xivanalysis/no-unused-dependencies
	]

	_enemies = {}
	_player = {
		critValues: [],
		statuses: {},
		get crit() { return 0 },
		hasStatus(statusId) { return this.statuses[statusId] || false },
	}

	normalise(events) {

		// tl;dr: 'K' is an approximation to damageToPotency ratio, ignoring the natural 5% spread because we don't need this kind of precision
		const k = {
			values: [],
			// This method returns the mean of the data subset within {DEVIATION_PRECISION} standard deviations of the mean of the data set
			get() {
				const mean = math.mean(this.values)
				const standardDeviation = math.std(this.values)

				return math.mean(this.values.filter(v => v > mean - DEVIATION_PRECISION * standardDeviation && v < mean + DEVIATION_PRECISION * standardDeviation))
			},
		}
		const damageInstances = []
		const ppEvents = []

		for (const event of events) {
			// Registers buffs/debuffs statuses on the respective entity (either player or enemies)
			if (event.type.startsWith('apply') || event.type.startsWith('remove')) {
				if (event.targetID === this.combatants.selected.id && event.ability) {
					this._player.statuses[event.ability.guid] = event.type.startsWith('apply')
				} else if (!event.targetIsFriendly) {
					const enemy = this._getEnemy(event.targetID)
					enemy.statuses[event.ability.guid] = event.type.startsWith('apply')
				}

			// For every damage event that:
			// - comes from the player
			// - is not a dot tick
			} else if (
				event.type === 'damage'
				&& event.sourceID === this.combatants.selected.id
				&& event.ability
				&& !event.tick
			) {

				// If it's a Pitch Perfect damage
				if (event.ability.guid === ACTIONS.PITCH_PERFECT.id) {

					ppEvents.push({event: event, rawDamage: event.amount / event.debugMultiplier})

				// Otherwise, if it doesn't have a conditional potency (Sidewinder and Pitch Perfect), it will be used to calculate 'K'
				} else if (event.ability.guid !== ACTIONS.SIDEWINDER.id) {

					// ...let's not count Spears for now
					if (!this._player.hasStatus(STATUSES.THE_SPEAR.id)) {

						let fixedMultiplier = event.debugMultiplier
						if (
							event.ability.guid !== ACTIONS.THE_WANDERERS_MINUET.id
							&& event.ability.guid !== ACTIONS.MAGES_BALLAD.id
							&& event.ability.guid !== ACTIONS.ARMYS_PAEON.id
						) {
							// Band-aid fix for disembowel (why, oh, why)
							if (this._getEnemy(event.targetID).hasStatus(STATUSES.PIERCING_RESISTANCE_DOWN.id)) {
								fixedMultiplier = Math.trunc((fixedMultiplier + DISEMBOWEL_STRENGTH) * 100) / 100
							}
							// AND ALSO FOR RANGED TRAIT, BECAUSE APPARENTLY IT'S PHYSICAL DAMAGE ONLY REEEEEEEEEE
							fixedMultiplier = Math.trunc((fixedMultiplier + TRAIT_STRENGTH) * 100) / 100
						}

						const critTier = this._parseCritBuffs(event)

						if (!damageInstances[critTier]) {
							damageInstances[critTier] = []
						}

						damageInstances[critTier].push({event: event, rawDamage: event.amount / fixedMultiplier})
					}
				}
			}
		}

		for (const prop of Object.keys(damageInstances)) {
			for (const instance of damageInstances[prop]) {

				// Let's not count auto attacks, because they have a different formula and aren't affected by the 20% trait
				if (instance.event.ability.guid !== ACTIONS.SHOT.id) {

					const skill = getAction(instance.event.ability.guid)
					// We reverse calculate the base damage, before buffs/debuffs and crit/dhit modifiers
					let rawDamage = instance.rawDamage

					if (instance.event.criticalHit) {
						rawDamage = Math.trunc(rawDamage / this._getCritMod(damageInstances))
					}

					if (instance.event.directHit) {
						rawDamage = Math.trunc(rawDamage / DHIT_MOD)
					}

					if (skill.potency) {
						k.values.push(Math.round(rawDamage * 100 / skill.potency))
					}

				}
			}
		}

		console.log(k.values)
		console.log(k.get())
		console.log(damageInstances)

		return events
	}

	_getEnemy(targetId) {
		if (!this._enemies[targetId]) {
			this._enemies[targetId] = {
				statuses: {},
				hasStatus(statusId) { return this.statuses[statusId] || false },
			}
		}

		return this._enemies[targetId]
	}

	_parseCritBuffs(event) {
		const enemy = this._getEnemy(event.targetID)
		let accumulatedCritBuffs = 0

		for (const modifier of CRIT_MODIFIERS) {

			let hasStatus = false

			if (modifier.id === STATUSES.CHAIN_STRATAGEM.id) {
				hasStatus = enemy.hasStatus(modifier.id)
			} else {
				hasStatus = this._player.hasStatus(modifier.id)
			}

			if (hasStatus) {

				accumulatedCritBuffs += modifier.strenght
			}

		}
		return accumulatedCritBuffs
	}

	// Sorry, but these constants are all fucking magic
	/* eslint-disable no-magic-numbers */
	_getCritMod(damageInstances) {
		// Alright, time to guesstimate crit rate
		const rates = []
		for (const critTier of Object.keys(damageInstances)) {
			const sampleSize = damageInstances[critTier].length
			const critAmount= damageInstances[critTier].filter(x => x.event.criticalHit).length
			const rate = Math.max((critAmount/sampleSize) - Number.parseFloat(critTier), 0)

			rates.push({rate: rate, amount: sampleSize})
		}
		const critRate = rates.reduce((acc, value) => acc + value.rate * value.amount, 0)/rates.reduce((acc, value) => acc + value.amount, 0)
		// Time to guesstimate the critical hit rate attribute
		const chr = (((critRate * 1000) - 50) * 2170/200) + 364

		// Time to guesstimate the critMod:
		return Math.floor((200*(chr - 364) / 2170) + 1400) / 1000

	}
	/* eslint-enable no-magic-numbers */

}
