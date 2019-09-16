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

class MissingDotTracker {
	potPerDot = 0
	badCastCounts = [0, 0]

	constructor(potency) {
		this.potPerDot = potency
	}

	addBadCast(missing) {
		this.badCastCounts[missing - 1]++
	}

	totalPotencyLost() {
		return this.potPerDot * (this.badCastCounts[0] + 2 * this.badCastCounts[1])
	}

	totalBadCasts() {
		return (this.badCastCounts[0] + this.badCastCounts[1])
	}
}

const POTENCY_PER_DOT_500_TO_505 = {
	[ACTIONS.FESTER.id]: 100,
	[ACTIONS.SMN_RUIN_II.id]: 40,
	[ACTIONS.RUIN_III.id]: 50,
	[ACTIONS.RUIN_IV.id]: 70,
}

const POTENCY_PER_DOT_508_TO_NOW = {
	[ACTIONS.FESTER.id]: 100,
}

export default class MissingDoTs extends Module {
	static handle = 'missingdots'
	static title = t('smn.missingdots.title')`Missing DoTs`
	static dependencies = [
		'enemies',
		'suggestions',
		'timeline',
	]

	_badDotReqCasts = {}

	_missingDotWindows = []
	_currentMissingDotWindow = {
		timestamp: 0, //placeholder
		casts: [],
	}

	constructor(...args) {
		super(...args)

		let POTENCY_PER_DOT = []
		if (this.parser.patch.before('5.08')) {
			POTENCY_PER_DOT = POTENCY_PER_DOT_500_TO_505
		} else {
			POTENCY_PER_DOT = POTENCY_PER_DOT_508_TO_NOW
		}
		this.addHook('complete', this._onComplete)
		this.addHook('cast', {
			by: 'player',
			abilityId: Object.keys(POTENCY_PER_DOT).map(Number),
		}, this._onDotReqCast)

		Object.keys(POTENCY_PER_DOT).forEach(id => this._badDotReqCasts[id] = new MissingDotTracker(POTENCY_PER_DOT[id]))
	}

	_onComplete() {
		// Suggestion for fester/ruin casts without both dots
		// TODO: add exception for initial cast (and possibly first cast after return) where Ruins are being cast before Tri-D
		const badCasts = Object.values(this._badDotReqCasts)
		const totalPotencyLost = badCasts.reduce((acc, skill) => acc + skill.totalPotencyLost(), 0)
		const numBadCasts = badCasts.reduce((acc, skill) => acc + skill.totalBadCasts(), 0)

		let content = <></>
		if (this.parser.patch.before('5.08')) {
			content = <Trans id="smn.dots.suggestions.missing_dot_cast.content_505">
				To get the most potency out of your <ActionLink {...ACTIONS.FESTER}/>s and Ruin spells, ensure both <StatusLink {...STATUSES.BIO_III}/> and <StatusLink {...STATUSES.MIASMA_III}/> are applied to your target. Avoid casting Fester directly after DoT application, as the status takes a short period to apply.
			</Trans>
		} else {
			content = <Trans id="smn.dots.suggestions.missing_dot_cast.content">
				To get the most potency out of your <ActionLink {...ACTIONS.FESTER}/>s, ensure both <StatusLink {...STATUSES.BIO_III}/> and <StatusLink {...STATUSES.MIASMA_III}/> are applied to your target.
			</Trans>
		}
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.FESTER.icon,
			content: content,
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
		this._badDotReqCasts[actionId].addBadCast(statusesMissing)
	}

	output() {
		if (this._missingDotWindows.length === 0) { return false }

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
