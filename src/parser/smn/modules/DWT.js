import React, {Fragment} from 'react'
import {Accordion} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import ACTIONS, {getAction} from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const CORRECT_GCDS = [
	ACTIONS.RUIN_III.id,
	ACTIONS.RUIN_IV.id,
	ACTIONS.TRI_BIND.id,
]

export default class DWT extends Module {
	static dependencies = [
		'castTime',
		'gauge',
		'gcd',
		'suggestions',
	]
	name = 'Dreadwyrm Trance'

	_active = false
	_dwt = {}
	_history = []

	_ctIndex = null

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
			this._active = true
			this._dwt = {
				start: event.timestamp,
				end: null,
				rushing: this.gauge.isRushing(),
				casts: [],
			}

			this._ctIndex = this.castTime.set([ACTIONS.RUIN_III.id], 0)
		}

		// Only going to save casts during DWT
		if (!this._active || getAction(actionId).autoAttack) {
			return
		}

		// Save the event to the DWT casts
		this._dwt.casts.push(event)
	}

	on_complete() {
		// Clean up any existing casts
		if (this._active) {
			this.stopAndSave()
		}

		// Run some analytics for suggestions
		let badGcds = 0
		let totalGcds = 0
		let fullDwt = 0
		this._history.forEach(dwt => {
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
				</Fragment>,
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
		this._active = false
		this._dwt.end = this.parser.currentTimestamp
		this._history.push(this._dwt)

		this.castTime.reset(this._ctIndex)
	}

	activeAt(time) {
		// If it's during the current one, easy way out
		if (this._active && this._dwt.start <= time) {
			return true
		}

		return this._history.some(dwt => dwt.start <= time && dwt.end >= time)
	}

	output() {
		const panels = this._history.map(dwt => {
			const numGcds = dwt.casts.filter(cast => getAction(cast.ability.guid).onGcd).length
			return {
				title: {
					key: 'title-' + dwt.start,
					content: <Fragment>
						{this.parser.formatTimestamp(dwt.start)}
						&nbsp;-&nbsp;{numGcds} GCDs
					</Fragment>,
				},
				content: {
					key: 'content-' + dwt.start,
					content: <Rotation events={dwt.casts}/>,
				},
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
