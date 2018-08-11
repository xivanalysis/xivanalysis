import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import Module from 'parser/core/Module'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {Accordion} from 'semantic-ui-react'
import Rotation from 'components/ui/Rotation'

export default class Requiescat extends Module {
	static handle = 'requiescat'
	static dependencies = [
		'suggestions',
	]

	static title = 'Requiescat Usage'

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('removebuff', {
			by: 'player',
			abilityId: STATUSES.REQUIESCAT.id,
		}, this._onRemoveRequiescat)
		this.addHook('complete', this._onComplete)
	}

	// Internal constants
	_targetCountHolySpirit = 5

	// Internal Severity Lookups
	_severityMissedHolySpirits = {
		1: SEVERITY.MEDIUM,
		5: SEVERITY.MAJOR,
	}

	// Internal State Counters
	_requiescatStart = null
	_holySpiritCount = 0

	// Result Counters
	_missedHolySpirits = 0
	_requiescatRotations = {}

	_onCast(event) {
		const actionId = event.ability.guid

		if (actionId === ACTIONS.ATTACK.id) {
			return
		}

		if (actionId === ACTIONS.REQUIESCAT.id) {
			this._requiescatStart = event.timestamp
		}

		if (this._requiescatStart !== null) {
			if (actionId === ACTIONS.HOLY_SPIRIT.id) {
				this._holySpiritCount++
			}

			if (!Array.isArray(this._requiescatRotations[this._requiescatStart])) {
				this._requiescatRotations[this._requiescatStart] = []
			}

			this._requiescatRotations[this._requiescatStart].push(event)
		}
	}

	_onRemoveRequiescat() {
		this._requiescatStart = null

		// Clamp to 0 since we can't miss negative
		this._missedHolySpirits += Math.max(0, this._targetCountHolySpirit - this._holySpiritCount)
		this._holySpiritCount = 0
	}

	_onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.REQUIESCAT.icon,
			why: `${this._missedHolySpirits} Holy Spirit${this._missedHolySpirits !== 1 ? 's' : ''} missed during Requiescat.`,
			content: <Fragment>
				GCDs used during <ActionLink {...ACTIONS.REQUIESCAT}/> should be limited to <ActionLink {...ACTIONS.HOLY_SPIRIT}/> for optimal damage.
			</Fragment>,
			tiers: this._severityMissedHolySpirits,
			value: this._missedHolySpirits,
		}))
	}

	output() {
		const panels = Object.keys(this._requiescatRotations)
			.map(timestamp => {
				const holySpiritCount = this._requiescatRotations[timestamp]
					.filter(event => event.ability.guid === ACTIONS.HOLY_SPIRIT.id)
					.length

				return ({
					key: timestamp,
					title: {
						content: <Fragment>
							{this.parser.formatTimestamp(timestamp)}
							<span> - </span>
							<span>{holySpiritCount}/{this._targetCountHolySpirit} {ACTIONS.HOLY_SPIRIT.name}</span>
						</Fragment>,
					},
					content: {
						content: <Rotation events={this._requiescatRotations[timestamp]}/>,
					},
				})
			})

		return (
			<Accordion
				exclusive={false}
				panels={panels}
				styled
				fluid
			/>
		)
	}
}
