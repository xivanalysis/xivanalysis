import CoreCombos from 'parser/core/modules/Combos'
import ACTIONS from 'data/ACTIONS'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import {Plural, Trans} from '@lingui/react'

export default class Combos extends CoreCombos {
	// Overrides
	static suggestionIcon = ACTIONS.ENCHANTED_REDOUBLEMENT.icon

	//These actions are considered a combo DERP
	_derpComboActions = [
		ACTIONS.ENCHANTED_RIPOSTE.id,
		ACTIONS.ENCHANTED_ZWERCHHAU.id,
		ACTIONS.ENCHANTED_REDOUBLEMENT.id,
	]
	_severityDerpComboActions = {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		3: SEVERITY.MAJOR,
	}
	//These actions mean you went in without enough mana
	_notEnoughManaActions = [
		ACTIONS.RIPOSTE.id,
		ACTIONS.ZWERCHHAU.id,
		ACTIONS.REDOUBLEMENT.id,
	]
	_severityNotEnoughManaActions = {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		3: SEVERITY.MAJOR,
	}
	//Generics, not handled by the rest
	_severityGenericActions = {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		4: SEVERITY.MAJOR,
	}

	//Overrides
	addJobSpecificSuggestions(comboBreakers, uncomboedGcds) {
		//console.log('Output is Output!')
		if (comboBreakers.length === 0 && uncomboedGcds.length === 0) {
			//console.log('Output with no breakers!')
			return false
		}

		//const panels = []
		let derpComboCount = 0
		let notEnoughManaCount = 0

		if (comboBreakers.length > 0) {
			//console.log('Breaker')
			comboBreakers.map(breaker => {
				// const util = require('util')
				// console.log(util.inspect(breaker, {showHidden: true, depth: null}))
				if (this._derpComboActions.includes(breaker.ability.guid)) {
					//console.log(`${derpComboCount}: derpComboCount`)
					derpComboCount++
				}
				if (this._notEnoughManaActions.includes(breaker.ability.guid)) {
					//console.log(`${notEnoughManaCount}: notEnoughManaCount`)
					notEnoughManaCount++
				}
			})
		}

		//Process Derped Combos
		if (derpComboCount > 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.ENCHANTED_REDOUBLEMENT.icon,
				why: <Plural id="rdm.combos.suggestions.derpcombos.why" value={derpComboCount} one="# enchanted combo was lost due to using the combo skills out of order" other= "# enchanted combos were lost due to using the combo skills out of order" />,
				content: <Trans id="rdm.combos.suggestions.derpcombos.content">
					Be sure not to use combo actions out of order.
				</Trans>,
				tiers: this._severityDerpComboActions,
				value: derpComboCount,
			}))
		}

		//Process Not Enough Mana Combos
		if (notEnoughManaCount > 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.SCORCH.icon,
				why: <Plural id="rdm.combos.suggestions.notenoughmanacombos.why" value={notEnoughManaCount} one="# enchanted combo was lost due to entering the combo before having enough mana" other= "# enchanted combos were lost due to entering the combo before having enough mana" />,
				content: <Trans id="rdm.combos.suggestions.notenoughmanacombos.content">
					Be sure not to enter your combo before having 80|80 mana
				</Trans>,
				tiers: this._severityNotEnoughManaActions,
				value: notEnoughManaCount,
			}))
		}

		const theRest = comboBreakers.length + uncomboedGcds.length - derpComboCount - notEnoughManaCount
		//console.log(`TheRest: ${theRest}`)

		//Process The Rest
		if (theRest > 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.ENCHANTED_REDOUBLEMENT.icon,
				why: <Plural id="rdm.combos.suggestions.therestcombos.why" value={theRest} one="# enchanted combo was lost due to general combo breakage or combo timing out" other= "# enchanted combos were lost due to general combo breakage or combo timing out" />,
				content: <Trans id="rdm.combos.suggestions.therestcombos.content">
					Do not allow your combo to timeout or use GCD Skills or Manafication during your enchanted combos
				</Trans>,
				tiers: this._severityGenericActions,
				value: theRest,
			}))
		}

		return true
	}
}
