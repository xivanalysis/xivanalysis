import React, {Fragment} from 'react'
import {Accordion} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import ACTIONS, {getAction} from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const CORRECT_GCDS = [
	ACTIONS.FELL_CLEAVE.id,
	ACTIONS.DECIMATE.id,
]

export default class InnerRelease extends Module {
	static handle = 'ir'
	static dependencies = [
		'gauge',
		'gcd',
		'suggestions',
	]
	static title = 'Inner Release Usage'

	_active = false
	_ir = {}
	_history = []

	_missedGcds = 0
	_missedUpheavals = 0
	_missedOnslaughts = 0

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('removebuff', {
			by: 'player',
			abilityId: STATUSES.INNER_RELEASE.id,
		}, this._onRemoveIR)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const actionId = event.ability.guid

		// If it's a IR cast, it'll start tracking
		if (actionId === ACTIONS.INNER_RELEASE.id) {
			this._active = true
			this._ir = {
				start: event.timestamp,
				end: null,
				casts: [],
			}
		}

		if (!this._active || getAction(actionId).autoAttack) {
			return
		}

		this._ir.casts.push(event)
	}

	_onRemoveIR() {
		if (!this._ir.casts.some(cast => cast.ability.guid === ACTIONS.FELL_CLEAVE.id) < 5) {
			this._stopAndSave()
		}
	}

	_onComplete() {
		// Clean up any existing casts
		if (this._active) {
			this._stopAndSave()
		}

		// Run analytics for suggestionszzzz
		// i like memes
		let badGcds = 0
		this._history.forEach(ir => {
			badGcds += ir.casts
				.filter(cast =>
					getAction(cast.ability.guid).onGcd &&
					!CORRECT_GCDS.includes(cast.ability.guid)
				)
				.length
		})

		// Suggestions
		if (badGcds) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.INNER_RELEASE.icon,
				why: `${badGcds} incorrect GCDs used during IR.`,
				severity: SEVERITY.MAJOR,
				content: <Fragment>
						GCDs used during Inner Release should be limited to <ActionLink {...ACTIONS.FELL_CLEAVE}/> for optimal damage, or  <ActionLink {...ACTIONS.DECIMATE}/> in AoE situations.
				</Fragment>,
			}))
		}

		if (this._missedGcds) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.INNER_RELEASE.icon,
				why: `${this._missedGcds} GCDs missed inside of IR.`,
				severity: SEVERITY.MAJOR,
				content: <Fragment>
						You missed <strong>{this._missedGcds}</strong> GCDs out of 5 inside of Inner Release. This is very, <em>very</em> bad. You should never miss a single GCD inside of Inner Release.
				</Fragment>,
			}))
		}
	}

	_stopAndSave(endTime = this.parser.currentTimestamp) {
		if (!this._active) {
			return
		}

		this._active = false
		this._ir.end = endTime
		this._history.push(this._ir)

		// Making a const for each because why not
		const possibleGcds = 5

		// Check for which gcds they hit
		const gcds = this._ir.casts.filter(cast => getAction(cast.ability.guid).onGcd)

		this._missedGcds += possibleGcds - gcds.length
	}

	output() {
		const panels = this._history.map(ir => {
			const numGcds = ir.casts.filter(cast => getAction(cast.ability.guid).onGcd).length

			return {
				key: ir.start,
				title: {
					content: <Fragment>
						{this.parser.formatTimestamp(ir.start)}
						&nbsp;-&nbsp;{numGcds} GCDs
					</Fragment>,
				},
				content: {
					content: <Rotation events={ir.casts}/>,
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
