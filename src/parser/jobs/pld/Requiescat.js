import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import Module from 'parser/core/Module'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {matchClosestLower} from 'utilities'

export default class Requiescat extends Module {
	static handle = 'requiescat'
	static dependencies = [
		'suggestions',
	]

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
		10: SEVERITY.MORBID,
	}

	// Internal State Counters
	_requiescatStart = null
	_holySpiritCount = 0

	// Result Counters
	_missedHolySpirits = 0

	_onCast(event) {
		const actionId = event.ability.guid

		if (actionId === ACTIONS.REQUIESCAT.id) {
			this._requiescatStart = event.timestamp
		}

		if (this._requiescatStart !== null && actionId === ACTIONS.HOLY_SPIRIT.id) {
			this._holySpiritCount++
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
}
