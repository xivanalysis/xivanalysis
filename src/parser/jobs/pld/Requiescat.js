import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import Module from 'parser/core/Module'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {matchClosestLower} from 'utilities'
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
		this._missedHolySpirits += Math.max(0, 5 - this._holySpiritCount)
		this._holySpiritCount = 0
	}

	_onComplete() {
		this.suggestions.add(new Suggestion({
			icon: ACTIONS.REQUIESCAT.icon,
			why: `${this._missedHolySpirits} Holy Spirit${this._missedHolySpirits !== 1 ? 's' : ''} missed during Requiescat.`,
			severity: matchClosestLower(this._severityMissedHolySpirits, this._missedHolySpirits),
			content: <Fragment>
				GCDs used during <ActionLink {...ACTIONS.REQUIESCAT}/> should be limited to <ActionLink {...ACTIONS.HOLY_SPIRIT}/> for optimal damage.
			</Fragment>,
		}))
	}

	output() {
		const panels = Object.keys(this._requiescatRotations)
			.map(timestamp => ({
				key: timestamp,
				title: {
					content: <Fragment>
						{this.parser.formatTimestamp(timestamp)}
						<span> - </span>
						{
							this._requiescatRotations[timestamp]
								.filter(event => event.ability.guid === ACTIONS.HOLY_SPIRIT.id)
								.length
						}
						<span>x <ActionLink {...ACTIONS.HOLY_SPIRIT}/></span>
					</Fragment>,
				},
				content: {
					content: <Rotation events={this._requiescatRotations[timestamp]}/>,
				},
			}))

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
