import React, {Fragment} from 'react'

//import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
//TODO: Should possibly look into different Icons for things in Suggestions

//Mana Gains and Expenditures
const MANA_GAIN = {
	[ACTIONS.VERSTONE.id]: {white: 9, black: 0},
	[ACTIONS.VERFIRE.id]: {white: 0, black: 9},
	[ACTIONS.VERAREO.id]: {white: 11, black: 0},
	[ACTIONS.VERTHUNDER.id]: {white: 0, black: 11},
	[ACTIONS.VERHOLY.id]: {white: 21, black: 0},
	[ACTIONS.VERFLARE.id]: {white: 0, black: 21},
	[ACTIONS.JOLT.id]: {white: 3, black: 3},
	[ACTIONS.JOLT_II.id]: {white: 3, black: 3},
	[ACTIONS.IMPACT.id]: {white: 4, black: 4},
	[ACTIONS.SCATTER.id]: {white: 3, black: 3},
	[ACTIONS.ENCHANTED_RIPOSTE.id]: {white: -30, black: -30},
	[ACTIONS.ENCHANTED_ZWERCHHAU.id]: {white: -25, black: -25},
	[ACTIONS.ENCHANTED_REDOUBLEMENT.id]: {white: -25, black: -25},
	[ACTIONS.ENCHANTED_MOULINET.id]: {white: -30, black: -30},
}

export default class Gauge extends Module {
		static handle = 'gauge'
		static dependencies = [
			'combatants',
			'cooldowns',
			'suggestions',
		]
		//Keeps track of our current mana gauge.
		_whiteMana = 0
		_blackMana = 0
		//Keeps track of overall wasted mana
		_whiteManaWasted = 0
		_blackManaWasted = 0

		_whiteManaLostToImbalance = 0
		_blackManaLostToImbalance = 0

		_whiteOverallManaGained = 0
		_blackOverallManaGained = 0

		constructor(...args) {
			super(...args)

			this.addHook('cast', {by: 'player'}, this._onCast)
			this.addHook('complete', this._onComplete)
		}

		_calculateManaImbalance(white, black) {
			if (white && this._blackMana - this._whiteMana > 30) {
				//console.log(`Imbalance White Lost, Current White: ${this._whiteMana} Current Black: ${this._blackMana}`)
				//If we have more than 30 black mana over White, our White gains are halved
				this._whiteManaLostToImbalance += Math.ceil(white/2)
				white = Math.floor(white/2)
			}

			if (black && this._whiteMana - this._blackMana > 30) {
				//console.log('Imbalance Black Lost')
				//If we have more than 30 white mana over black, our black gains are halved
				this._blackManaLostToImbalance += Math.ceil(black/2)
				black = Math.floor(black/2)
			}
		}

		_calculateManaWasted(white, black) {
			if (this._whiteMana > 100) {
				this._whiteManaWasted += this._whiteMana - 100
				if (white || black) {
					this._whiteOverallManaGained += (white - (this._whiteMana - 100))
				}
				this._whiteMana = 100
			} else if (white || black) {
				this._whiteOverallManaGained += white||0
			}

			if (this._blackMana > 100) {
				//console.log(`Wasted: ${this._blackMana - 100}`)
				this._blackManaWasted += this._blackMana - 100
				if (white || black) {
					this._blackOverallManaGained += (black - (this._blackMana - 100))
				}
				this._blackMana = 100
			} else if (white || black) {
				this._blackOverallManaGained += black||0
			}
		}

		_calculateOverallManaGained(white, black) {
			if (this._whiteMana > 100) {
				this._whiteManaWasted += this._whiteMana - 100
				if (white || black) {
					this._whiteOverallManaGained += (white - (this._whiteMana - 100))
				}
				this._whiteMana = 100
			} else if (white || black) {
				this._whiteOverallManaGained += white||0
			}

			if (this._blackMana > 100) {
				//console.log(`Wasted: ${this._blackMana - 100}`)
				this._blackManaWasted += this._blackMana - 100
				if (white || black) {
					this._blackOverallManaGained += (black - (this._blackMana - 100))
				}
				this._blackMana = 100
			} else if (white || black) {
				this._blackOverallManaGained += black||0
			}
		}

		_calculateManaFicationManaGained() {
			//console.log(`White: ${this._whiteMana}, Black: ${this._blackMana}`)
			//console.log('manafication')
			this._whiteMana = this._whiteMana * 2
			this._blackMana = this._blackMana * 2

			//TODO: Fix Handling for Manafication!!!!
			//For now I'm excluding it from waste calculations
			if (this._whiteMana > 100) {
				this._whiteMana = 100
			}
			if (this._blackMana > 100) {
				this._blackMana = 100
			}

			//console.log(`White: ${this._whiteMana}, Black: ${this._blackMana}`)
			this._calculateOverallManaGained(this._whiteMana, this._blackMana)
			this._calculateManaWasted(this._whiteMana, this._blackMana)
			this._calculateManaImbalance(this._whiteMana, this._blackMana)
		}

		_onCast(event) {
			const abilityId = event.ability.guid
			//This just lets us determine if we've modified the current Mana numbers at all
			//const isCalculated = false

			//console.log(`White: ${this._whiteMana} Black: ${this._blackMana}`)
			if (abilityId === ACTIONS.MANAFICATION.id) {
				//console.log('Manafication')
				this._calculateManaFicationManaGained()
			} else {
				//Determine if the ability we used should yield any mana gain.
				//console.log(`White: ${this._whiteMana}, Black: ${this._blackMana}`)
				//console.log(`Ability: ${event.ability.name}, timestamp: ${this.parser.formatTimestamp(event.timestamp)}`)
				let {white, black} = MANA_GAIN[abilityId] || {}
				if (white || black) {
					if (abilityId === ACTIONS.SCATTER.id) {
						//Check the Buffs on the player for Enhanced scatter, if so gain goes from 3 to 8
						if (this.combatants.selected.hasStatus(STATUSES.ENHANCED_SCATTER.id)) {
							//console.log('Enhanced Scatter On')
							white = 8
							black = 8
						}
					}

					//console.log(`Gain ${white||0} White, Gain ${black||0} Black`)

					if (white || black) {
						this._whiteMana += white
						this._blackMana += black

						//We might be missing events from ACT's capture, so do not allow negatives!
						if (this._whiteMana < 0) {
							this._whiteMana = 0
						}
						if (this._blackMana < 0) {
							this._blackMana = 0
						}
					}
					//console.log(`White: ${this._whiteMana}, Black: ${this._blackMana}`)
					this._calculateOverallManaGained(white, black)
					this._calculateManaWasted(white, black)
					this._calculateManaImbalance(white, black)
				}
			}

			return
		}

		_onComplete() {
			if (this._whiteManaWasted && this._whiteManaWasted > 0) {
				this.suggestions.add(new Suggestion({
					icon: ACTIONS.VERHOLY.icon,
					content: <Fragment>
						Ensure you don't overcap your White Mana before a combo, overcapping White Mana indicates your balance was off; and you potentially lost out on Enchanted Combo damage.  You should look to execute at 80/80 or as close to it as possible.
					</Fragment>,
					//severity: SEVERITY.MEDIUM,
					severity: this._whiteManaWasted > 80 ? SEVERITY.MAJOR : this._whiteManaWasted > 20 ? SEVERITY.MEDIUM : SEVERITY.MINOR,
					why: <Fragment>
						You lost {this._whiteManaWasted} White Mana due to capped Gauge resources
					</Fragment>,
				}))
			}

			if (this._whiteManaLostToImbalance && this._whiteManaLostToImbalance> 0) {
				this.suggestions.add(new Suggestion({
					icon: ACTIONS.VERFLARE.icon,
					content: <Fragment>
						Ensure you don't allow a difference of more than 30 betwen mana types, you lost white Mana due to Imbalance which reduces your overall mana gain and potentially costs you one or more Enchanted Combos
					</Fragment>,
					//severity: SEVERITY.MEDIUM,
					severity: this._whiteManaLostToImbalance > 80 ? SEVERITY.MAJOR : this._whiteManaLostToImbalance > 20 ? SEVERITY.MEDIUM : SEVERITY.MINOR,
					why: <Fragment>
						You lost {this._whiteManaLostToImbalance} White Mana due to overage of black Mana
					</Fragment>,
				}))
			}

			if (this._blackManaWasted && this._blackManaWasted > 0) {
				this.suggestions.add(new Suggestion({
					icon: ACTIONS.VERFLARE.icon,
					content: <Fragment>
						Ensure you don't overcap your Black Mana before a combo, overcapping Black Mana indicates your balance was off; and you potentially lost out on Enchanted Combo damage.  You should look to execute at 80/80 or as close to it as possible.
					</Fragment>,
					severity: this._blackManaWasted > 80 ? SEVERITY.MAJOR : this._blackManaWasted > 20 ? SEVERITY.MEDIUM : SEVERITY.MINOR,
					why: <Fragment>
						You lost {this._blackManaWasted} Black Mana due to capped Gauge resources
					</Fragment>,
				}))
			}

			if (this._blackManaLostToImbalance && this._blackManaLostToImbalance> 0) {
				this.suggestions.add(new Suggestion({
					icon: ACTIONS.VERFLARE.icon,
					content: <Fragment>
						Ensure you don't allow a difference of more than 30 betwen mana types, you lost Black Mana due to Imbalance which reduces your overall mana gain and potentially costs you one or more Enchanted Combos
					</Fragment>,
					//severity: SEVERITY.MEDIUM,
					severity: this._blackManaLostToImbalance > 80 ? SEVERITY.MAJOR : this._blackManaLostToImbalance > 20 ? SEVERITY.MEDIUM : SEVERITY.MINOR,
					why: <Fragment>
						You lost {this._blackManaLostToImbalance} Black Mana due to overage of White Mana
					</Fragment>,
				}))
			}
		}
}
