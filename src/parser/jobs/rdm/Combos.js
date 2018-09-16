import CoreCombos from 'parser/core/modules/Combos'
import ACTIONS from 'data/ACTIONS'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'
//import Rotation from 'components/ui/Rotation'
//import {Accordion} from 'semantic-ui-react'

export default class Combos extends CoreCombos {
	// Overrides
	static suggestionIcon = ACTIONS.ENCHANTED_REDOUBLEMENT.icon

	_comboBreakers = []
	_uncomboedGcds = []
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

	//Overrides
	addJobSpecificSuggestions(comboBreakers, uncomboedGcds) {
		this._comboBreakers = comboBreakers
		this._uncomboedGcdCount = uncomboedGcds

		console.log('Output is Output!')
		if (this._comboBreakers.length === 0 && this._uncomboedGcdCount.length === 0) {
			console.log('Output with no breakers!')
			return false
		}

		console.log('Output with breakers!')

		//const panels = []
		let derpComboCount = 0
		let notEnoughManaCount = 0

		if (this._comboBreakers.length > 0) {
			console.log('Breaker')
			this._comboBreakers.map(breaker => {
				// const util = require('util')
				// console.log(util.inspect(breaker, {showHidden: true, depth: null}))
				if (this._derpComboActions.includes(breaker.ability.guid)) {
					console.log(`${derpComboCount}: derpComboCount`)
					derpComboCount++
				}
				if (this._notEnoughManaActions.includes(breaker.ability.guid)) {
					console.log(`${notEnoughManaCount}: notEnoughManaCount`)
					notEnoughManaCount++
				}
			})
		}

		//Process Derped Combos
		if (derpComboCount > 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.ENCHANTED_REDOUBLEMENT.icon,
				why: `${derpComboCount} enchanted combos were lost due to using the combo skills out of order`,
				content: <Fragment>
					Be sure not to use combo actions out of order.
				</Fragment>,
				tiers: this._severityDerpComboActions,
				value: derpComboCount,
			}))
		}

		//Process Not Enough Mana Combos
		if (notEnoughManaCount > 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.VERHOLY.icon,
				why: `${notEnoughManaCount} enchanted combos were lost due to entering the combo before having enough mana`,
				content: <Fragment>
				Be sure not to enter your combo before having 80|80 mana
				</Fragment>,
				tiers: this._severityNotEnoughManaActions,
				value: notEnoughManaCount,
			}))
		}

		// if (this._uncomboedGcdCount.length > 0) {
		// 	console.log('uncomboed')
		// 	this._uncomboedGcdCount.map(breaker => {
		// 		const util = require('util')
		// 		console.log(util.inspect(breaker, {showHidden: true, depth: null}))
		// 	})
		// }

		return true
	}
}
