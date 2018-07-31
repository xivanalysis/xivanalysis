import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import STATUSES from 'data/STATUSES'
import ACTIONS, {getAction} from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {matchClosestLower} from 'utilities'
import {Accordion} from 'semantic-ui-react'
import Rotation from 'components/ui/Rotation'

export default class FightOrFlight extends Module {
	static handle = 'fightorflight'
	static dependencies = [
		'suggestions',
	]

	static title = 'Fight Or Flight Usage'

	constructor(...args) {
		super(...args)

		const filter = {
			by: 'player',
			to: 'player',
			abilityId: [STATUSES.FIGHT_OR_FLIGHT.id],
		}
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('removebuff', filter, this._onRemoveFightOrFlight)
		this.addHook('complete', this._onComplete)
	}

	// Internal Constants
	_expectedFofCircleOfScorns = 1
	_expectedFofSpiritsWithin = 1
	_expectedFofGcds = 10
	_expectedFofGorings = 2
	_minimumFofGoringDistance = 9

	// Internal Severity Lookups
	_severityMissedFofCircleOfScorns = {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		4: SEVERITY.MAJOR,
	}

	_severityMissedFofSpiritsWithin = {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		4: SEVERITY.MAJOR,
	}

	_severityMissedFofGorings = {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		4: SEVERITY.MAJOR,
	}

	_severityMissedFofGcds = {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		4: SEVERITY.MAJOR,
	}

	_severityFofGoringsTooClose = {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		4: SEVERITY.MAJOR,
	}

	// Internal State Counters
	_fofStart = null
	_fofLastGoringGcd = null
	_fofGorings = 0
	_fofGcds = 0
	_fofCircleOfScorn = 0
	_fofSpiritsWithin = 0

	// Result Counters
	_fofRotations = {}
	_fofMissedCircleOfScorns = 0
	_fofMissedSpiritWithins = 0
	_fofMissedGcds = 0
	_fofMissedGorings = 0
	_fofGoringTooCloseCount = 0

	_onCast(event) {
		const actionId = event.ability.guid

		if (actionId === ACTIONS.ATTACK.id) {
			return
		}

		if (actionId === ACTIONS.FIGHT_OR_FLIGHT.id) {
			this._fofStart = event.timestamp
		}

		if (this._fofStart) {
			const action = getAction(actionId)

			if (action.onGcd) {
				this._fofGcds++
			}

			switch (actionId) {
			case ACTIONS.GORING_BLADE.id:
				this._fofGorings++

				if (this._fofLastGoringGcd !== null) {
					if (this._fofGcds - this._fofLastGoringGcd < this._minimumFofGoringDistance) {
						this._fofGoringTooCloseCount++
					}
				}
				this._fofLastGoringGcd = this._fofGcds
				break
			case ACTIONS.CIRCLE_OF_SCORN.id:
				this._fofCircleOfScorn++
				break
			case ACTIONS.SPIRITS_WITHIN.id:
				this._fofSpiritsWithin++
				break
			default:
				break
			}

			if (!Array.isArray(this._fofRotations[this._fofStart])) {
				this._fofRotations[this._fofStart] = []
			}

			this._fofRotations[this._fofStart].push(event)
		}
	}

	_onRemoveFightOrFlight() {
		this._fofMissedCircleOfScorns += Math.max(0, this._expectedFofCircleOfScorns - this._fofCircleOfScorn)
		this._fofMissedSpiritWithins += Math.max(0, this._expectedFofSpiritsWithin - this._fofSpiritsWithin)
		this._fofMissedGcds += Math.max(0, this._expectedFofGcds - this._fofGcds)
		this._fofMissedGorings += Math.max(0, this._expectedFofGorings - this._fofGorings)

		this._fofStart = null
		this._fofGorings = 0
		this._fofGcds = 0
		this._fofCircleOfScorn = 0
		this._fofSpiritsWithin = 0
		this._fofLastGoringGcd = null
	}

	_onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.CIRCLE_OF_SCORN.icon,
			why: `${this._fofMissedCircleOfScorns} Circle Of Scorn${this._fofMissedCircleOfScorns !== 1 ? 's' : ''} missed during Fight or Flight windows.`,
			content: <Fragment>
				Try to land one <ActionLink {...ACTIONS.CIRCLE_OF_SCORN}/> during
				every <ActionLink {...ACTIONS.FIGHT_OR_FLIGHT}/> window.
			</Fragment>,
			tiers: this._severityMissedFofCircleOfScorns,
			value: this._fofMissedCircleOfScorns,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.SPIRITS_WITHIN.icon,
			why: `${this._fofMissedSpiritWithins} Spirits Within missed during Fight or Flight windows.`,
			content: <Fragment>
				Try to land one <ActionLink {...ACTIONS.SPIRITS_WITHIN}/> during
				every <ActionLink {...ACTIONS.FIGHT_OR_FLIGHT}/> window.
			</Fragment>,
			tiers: this._severityMissedFofSpiritsWithin,
			value: this._fofMissedSpiritWithins,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.GORING_BLADE.icon,
			why: `${this._fofMissedGorings} Goring Blade${this._fofMissedGorings !== 1 ? 's' : ''} missed during Fight or Flight windows.`,
			content: <Fragment>
				Try to land 2 <ActionLink {...ACTIONS.GORING_BLADE}/> during
				every <ActionLink {...ACTIONS.FIGHT_OR_FLIGHT}/> window. One at the beginning and one at the end.
			</Fragment>,
			tiers: this._severityMissedFofGorings,
			value: this._fofMissedGorings,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.FIGHT_OR_FLIGHT.icon,
			why: `${this._fofMissedGcds} GCD${this._fofMissedGcds !== 1 ? 's' : ''} missed during Fight or Flight windows.`,
			content: <Fragment>
				Try to land 10 GCDs during every <ActionLink {...ACTIONS.FIGHT_OR_FLIGHT}/> window.
			</Fragment>,
			tiers: this._severityMissedFofGcds,
			value: this._fofMissedGcds,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.GORING_BLADE.icon,
			why: `${this._fofGoringTooCloseCount} Goring Blade${this._fofGoringTooCloseCount !== 1 ? 's' : ''} ${this._fofGoringTooCloseCount !== 1 ? 'were' : 'was'} refreshed too early during Fight Or Flight.`,
			severity: matchClosestLower(this._severityMissedFofGcds, this._fofGoringTooCloseCount),
			content: <Fragment>
				Try to refresh <ActionLink {...ACTIONS.GORING_BLADE}/> 9 GCDs after the
				first <ActionLink {...ACTIONS.GORING_BLADE}/> in
				a <ActionLink {...ACTIONS.FIGHT_OR_FLIGHT}/> window.
			</Fragment>,
			tiers: this._severityFofGoringsTooClose,
			value: this._fofGoringTooCloseCount,
		}))
	}

	output() {
		const panels = Object.keys(this._fofRotations)
			.map(timestamp => {
				const gcdCount = this._fofRotations[timestamp]
					.filter(event => getAction(event.ability.guid).onGcd)
					.length

				const goringCount = this._fofRotations[timestamp]
					.filter(event => event.ability.guid === ACTIONS.GORING_BLADE.id)
					.length

				const spiritsWithinCount = this._fofRotations[timestamp]
					.filter(event => event.ability.guid === ACTIONS.SPIRITS_WITHIN.id)
					.length

				const circleOfScornCount = this._fofRotations[timestamp]
					.filter(event => event.ability.guid === ACTIONS.CIRCLE_OF_SCORN.id)
					.length

				return ({
					key: timestamp,
					title: {
						content: <Fragment>
							{this.parser.formatTimestamp(timestamp)}
							<span> - </span>
							<span>{gcdCount} GCDs</span>
							<span> - </span>
							<span>{goringCount} / {this._expectedFofGorings} Goring Blades</span>
							<span> - </span>
							<span>{circleOfScornCount} / {this._expectedFofCircleOfScorns} Circle Of Scorn</span>
							<span> - </span>
							<span>{spiritsWithinCount} / {this._expectedFofSpiritsWithin} Spirits Within</span>
						</Fragment>,
					},
					content: {
						content: <Rotation events={this._fofRotations[timestamp]}/>,
					},
				})
			})

		return (
			<Accordion
				exclusive={false}
				panels={panels}
				styled
				fluid
			/>
		)
	}
}
