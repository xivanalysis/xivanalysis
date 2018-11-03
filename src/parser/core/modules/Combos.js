// If you can make it through this entire file without hitting semantic saturation of the word "combo", hats off to you. IT DOESN'T LOOK REAL ANYMORE.

import React from 'react'
import {Plural, Trans} from '@lingui/react'

import {getAction} from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const NO_COMBO = -1
const GCD_TIMEOUT_MILLIS = 12000

export default class Combos extends Module {
	static handle = 'combos'
	static dependencies = [
		'suggestions',
	]

	// This should be redefined by subclassing modules; the default is the basic 'Attack' icon
	static suggestionIcon = 'https://xivapi.com/i/000000/000405.png'

	_lastAction = NO_COMBO
	_lastGcdTime = this.parser.fight.start_time
	_brokenComboCount = 0
	_uncomboedGcdCount = 0

	_comboBreakers = []
	_uncomboedGcds = []

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('complete', this._onComplete)
	}

	/** @protected */
	fabricateComboEvent(event) {
		const combo = {...event}
		combo.type = 'combo'
		delete combo.timestamp // Since fabricateEvent adds that in anyway
		this.parser.fabricateEvent(combo)
	}

	/** @protected */
	recordBrokenCombo(event) {
		this._brokenComboCount++
		this._comboBreakers.push(event)
	}

	/** @protected */
	recordUncomboedGcd(event) {
		this._uncomboedGcdCount++
		this._uncomboedGcds.push(event)
	}

	/** @protected */
	checkCombo(combo, event) {
		// Not in a combo
		if (this._lastAction === NO_COMBO) {
			// Combo starter, we good
			if (combo.start) {
				this.fabricateComboEvent(event)
				return true
			}

			// Combo action that isn't a starter, that's a paddlin'
			if (combo.from) {
				this.recordUncomboedGcd(event)
				return false
			}
		}

		// Continuing a combo correctly, yay
		if (combo.from === this._lastAction) {
			this.fabricateComboEvent(event)
			// If it's a finisher, reset the combo
			return !combo.end
		}

		// Combo starter mid-combo, that's a paddlin'
		if (combo.start) {
			this.recordBrokenCombo(event)
			return true
		}

		// Incorrect combo action, that's a paddlin'
		this.recordBrokenCombo(event)
		this.recordUncomboedGcd(event)
		return false
	}

	_onCast(event) {
		const action = getAction(event.ability.guid)

		if (!action) {
			return
		}

		if (action.onGcd) {
			if (event.timestamp - this._lastGcdTime > GCD_TIMEOUT_MILLIS) {
				// If we've had enough downtime between GCDs to let the combo expire, reset the state so we don't count erroneous combo breaks
				this._lastAction = NO_COMBO
			}

			this._lastGcdTime = event.timestamp
		}

		// If it's a combo action, run it through the combo checking logic
		if (action.combo) {
			const continueCombo = this.checkCombo(action.combo, event)
			this._lastAction = continueCombo? action.id : NO_COMBO
		}

		if (action.breaksCombo && this._lastAction !== NO_COMBO) {
			// Combo breaking action, that's a paddlin'
			this._lastAction = NO_COMBO
			this.recordBrokenCombo(event)
		}
	}

	_onComplete() {
		if (this.addJobSpecificSuggestions(this._comboBreakers, this._uncomboedGcds)) {
			return
		}
		if (this._brokenComboCount > 0 || this._uncomboedGcdCount > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.constructor.suggestionIcon,
				content: <Trans id="core.combos.content">
					Avoid misusing your combo GCDs at the wrong combo step or breaking existing combos with non-combo GCDs. Breaking combos can cost you significant amounts DPS as well as important secondary effects.
				</Trans>,
				severity: SEVERITY.MEDIUM, // TODO
				why: <Plural
					id="core.combos.why"
					value={this._brokenComboCount + this._uncomboedGcdCount}
					one="You misused # combo action."
					other="You misused # combo actions."
				/>,
			}))
		}
	}

	addJobSpecificSuggestions(/*comboBreakers, uncomboedGcds*/) {
		// To be overridden by subclasses. This is called in _onComplete() and passed two arrays of event objects - one for events that
		// broke combos, and one for combo GCDs used outside of combos. Subclassing modules can add job-specific suggestions based on
		// what particular actions were misused and when in the fight.
		// The overriding module should return true if the default suggestion is not wanted
		return false
	}
}
