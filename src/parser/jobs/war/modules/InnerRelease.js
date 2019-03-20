import {Trans, i18nMark, Plural} from '@lingui/react'
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
	static i18n_id = i18nMark('war.ir.title')
	static handle = 'ir'
	static dependencies = [
		'suggestions',
	]
	static title = 'Inner Release Usage'

	_active = false
	_ir = {}
	_history = []
	_isRushing = false
	_irTime = 10000 /* eslint-disable-line no-magic-numbers */

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
		// TODO: You may need to make adjustments so the guard isn't necessary. The applybuff event is fab'd for things at the start of the fight, it may be a go.
		/* eslint-disable-next-line no-magic-numbers */
		if (this._ir.casts && !this._ir.casts.some(cast => cast.ability.guid === ACTIONS.FELL_CLEAVE.id) < 5) {
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
				why: <Trans id="war.ir.suggestions.badgcd.content">
					{badGcds} incorrect <Plural value={badGcds} one="GCD" other="GCDs"/> used during IR.`,
				</Trans>,
				severity: SEVERITY.MAJOR,
				content: <Trans id="war.ir.suggestions.badgcd.why">
						GCDs used during Inner Release should be limited to <ActionLink {...ACTIONS.FELL_CLEAVE}/> for optimal damage, or  <ActionLink {...ACTIONS.DECIMATE}/> in AoE situations.
				</Trans>,
			}))
		}

		if (this._missedGcds) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.INNER_RELEASE.icon,
				why: <Trans id="war.ir.suggestions.missedgcd.content">
					{this._missedGcds} <Plural value={this._missedGcds} one="GCD" other="GCDs"/> missed inside of IR.
				</Trans>,
				severity: SEVERITY.MAJOR,
				content: <Trans id="war.ir.suggestions.missedgcd.why">
					{this._missedGcds} <Plural value={this._missedGcds} one="GCD" other="GCDs"/> inside of Inner Release. You should be hitting 5 GCDs per cast. If you can't hit 5 GCDs, consider adjusting your gearset for it.
				</Trans>,
			}))
		}

		if (this._missedUpheavals) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.UPHEAVAL.icon,
				why: <Trans id="war.ir.suggestions.upheaval.content">
					{this._missedUpheavals} <Plural value={this._missedUpheavals} one="Upheaval" other="Upheavals"/> weren't inside of IR.
				</Trans>,
				severity: SEVERITY.MAJOR,
				content: <Trans id="war.ir.suggestions.upheaval.why">
					{this._missedUpheavals} <Plural value={this._missedUpheavals} one="Upheaval" other="Upheavals"/> inside of Inner Release. You must hit one Upheaval inside of each Inner Release.
				</Trans>,
			}))
		}

		if (this._missedOnslaughts) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.ONSLAUGHT.icon,
				why: <Trans id="war.ir.suggestions.onslaught.content">
					{this._missedOnslaughts} <Plural value={this._missedOnslaughts} one="Onslaught" other="Onslaughts"/> weren't inside of IR.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				content: <Trans id="war.ir.suggestions.onslaught.why">
					{this._missedOnslaughts} <Plural value={this._missedOnslaughts} one="Onslaught" other="Onslaughts"/> inside of Inner Release. You must hit one Onslaught inside of each Inner Release.
				</Trans>,
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

		// HOLA "RUSH" CHECK
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
						-
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
