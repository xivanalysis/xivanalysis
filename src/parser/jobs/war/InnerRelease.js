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

const possibleGcds = 5

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
	_isRushing = false
	_irTime = 10000

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

			// Calculates if we need to count Inner Release as a 'rush'
			const fightTimeRemaining = this.parser.fight.end_time - event.timestamp
			this._isRushing = this._irTime >= fightTimeRemaining
		}

		// Only going to save casts during IR
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

		// TODO: Account for Memeheaval opener.
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

		if (this._missedGcds && !this._isRushing) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.INNER_RELEASE.icon,
				why: `${this._missedGcds} GCDs missed inside of IR.`,
				severity: SEVERITY.MAJOR,
				content: `${this._missedGcds} GCD${this._missedGcds !== 1 ? 's' : ''} inside of Inner Release. You should be hitting 5 GCDs per cast. If you can't hit 5 GCDs, consider adjusting your gearset for it.`,
			}))
		}

		if (this._missedUpheavals) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.UPHEAVAL.icon,
				why: `${this._missedUpheavals} Upheaval${this._missedUpheavals !== 1 ? 's' : ''} weren't inside of IR.`,
				severity: SEVERITY.MAJOR,
				content: `${this._missedUpheavals} Upheaval${this._missedUpheavals !== 1 ? 's' : ''} inside of Inner Release. You must hit one Upheaval inside of each Inner Release.`,
			}))
		}

		if (this._missedOnslaughts) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.ONSLAUGHT.icon,
				why: `${this._missedOnslaughts} Onslaught${this._missedOnslaughts !== 1 ? 's' : ''} weren't inside of IR.`,
				severity: SEVERITY.MEDIUM,
				content: `${this._missedOnslaughts} Onslaught${this._missedOnslaughts !== 1 ? 's' : ''} inside of Inner Release. You must hit one Onslaught inside of each Inner Release.`,
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


		// Check for which gcds they hit, and for upheaval and onslaught :blobwizard:
		const gcds = this._ir.casts.filter(cast => getAction(cast.ability.guid).onGcd)
		const upheaval = this._ir.casts.filter(cast => cast.ability.guid === ACTIONS.UPHEAVAL.id)
		const onslaught = this._ir.casts.filter(cast => cast.ability.guid === ACTIONS.ONSLAUGHT.id)

		// HOLA RUSH CHECK
		// Basically makes sure that if you end the fight with IR active, the analysis won't fucking screech at you for missing IR stuff.
		if (this._isRushing || gcds.length > 1) {
			return
		}

		this._missedGcds += possibleGcds - gcds.length
		this._missedUpheavals += 1 - upheaval.length
		this._missedOnslaughts += 1 - onslaught.length
	}

	output() {
		const panels = this._history.map(ir => {
			const numGcds = ir.casts.filter(cast => getAction(cast.ability.guid).onGcd).length
			const numUpheavals = ir.casts.filter(cast => cast.ability.guid === ACTIONS.UPHEAVAL.id).length
			const numOnslaughts = ir.casts.filter(cast => cast.ability.guid === ACTIONS.ONSLAUGHT.id).length

			return {
				key: ir.start,
				title: {
					content: <Fragment>
						{this.parser.formatTimestamp(ir.start)}
						&nbsp;-&nbsp;
						<span>{numGcds}/5 GCDs</span>
						<span> - </span>
						<span>{numUpheavals}/1 Upheaval</span>
						<span> - </span>
						<span>{numOnslaughts}/1 Onslaught</span>
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
