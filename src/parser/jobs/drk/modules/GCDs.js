import React from 'react'
import {Accordion, Message} from 'semantic-ui-react'
import Rotation from 'components/ui/Rotation'
import {ActionLink} from 'components/ui/DbLink'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

import Module from 'parser/core/Module'
import ACTIONS from 'data/ACTIONS'
//import STATUSES from 'data/STATUSES'

const GCD_COMBO_DURATION = 10000

// GCD Combo affecting actions, being ones that are either part of the GCD combo chain, or forcibly stop the chain.
const GCD_COMBO_ACTIONS = {
	[ACTIONS.HARD_SLASH.id]: {
		endsCombo: false,
		next: [ACTIONS.SYPHON_STRIKE.id, ACTIONS.SPINNING_SLASH.id],
	},
	[ACTIONS.SYPHON_STRIKE.id]: {
		endsCombo: false,
		next: [ACTIONS.SOULEATER.id],
	},
	[ACTIONS.SOULEATER.id]: {
		endsCombo: false,
		next: [undefined],
	},
	[ACTIONS.SPINNING_SLASH.id]: {
		endsCombo: false,
		next: [ACTIONS.POWER_SLASH.id],
	},
	[ACTIONS.POWER_SLASH.id]: {
		endsCombo: false,
		next: [undefined],
	},
	[ACTIONS.UNMEND.id]: {
		endsCombo: true,
		next: [undefined],
	},
	[ACTIONS.ABYSSAL_DRAIN.id]: {
		endsCombo: true,
		next: [undefined],
	},
}
// Recommendation severities
const _severityDroppedGCDCombo = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	7: SEVERITY.MAJOR,
}

export default class GCDs extends Module {
	static handle = 'gcds'
	static title = 'GCD Combo'
	static dependencies = [
		'suggestions',
	]

	// gcd combo
	_GCDComboActive = false
	_lastComboAction = undefined
	_last3eventsAndCurrent = []
	_lastComboGCDTimeStamp = undefined
	_GCDChainDrops = []

	inGCDCombo() {
		return this._GCDComboActive
	}

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const abilityId = event.ability.guid
		// check combo status
		if (GCD_COMBO_ACTIONS.hasOwnProperty(abilityId)) {
			this._last3eventsAndCurrent.push(event)
			if (
				(this._lastComboAction !== undefined && this._lastComboGCDTimeStamp !== undefined) &&
				(event.timestamp - this._lastComboGCDTimeStamp < GCD_COMBO_DURATION)
			) {
				const thisActionEntry = GCD_COMBO_ACTIONS[abilityId]
				const lastActionEntry = GCD_COMBO_ACTIONS[this._lastComboAction]
				if (!thisActionEntry.endsCombo) {
					if (lastActionEntry.next[0] === undefined || lastActionEntry.next.includes(abilityId)) {
						this._GCDComboActive = true
					} else {
						this._GCDComboActive = false
						this._GCDChainDrops.push({timestamp: event.timestamp, events: this._last3eventsAndCurrent.slice()})
					}
				} else {
					this._GCDComboActive = false
				}
			}
			this._lastComboAction = abilityId
			this._lastComboGCDTimeStamp = event.timestamp
			if (this._last3eventsAndCurrent.length > 2) {
				this._last3eventsAndCurrent.shift()
			}
		}
	}

	_onComplete() {
		//dropped combo chain
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.SPINNING_SLASH.icon,
			content: <>
				You dropped your GCD combo, losing out on potency and/or mana.
			</>,
			tiers: _severityDroppedGCDCombo,
			value: this._GCDChainDrops.length,
			why: <>
				You wasted {this._GCDChainDrops.length} GCD chain actions.
			</>,
		}))
	}

	output() {
		//dropped combo chain
		if (this._GCDChainDrops.length > 0) {
			const panels = this._GCDChainDrops.map(entry => {
				return {
					key: 'panel-' + entry.timestamp,
					title: {
						content: <>
							{this.parser.formatTimestamp(entry.timestamp)}
						</>,
					},
					content: {
						content: <Rotation events={entry.events}/>,
					},
				}
			})
			return <>
				<Message>
					Dropping GCD combo prevents mana generation from <ActionLink {...ACTIONS.SYPHON_STRIKE}/> and blood generation from <ActionLink {...ACTIONS.SOULEATER}/>, as well as lowering action potency.
				</Message>
				<Accordion
					exclusive={false}
					panels={panels}
					styled
					fluid
				/>
			</>
		}
		return false
	}
}
