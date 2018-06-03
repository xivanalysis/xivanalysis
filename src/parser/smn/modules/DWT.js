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
	static displayOrder = -100

	active = false
	dwt = {}
	history = []

	on_removebuff_byPlayer(event) {
		if (event.ability.guid !== STATUSES.DREADWYRM_TRANCE.id) {
			return
		}

		// Stop tracking and save to history
		this.stopAndSave()
	}

	on_cast_byPlayer(event) {
		const actionId = event.ability.guid

		// If it's a DWT cast, start tracking
		if (actionId === ACTIONS.DREADWYRM_TRANCE.id) {
			this.active = true
			this.dwt = {
				start: event.timestamp,
				end: null,
				rushing: this.gauge.isRushing(),
				casts: []
			}
		}

		// Only going to save casts during DWT
		if (!this.active || getAction(actionId).autoAttack) {
			return
		}

		// Save the event to the DWT casts
		this.dwt.casts.push(event)
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
			const gcds = dwt.casts.filter(cast => getAction(cast.ability.guid).onGcd)

			if (!dwt.rushing) {
				fullDwt++
				totalGcds += gcds.length
			}

			badGcds += gcds.filter(cast => !CORRECT_GCDS.includes(cast.ability.guid)).length
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
			const numGcds = dwt.casts.filter(cast => getAction(cast.ability.guid).onGcd).length
			return {
				title: {
					key: 'title-' + dwt.start,
					content: <Fragment>
						{this.parser.formatTimestamp(dwt.start)}
						&nbsp;-&nbsp;{numGcds} GCDs
					</Fragment>
				},
				content: {
					key: 'content-' + dwt.start,
					content: <ul>
						{dwt.casts.map(cast => <li key={cast.timestamp}>
							<strong>{this.parser.formatTimestamp(cast.timestamp)}:</strong>&nbsp;
							{cast.ability.name}
						</li>)}
					</ul>
				}
			}
		})

		return <Accordion
			exclusive={false}
			panels={panels}
			defaultActiveIndex={[0]} /* temp */
			styled
			fluid
		/>
	}
}
