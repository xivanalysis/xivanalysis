import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

// In potency
const MISSING_DOT_SEVERITY = {
	1: SEVERITY.MEDIUM,
	1000: SEVERITY.MAJOR,
}

// Statuses that need to be up for Fester, Bane, and Ruins to do the most
const SMN_DOT_STATUSES = [
	STATUSES.BIO_III.id,
	STATUSES.MIASMA_III.id,
]

export default class MissingDoTs extends Module {
	static handle = 'missingdots'
	static title = t('smn.missingdots.title')`Missing DoTs`
	static dependencies = [
		'enemies',
		'suggestions',
		'timeline',
	]

	_badDotReqCasts = {
		[ACTIONS.FESTER.id]: {
			potPerDot: 100,
			badCastCounts: [0, 0],
		},
		[ACTIONS.RUIN_II.id]: {
			potPerDot: 40,
			badCastCounts: [0, 0],
		},
		[ACTIONS.RUIN_III.id]: {
			potPerDot: 50,
			badCastCounts: [0, 0],
		},
		[ACTIONS.RUIN_IV.id]: {
			potPerDot: 70,
			badCastCounts: [0, 0],
		},
	}
	_missingDotWindows = []
	_currentMissingDotWindow = {
		timestamp: 0, //placeholder
		casts: [],
	}

	constructor(...args) {
		super(...args)

		this.addHook('complete', this._onComplete)
		this.addHook('cast', {
			by: 'player',
			abilityId: [ACTIONS.FESTER.id, ACTIONS.RUIN_II.id, ACTIONS.RUIN_III.id, ACTIONS.RUIN_IV.id],
		}, this._onDotReqCast)
	}

	_onComplete() {
		// Suggestion for fester/ruin casts without both dots
		// TODO: add exception for initial cast (and possibly first cast after return) where Ruins are being cast before Tri-D
		const badCasts = Object.values(this._badDotReqCasts)
		const totalPotencyLost = badCasts.reduce((acc, skill) => acc + skill.potPerDot * (1 * skill.badCastCounts[0] + 2 * skill.badCastCounts[1]), 0)
		const numBadCasts = badCasts.reduce((acc, skill) => acc + skill.badCastCounts[0] + skill.badCastCounts[1], 0)

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.FESTER.icon,
			content: <Trans id="smn.dots.suggestions.missing_dot_cast.content">
				To get the most potency out of your <ActionLink {...ACTIONS.FESTER}/>s and Ruin spells, ensure both <StatusLink {...STATUSES.BIO_III}/> and <StatusLink {...STATUSES.MIASMA_III}/> are applied to your target. Avoid casting Fester directly after DoT application, as the status takes a short period to apply.
			</Trans>,
			why: <Trans id="smn.dots.suggestions.missing_dot_cast.why">
				{totalPotencyLost} potency lost to
				<Plural value={numBadCasts} one="# cast" other="# casts"/>
				on targets missing DoTs.
			</Trans>,
			tiers: MISSING_DOT_SEVERITY,
			value: totalPotencyLost,
		}))

		if (this._currentMissingDotWindow.casts.length > 0) {
			this._missingDotWindows.push(this._currentMissingDotWindow)
		}
	}

	_onDotReqCast(event) {
		const actionId = event.ability.guid

		const target = this.enemies.getEntity(event.targetID)
		if (!target) { return }
		const statusesMissing = SMN_DOT_STATUSES.length - SMN_DOT_STATUSES.filter(statusId => target.hasStatus(statusId)).length

		// Don't need to worry if they got them all up
		if (statusesMissing === 0) {
			if (this._currentMissingDotWindow.casts.length > 0) {
				this._missingDotWindows.push(this._currentMissingDotWindow)
				this._currentMissingDotWindow = {
					timestamp: event.timestamp, //placeholder
					casts: [],
				}
			}
			return
		}

		if (this._currentMissingDotWindow.casts.length === 0) {
			this._currentMissingDotWindow.timestamp = event.timestamp
		}
		this._currentMissingDotWindow.casts.push(event)

		// Add to the appropriate key
		// Just tracking flat count for now. Expand to events if need info (for the timeline, yes pls)
		this._badDotReqCasts[actionId].badCastCounts[statusesMissing - 1]++
	}

	output() {
		return <RotationTable data={this._missingDotWindows
			.map(window => {
				return {
					start: window.timestamp - this.parser.fight.start_time,
					end: window.timestamp - this.parser.fight.start_time,
					rotation: window.casts,
				}
			})
		}
		onGoto={this.timeline.show}
		/>
	}
}
