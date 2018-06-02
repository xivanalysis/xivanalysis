import React, { Fragment } from 'react'
import { Accordion } from 'semantic-ui-react'

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
		'gauge',
		'gcd',
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
			rushing: this.gauge.isRushing(),
			casts: new Map()
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
		const value = (this.dwt.casts.get(actionId) || 0) + 1
		this.dwt.casts.set(actionId, value)
	}

	on_complete() {
		// Clean up any existing casts
		if (this.active) {
			this.stopAndSave()
		}

		// Run some analytics for suggestions
		let badGcds = 0
		let totalGcds = 0
		let fullDwt = 0
		this.history.forEach(dwt => {
			if (!dwt.rushing) {
				fullDwt++
			}

			dwt.casts.forEach((castCount, actionId) => {
				if (!getAction(actionId).onGcd) {
					return
				}

				if (!dwt.rushing) {
					totalGcds += castCount
				}
				if (!CORRECT_GCDS.includes(actionId)) {
					badGcds += castCount
				}
			})
		})

		// Suggestions
		if (badGcds) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DREADWYRM_TRANCE.icon,
				why: `${badGcds} incorrect GCDs used during DWT.`,
				severity: badGcds > 5 ? SEVERITY.MAJOR : badGcds > 1? SEVERITY.MEDIUM : SEVERITY.MINOR,
				content: <Fragment>
					GCDs used during Dreadwyrm Trance should be limited to <ActionLink {...ACTIONS.RUIN_III}/> and <ActionLink {...ACTIONS.RUIN_IV}/>, or <ActionLink {...ACTIONS.TRI_BIND}/> in AoE situations.
				</Fragment>
			}))
		}

		// DWT length is 16s, taking 1.5 off for two ogcds - DWT to open, and DF to close
		const possibleGcds = Math.floor((16000 - 1500) / this.gcd.getEstimate()) + 1

		// Work out how many they could have technically got (outside rushes)
		// TODO: Consider ending early for cleave and debuffs like trick
		const aimForGcds = fullDwt * possibleGcds
		console.log(totalGcds, aimForGcds, fullDwt, possibleGcds)
		// TODO: Output
	}

	stopAndSave() {
		this.active = false
		this.dwt.end = this.parser.currentTimestamp
		this.history.push(this.dwt)
	}

	output() {
		const panels = this.history.map(dwt => {
			const gcds = Array.from(dwt.casts.keys()).reduce((prev, actionId) => prev + (getAction(actionId).onGcd ? dwt.casts.get(actionId) : 0), 0)
			return {
				title: {
					key: 'title-' + dwt.start,
					content: <Fragment>
						<strong>{this.parser.formatTimestamp(dwt.start)}</strong>
						&nbsp;({gcds} GCDs)
					</Fragment>
				},
				content: {
					key: 'content-' + dwt.start,
					content: <ul>
						{Array.from(dwt.casts.entries()).map(([actionId, value]) => <li key={actionId}>
							{getAction(actionId).name}: {value}
						</li>)}
					</ul>
				}
			}
		})

		return <Accordion
			exclusive={false}
			panels={panels}
			styled
			fluid
		/>
	}
}
