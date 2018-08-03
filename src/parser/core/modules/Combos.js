// If you can make it through this entire file without hitting semantic saturation of the word "combo", hats off to you. IT DOESN'T LOOK REAL ANYMORE.

import React, {Fragment} from 'react'

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
	static suggestionIcon = 'https://secure.xivdb.com/img/game/000000/000405.png'

	_lastAction = NO_COMBO
	_lastGcdTime = this.parser.fight.start_time
	_brokenComboCount = 0
	_uncomboedGcdCount = 0

	_comboBreakers = []
	_uncomboedGcds = []

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast) // TODO - Can we filter to onGcd=true? That would be neat.
		this.addHook('complete', this._onComplete)
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

		if (action.combo) {
			if (this._lastAction === NO_COMBO) {
				// Not in a combo
				if (action.combo.start) {
					// Combo starter, we good
					this._lastAction = action.id
					this.comboHit(event)
				} else if (action.combo.from) {
					// Combo action that isn't a starter, that's a paddlin'
					this._uncomboedGcdCount++
					this._uncomboedGcds.push(event)
				}
			} else if (action.combo.from === this._lastAction) {
				// Continuing a combo correctly, yay
				this._lastAction = action.combo.end ? NO_COMBO : action.id // If it's a finisher, reset the combo
				this.comboHit(event)
			} else if (action.combo.start) {
				// Combo starter mid-combo, that's a paddlin'
				this._lastAction = action.id
				this._brokenComboCount++
				this._comboBreakers.push(event)
			} else {
				// Incorrect combo action, that's a paddlin'
				this._lastAction = NO_COMBO
				this._brokenComboCount++
				this._comboBreakers.push(event)
				this._uncomboedGcdCount++
				this._uncomboedGcds.push(event)
			}
		} else if (action.breaksCombo && this._lastAction !== NO_COMBO) {
			// Combo breaking action, that's a paddlin'
			this._lastAction = NO_COMBO
			this._brokenComboCount++
			this._comboBreakers.push(event)
		}
	}

	_onComplete() {
		if (this._brokenComboCount > 0 || this._uncomboedGcdCount > 0) {
			const why = [
				this._brokenComboCount > 0 && `broke ${this._brokenComboCount} combo${this._brokenComboCount !== 1 ? 's' : ''}`,
				this._uncomboedGcdCount > 0 && `used ${this._uncomboedGcdCount} uncomboed GCD${this._uncomboedGcdCount !== 1 ? 's' : ''}`,
			].filter(Boolean)

			this.suggestions.add(new Suggestion({
				icon: this.constructor.suggestionIcon,
				content: <Fragment>
					Avoid misusing your combo GCDs at the wrong combo step or breaking existing combos with non-combo GCDs. Breaking combos can cost you significant amounts DPS as well as important secondary effects.
				</Fragment>,
				severity: SEVERITY.MEDIUM, // TODO
				why: <Fragment>You {why.join(' and ')}.</Fragment>,
			}))
		}

		this.addJobSpecificSuggestions(this._comboBreakers, this._uncomboedGcds)
	}

	comboHit(/*event*/) {
		// To be overridden by subclasses. This is for tracking anything a successful combo hit gets you (e.g. Beast Gauge or Kenki).
		// The parameter is the ID of the combo action (in case that wasn't obvious).
	}

	addJobSpecificSuggestions(/*comboBreakers, uncomboedGcds*/) {
		// To be overridden by subclasses. This is called in _onComplete() and passed two arrays of event objects - one for events that
		// broke combos, and one for combo GCDs used outside of combos. Subclassing modules can add job-specific suggestions based on
		// what particular actions were misused and when in the fight.
	}
}
