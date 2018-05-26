import React, { Fragment } from 'react'

import ACTIONS, { getAction } from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import { Suggestion, SEVERITY } from 'parser/core/modules/Suggestions'
import { ActionLink } from 'components/ui/DbLink'

const CORRECT_GCDS = [
	ACTIONS.RUIN_III.id,
	ACTIONS.RUIN_IV.id,
	ACTIONS.TRI_BIND.id
]

export default class DWT extends Module {
	static dependencies = [
		'suggestions'
	]
	name = 'Dreadwyrm Trance'

	active = false
	dwt = {}
	history = []

	on_applybuff_byPlayer(event) {
		if (event.ability.guid !== STATUSES.DREADWYRM_TRANCE.id) {
			return
		}

		// Start tracking
		this.active = true
		this.dwt = {
			start: event.timestamp,
			end: null,
			casts: {}
		}
	}

	on_removebuff_byPlayer(event) {
		if (event.ability.guid !== STATUSES.DREADWYRM_TRANCE.id) {
			return
		}

		// Stop tracking and save to history
		this.stopAndSave()
	}

	on_cast_byPlayer(event) {
		// Only care about casts during DWT
		if (!this.active) {
			return
		}

		const actionId = event.ability.guid
		this.dwt.casts[actionId] = (this.dwt.casts[actionId] || 0) + 1
	}

	on_complete() {
		// Clean up any existing casts
		if (this.active) {
			this.stopAndSave()
		}

		// Run some analytics for suggestions
		let badGcds = 0
		this.history.forEach(dwt => {
			badGcds += Object.keys(dwt.casts)
				.filter(actionId => getAction(actionId).onGcd && !CORRECT_GCDS.includes(parseInt(actionId, 10)))
				.reduce((prev, actionId) => prev + dwt.casts[actionId], 0)
		})

		// Suggestions
		if (badGcds > 1) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DREADWYRM_TRANCE.icon,
				why: `${badGcds} incorrect GCDs used during DWT.`,
				severity: badGcds > 5 ? SEVERITY.MAJOR : SEVERITY.MEDIUM,
				content: <Fragment>
					GCDs used during Dreadwyrm Trance should be limited to <ActionLink {...ACTIONS.RUIN_III}/> and <ActionLink {...ACTIONS.RUIN_IV}/>, or <ActionLink {...ACTIONS.TRI_BIND}/> in AoE situations.
				</Fragment>
			}))
		}
	}

	stopAndSave() {
		this.active = false
		this.dwt.end = this.parser.currentTimestamp
		this.history.push(this.dwt)
	}

	output() {
		return <ul>
			{this.history.map(dwt => <li key={dwt.start}>
				TS: {this.parser.formatTimestamp(dwt.start)}<br/>
				GCDs: {Object.keys(dwt.casts).reduce((prev, actionId) => prev + (getAction(actionId).onGcd? dwt.casts[actionId] : 0), 0)}
				<ul>
					{Object.keys(dwt.casts).map(actionId => <li key={actionId}>
						{getAction(actionId).name}: {dwt.casts[actionId]}
					</li>)}
				</ul>
			</li>)}
		</ul>
	}
}
