import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import Module from 'parser/core/Module'
import ACTIONS from 'data/ACTIONS'
//import STATUSES from 'data/STATUSES'

const GCD_COMBO_DURATION = 10000

// GCD Combo affecting actions.
const GCD_COMBO_ACTIONS = [
	ACTIONS.HARD_SLASH.id,
	ACTIONS.SYPHON_STRIKE.id,
	ACTIONS.SOULEATER.id,
	ACTIONS.SPINNING_SLASH.id,
	ACTIONS.POWER_SLASH.id,
	ACTIONS.UNMEND.id,
	ACTIONS.ABYSSAL_DRAIN.id,
]

// GCD Combo Chain.  If this chain isn't respected, all additional effects of attacks are discarded.
const GCD_COMBO_CHAIN = [
	{current: ACTIONS.HARD_SLASH.id,
		next: [ACTIONS.SYPHON_STRIKE.id, ACTIONS.SPINNING_SLASH.id]},
	{current: ACTIONS.SYPHON_STRIKE.id,
		next: [ACTIONS.SOULEATER.id]},
	{current: ACTIONS.SOULEATER.id,
		next: undefined},
	{current: ACTIONS.SPINNING_SLASH.id,
		next: [ACTIONS.POWER_SLASH.id]},
	{current: ACTIONS.POWER_SLASH.id,
		next: undefined},
]


export default class GCDs extends Module {
	static handle = 'gcds'
	static title = 'GCD Combo'
	static dependencies = [
		'library',
		'resources',
		'cooldowns',
		'suggestions',
	]

	// gcd combo
	_GCDComboActive = false
	_lastComboAction = undefined
	_lastComboGCDTimeStamp = (this.library.GCD_COMBO_DURATION * -1)
	_GCDChainDrops = 0

	inGCDCombo() {
		return this._GCDComboActive
	}

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
	}

	_onCast(event) {
		const abilityId = event.ability.guid
		// check combo status
		if (GCD_COMBO_ACTIONS.includes(abilityId)) {
			if (this._lastComboAction !== undefined) {
				if (GCD_COMBO_CHAIN.some(entry => entry.current === this._lastComboAction)) {
					const entry = GCD_COMBO_CHAIN.find(entry => entry.current === this._lastComboAction)
					if (entry.next !== undefined) {
						if (entry.next.includes(abilityId)) {
							this._GCDComboActive = true
						} else {
							this._GCDChainDrops += 1
						}
					}
				}
			}
			this._lastComboAction = abilityId
			this._lastComboGCDTimeStamp = event.timestamp
		}
	}

	output() {
		//dropped combo chain
		this.suggestions.add(new Suggestion({
			icon: ACTIONS.SPINNING_SLASH.icon,
			content: <Fragment>
				You dropped your GCD combo, loosing out on potency and/or mana.
			</Fragment>,
			severity: this._GCDChainDrops <= (4) ? SEVERITY.MINOR : this._GCDChainDrops <= (8) ? SEVERITY.MEDIUM : SEVERITY.MAJOR,
			why: <Fragment>
				You wasted {this._GCDChainDrops} GCD chain actions.
			</Fragment>,
		}))
		return false
	}
}
