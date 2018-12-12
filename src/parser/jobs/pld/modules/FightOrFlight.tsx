import {i18nMark, Plural, Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import ACTIONS, {getAction} from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'
import _ from 'lodash'
import Module, {dependency} from 'parser/core/Module'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {Accordion} from 'semantic-ui-react'
import {matchClosestLower} from 'utilities'

interface TimestampRotationMap {
	[timestamp: number]: CastEvent[]
}

const SEVERETIES = {
	MISSED_CIRCLE_OF_SCORN: {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		4: SEVERITY.MAJOR,
	},
	MISSED_SPIRIT_WITHIN: {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		4: SEVERITY.MAJOR,
	},
	MISSED_GORING: {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		4: SEVERITY.MAJOR,
	},
	MISSED_GCD: {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		4: SEVERITY.MAJOR,
	},
	GORING_CLIP: {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		4: SEVERITY.MAJOR,
	},
}

const CONSTANTS = {
	GORING: {
		MINIMUM_DISTANCE: 9,
		EXPECTED: 2,
	},
	SPIRITS_WITHIN: {
		EXPECTED: 1,
	},
	CIRCLE_OF_SCORN: {
		EXPECTED: 1,
	},
	GCD: {
		EXPECTED: 10,
	},
}

export default class FightOrFlight extends Module {
	static handle = 'fightorflight'
	static title = 'Fight Or Flight Usage'
	static i18n_id = i18nMark('pld.fightorflight.title') // tslint:disable-line:variable-name

	@dependency suggestions!: Suggestions

	// Internal State Counters
	_fofStart: number | null = null
	_fofLastGoringGcd: number | null = null
	_fofGorings = 0
	_fofGcds = 0
	_fofCircleOfScorn = 0
	_fofSpiritsWithin = 0

	// Result Counters
	_fofRotations: TimestampRotationMap = {}
	_fofMissedCircleOfScorns = 0
	_fofMissedSpiritWithins = 0
	_fofMissedGcds = 0
	_fofMissedGorings = 0
	_fofGoringTooCloseCount = 0

	protected init() {
		this.addHook<CastEvent>('cast', {by: 'player'}, this._onCast)
		this.addHook<BuffEvent>('removebuff', {
				by: 'player',
				to: 'player',
				abilityId: [STATUSES.FIGHT_OR_FLIGHT.id],
			}
			, this._onRemoveFightOrFlight)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event: CastEvent) {
		const actionId = event.ability.guid

		if (actionId === ACTIONS.ATTACK.id) {
			return
		}

		if (actionId === ACTIONS.FIGHT_OR_FLIGHT.id) {
			this._fofStart = event.timestamp
		}

		if (this._fofStart) {
			const action = getAction(actionId) as any

			if (action.onGcd) {
				this._fofGcds++
			}

			switch (actionId) {
				case ACTIONS.GORING_BLADE.id:
					this._fofGorings++

					if (this._fofLastGoringGcd !== null) {
						if (this._fofGcds - this._fofLastGoringGcd < CONSTANTS.GORING.MINIMUM_DISTANCE) {
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
		this._fofMissedCircleOfScorns += Math.max(0, CONSTANTS.CIRCLE_OF_SCORN.EXPECTED - this._fofCircleOfScorn)
		this._fofMissedSpiritWithins += Math.max(0, CONSTANTS.SPIRITS_WITHIN.EXPECTED - this._fofSpiritsWithin)
		this._fofMissedGcds += Math.max(0, CONSTANTS.GCD.EXPECTED - this._fofGcds)
		this._fofMissedGorings += Math.max(0, CONSTANTS.GORING.EXPECTED - this._fofGorings)

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
			content: <Trans id="pld.fightorflight.suggestions.circle-of-scorn.content">
				Try to land one <ActionLink {...ACTIONS.CIRCLE_OF_SCORN}/> during
				every <ActionLink {...ACTIONS.FIGHT_OR_FLIGHT}/> window.
			</Trans>,
			why: <Trans id="pld.fightorflight.suggestions.circle-of-scorn.why">
				<Plural value={this._fofMissedCircleOfScorns} one="# usage" other="# usages"/> missed during <StatusLink {...STATUSES.FIGHT_OR_FLIGHT}/> windows.
			</Trans>,
			tiers: SEVERETIES.MISSED_CIRCLE_OF_SCORN,
			value: this._fofMissedCircleOfScorns,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.SPIRITS_WITHIN.icon,
			content: <Trans id="pld.fightorflight.suggestions.spirits-within.content">
				Try to land one <ActionLink {...ACTIONS.SPIRITS_WITHIN}/> during
				every <ActionLink {...ACTIONS.FIGHT_OR_FLIGHT}/> window.
			</Trans>,
			why: <Trans id="pld.fightorflight.suggestions.spirits-within.why">
				<Plural value={this._fofMissedSpiritWithins} one="# usage" other="# usages"/> missed during <StatusLink {...STATUSES.FIGHT_OR_FLIGHT}/> windows.
			</Trans>,
			tiers: SEVERETIES.MISSED_SPIRIT_WITHIN,
			value: this._fofMissedSpiritWithins,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.GORING_BLADE.icon,
			content: <Trans id="pld.fightorflight.suggestions.goring-blade.content">
				Try to land 2 <ActionLink {...ACTIONS.GORING_BLADE}/> during
				every <ActionLink {...ACTIONS.FIGHT_OR_FLIGHT}/> window. One at the beginning and one at the end.
			</Trans>,
			why: <Trans id="pld.fightorflight.suggestions.goring-blade.why">
				<Plural value={this._fofMissedGorings} one="# application" other="# applications"/> missed during <StatusLink {...STATUSES.FIGHT_OR_FLIGHT}/> windows.
			</Trans>,
			tiers: SEVERETIES.MISSED_GORING,
			value: this._fofMissedGorings,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.FIGHT_OR_FLIGHT.icon,
			content: <Trans id="pld.fightorflight.suggestions.gcds.content">
				Try to land 10 GCDs during every <ActionLink {...ACTIONS.FIGHT_OR_FLIGHT}/> window.
			</Trans>,
			why: <Trans id="pld.fightorflight.suggestions.gcds.why">
				<Plural value={this._fofMissedGcds} one="# GCD" other="# GCDs"/> missed during <StatusLink {...STATUSES.FIGHT_OR_FLIGHT}/> windows.
			</Trans>,
			tiers: SEVERETIES.MISSED_GCD,
			value: this._fofMissedGcds,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.GORING_BLADE.icon,
			severity: matchClosestLower(SEVERETIES.MISSED_GCD, this._fofGoringTooCloseCount),
			content: <Trans id="pld.fightorflight.suggestions.goring-blade-clip.content">
				Try to refresh <ActionLink {...ACTIONS.GORING_BLADE}/> 9 GCDs after the
				first <ActionLink {...ACTIONS.GORING_BLADE}/> in
				a <ActionLink {...ACTIONS.FIGHT_OR_FLIGHT}/> window.
			</Trans>,
			why: <Trans id="pld.fightorflight.suggestions.goring-blade-clip.why">
				<Plural value={this._fofGoringTooCloseCount} one="# application was" other="# applications were"/> refreshed too early during <StatusLink {...STATUSES.FIGHT_OR_FLIGHT}/> windows.
			</Trans>,
			tiers: SEVERETIES.GORING_CLIP,
			value: this._fofGoringTooCloseCount,
		}))
	}

	output() {
		const panels = Object.keys(this._fofRotations)
			.map(timestamp => {
				const ts = _.toNumber(timestamp)

				const gcdCount = this._fofRotations[ts]
					.filter(event => (getAction(event.ability.guid) as any).onGcd)
					.length

				const goringCount = this._fofRotations[ts]
					.filter(event => event.ability.guid === ACTIONS.GORING_BLADE.id)
					.length

				const spiritsWithinCount = this._fofRotations[ts]
					.filter(event => event.ability.guid === ACTIONS.SPIRITS_WITHIN.id)
					.length

				const circleOfScornCount = this._fofRotations[ts]
					.filter(event => event.ability.guid === ACTIONS.CIRCLE_OF_SCORN.id)
					.length

				return ({
					key: timestamp,
					title: {
						content: <>
							{this.parser.formatTimestamp(ts)}
							<span> - </span>
							<span>{gcdCount} GCDs</span>
							<span> - </span>
							<span>{goringCount} / {CONSTANTS.GORING.EXPECTED} <ActionLink {...ACTIONS.GORING_BLADE}/></span>
							<span> - </span>
							<span>{circleOfScornCount} / {CONSTANTS.CIRCLE_OF_SCORN.EXPECTED} <ActionLink {...ACTIONS.CIRCLE_OF_SCORN}/></span>
							<span> - </span>
							<span>{spiritsWithinCount} / {CONSTANTS.SPIRITS_WITHIN.EXPECTED} <ActionLink {...ACTIONS.SPIRITS_WITHIN}/></span>
						</>,
					},
					content: {
						content: <Rotation events={this._fofRotations[ts]}/>,
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
