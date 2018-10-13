/**
 * @author Yumiya
 */
import Module from 'parser/core/Module'
import ACTIONS, {getAction} from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import math from 'mathjsCustom'
import {matchClosest} from 'utilities'

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

	// Represents a map of IDs and statuses for each enemy in this parse
	_enemies = {}

	// Represents the player statuses
	_player = {
		statuses: {},
		hasStatus(statusId) { return this.statuses[statusId] || false },
	}

	normalise(events) {

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
				// Fixing the multiplier
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

				// If it's a Pitch Perfect damage
				if (event.ability.guid === ACTIONS.PITCH_PERFECT.id) {

					ppEvents.push({event: event, rawDamage: event.amount / fixedMultiplier})

				// Otherwise, if it doesn't have a conditional potency (Sidewinder and Pitch Perfect), it will be used to calculate 'K'
				} else if (event.ability.guid !== ACTIONS.SIDEWINDER.id) {

					// ...let's not count Spears for now
					if (!this._player.hasStatus(STATUSES.THE_SPEAR.id)) {

						const critTier = this._parseCritBuffs(event)

						if (!damageInstances[critTier]) {
							damageInstances[critTier] = []
						}

						damageInstances[critTier].push({event: event, rawDamage: event.amount / fixedMultiplier})
					}
				}
			}
		}

		// We use the damage events to determine 'K'
		// tl;dr: 'K' is an approximation to damage to potency ratio, ignoring the natural 5% spread because we don't need this kind of precision
		const k = this._getK(damageInstances)

		// We now use 'K' to guesstimate PP potency:
		for (const pp of ppEvents) {

			// We already have the unbuffed damage, we now need to strip PP off crit/dhit mods:
			let rawDamage = pp.rawDamage

			if (pp.event.criticalHit) {
				rawDamage = Math.trunc(rawDamage / this._getCritMod(damageInstances))
			}

			if (pp.event.directHit) {
				rawDamage = Math.trunc(rawDamage / DHIT_MOD)
			}

			// We get the approximated potency and then match to the closest real potency
			const approximatedPotency = rawDamage * 100 / k
			const potency = matchClosest(ACTIONS.PITCH_PERFECT.potency, approximatedPotency)

			// We then add the amount of stacks to the event
			pp.event.stacks = ACTIONS.PITCH_PERFECT.potency.indexOf(potency) + 1

		}

		// Return all this shit
		return events
	}

	// Returns the enemy statuses state given the ID
	_getEnemy(targetId) {
		if (!this._enemies[targetId]) {
			this._enemies[targetId] = {
				statuses: {},
				hasStatus(statusId) { return this.statuses[statusId] || false },
			}
		}

		return this._enemies[targetId]
	}

	// Returns the accumulated crit modifier from all the currently active crit buffs/debuffs
	_parseCritBuffs(event) {
		// We need to get the specific enemy in case it's Chain Stratagem
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

	_getK(damageInstances) {
		// 'K' is an approximation to damage to potency ratio
		const values = []

		// We iterate over all damage events, across all crit buff tiers
		for (const critTier of Object.keys(damageInstances)) {
			for (const instance of damageInstances[critTier]) {

				// Let's not count auto attacks, because they have a different formula and aren't affected by the 20% trait
				if (instance.event.ability.guid !== ACTIONS.SHOT.id) {

					const skill = getAction(instance.event.ability.guid)

					// We have already calculated the unbuffed damage, now we need to strip crit/dhit modifiers
					let rawDamage = instance.rawDamage

					if (instance.event.criticalHit) {
						rawDamage = Math.trunc(rawDamage / this._getCritMod(damageInstances))
					}

					if (instance.event.directHit) {
						rawDamage = Math.trunc(rawDamage / DHIT_MOD)
					}

					// If we have the potency information for the current skill, we add it's potency ratio to the array of potential 'K' values
					if (skill.potency) {
						values.push(Math.round(rawDamage * 100 / skill.potency))
					}

				}
			}
		}

		// This method returns the mean of the data subset within {DEVIATION_PRECISION} standard deviations of the mean of the data set
		const mean = math.mean(values)
		const standardDeviation = math.std(values)

		return math.mean(values.filter(v => v > mean - DEVIATION_PRECISION * standardDeviation && v < mean + DEVIATION_PRECISION * standardDeviation))

	}

}
