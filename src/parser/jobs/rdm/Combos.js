import CoreCombos from 'parser/core/modules/Combos'
import ACTIONS from 'data/ACTIONS'
//import React, {Fragment} from 'react'
//import Rotation from 'components/ui/Rotation'
//import {Accordion} from 'semantic-ui-react'

export default class Combos extends CoreCombos {
	// Overrides
	static suggestionIcon = ACTIONS.ENCHANTED_REDOUBLEMENT.icon

	_comboBreakers = []
	_uncomboedGcds = []

	//Overrides
	addJobSpecificSuggestions(comboBreakers, uncomboedGcds) {
		this._comboBreakers = comboBreakers
		this._uncomboedGcdCount = uncomboedGcds
	}

	output() {
		console.log('Output is Output!')
		if (this._comboBreakers.length === 0 && this._uncomboedGcdCount.length === 0) {
			console.log('Output with no breakers!')
			return false
		}

		console.log('Output with breakers!')

		//const panels = []

		if (this._comboBreakers.length > 0) {
			console.log('Breaker')
			// this._comboBreakers.map(breaker => {
			// 	const util = require('util')
			// 	console.log(util.inspect(breaker, {showHidden: true, depth: null}))
			// })
		}

		if (this._uncomboedGcdCount.length > 0) {
			console.log('uncomboed')
			// this._uncomboedGcdCount.map(breaker => {
			// 	//const util = require('util')
			// 	//console.log(util.inspect(breaker, {showHidden: true, depth: null}))
			// })
		}
	}
}
