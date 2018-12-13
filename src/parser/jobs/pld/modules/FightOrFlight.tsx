import {i18nMark, Plural, Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import ACTIONS, {getAction} from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {CastEvent} from 'fflogs'
import _ from 'lodash'
import Module, {dependency} from 'parser/core/Module'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import Timeline from 'parser/core/modules/Timeline'
import React from 'react'
import {Button, Table} from 'semantic-ui-react'
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

	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline

	// Internal State Counters
	private fofStart: number | null = null
	private fofLastGoringGcd: number | null = null
	private fofGorings = 0
	private fofGcds = 0
	private fofCircleOfScorn = 0
	private fofSpiritsWithin = 0

	// Result Counters
	private fofRotations: TimestampRotationMap = {}
	private fofMissedCircleOfScorns = 0
	private fofMissedSpiritWithins = 0
	private fofMissedGcds = 0
	private fofMissedGorings = 0
	private fofGoringTooCloseCount = 0

	protected init() {
		this.addHook('cast', {by: 'player'}, this.onCast)
		this.addHook('removebuff', {
				by: 'player',
				to: 'player',
				abilityId: [STATUSES.FIGHT_OR_FLIGHT.id],
			}
			, this.onRemoveFightOrFlight)
		this.addHook('complete', this.onComplete)
	}

	private onCast(event: CastEvent) {
		const actionId = event.ability.guid

		if (actionId === ACTIONS.ATTACK.id) {
			return
		}

		if (actionId === ACTIONS.FIGHT_OR_FLIGHT.id) {
			this.fofStart = event.timestamp
		}

		if (this.fofStart) {
			const action = getAction(actionId) as any

			if (action.onGcd) {
				this.fofGcds++
			}

			switch (actionId) {
				case ACTIONS.GORING_BLADE.id:
					this.fofGorings++

					if (this.fofLastGoringGcd !== null) {
						if (this.fofGcds - this.fofLastGoringGcd < CONSTANTS.GORING.MINIMUM_DISTANCE) {
							this.fofGoringTooCloseCount++
						}
					}
					this.fofLastGoringGcd = this.fofGcds
					break
				case ACTIONS.CIRCLE_OF_SCORN.id:
					this.fofCircleOfScorn++
					break
				case ACTIONS.SPIRITS_WITHIN.id:
					this.fofSpiritsWithin++
					break
				default:
					break
			}

			if (!Array.isArray(this.fofRotations[this.fofStart])) {
				this.fofRotations[this.fofStart] = []
			}

			this.fofRotations[this.fofStart].push(event)
		}
	}

	private onRemoveFightOrFlight() {
		this.fofMissedCircleOfScorns += Math.max(0, CONSTANTS.CIRCLE_OF_SCORN.EXPECTED - this.fofCircleOfScorn)
		this.fofMissedSpiritWithins += Math.max(0, CONSTANTS.SPIRITS_WITHIN.EXPECTED - this.fofSpiritsWithin)
		this.fofMissedGcds += Math.max(0, CONSTANTS.GCD.EXPECTED - this.fofGcds)
		this.fofMissedGorings += Math.max(0, CONSTANTS.GORING.EXPECTED - this.fofGorings)

		this.fofStart = null
		this.fofGorings = 0
		this.fofGcds = 0
		this.fofCircleOfScorn = 0
		this.fofSpiritsWithin = 0
		this.fofLastGoringGcd = null
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.CIRCLE_OF_SCORN.icon,
			content: <Trans id="pld.fightorflight.suggestions.circle-of-scorn.content">
				Try to land one <ActionLink {...ACTIONS.CIRCLE_OF_SCORN}/> during
				every <ActionLink {...ACTIONS.FIGHT_OR_FLIGHT}/> window.
			</Trans>,
			why: <Trans id="pld.fightorflight.suggestions.circle-of-scorn.why">
				<Plural value={this.fofMissedCircleOfScorns} one="# usage" other="# usages"/> missed during <StatusLink {...STATUSES.FIGHT_OR_FLIGHT}/> windows.
			</Trans>,
			tiers: SEVERETIES.MISSED_CIRCLE_OF_SCORN,
			value: this.fofMissedCircleOfScorns,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.SPIRITS_WITHIN.icon,
			content: <Trans id="pld.fightorflight.suggestions.spirits-within.content">
				Try to land one <ActionLink {...ACTIONS.SPIRITS_WITHIN}/> during
				every <ActionLink {...ACTIONS.FIGHT_OR_FLIGHT}/> window.
			</Trans>,
			why: <Trans id="pld.fightorflight.suggestions.spirits-within.why">
				<Plural value={this.fofMissedSpiritWithins} one="# usage" other="# usages"/> missed during <StatusLink {...STATUSES.FIGHT_OR_FLIGHT}/> windows.
			</Trans>,
			tiers: SEVERETIES.MISSED_SPIRIT_WITHIN,
			value: this.fofMissedSpiritWithins,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.GORING_BLADE.icon,
			content: <Trans id="pld.fightorflight.suggestions.goring-blade.content">
				Try to land 2 <ActionLink {...ACTIONS.GORING_BLADE}/> during
				every <ActionLink {...ACTIONS.FIGHT_OR_FLIGHT}/> window. One at the beginning and one at the end.
			</Trans>,
			why: <Trans id="pld.fightorflight.suggestions.goring-blade.why">
				<Plural value={this.fofMissedGorings} one="# application" other="# applications"/> missed during <StatusLink {...STATUSES.FIGHT_OR_FLIGHT}/> windows.
			</Trans>,
			tiers: SEVERETIES.MISSED_GORING,
			value: this.fofMissedGorings,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.FIGHT_OR_FLIGHT.icon,
			content: <Trans id="pld.fightorflight.suggestions.gcds.content">
				Try to land 10 GCDs during every <ActionLink {...ACTIONS.FIGHT_OR_FLIGHT}/> window.
			</Trans>,
			why: <Trans id="pld.fightorflight.suggestions.gcds.why">
				<Plural value={this.fofMissedGcds} one="# GCD" other="# GCDs"/> missed during <StatusLink {...STATUSES.FIGHT_OR_FLIGHT}/> windows.
			</Trans>,
			tiers: SEVERETIES.MISSED_GCD,
			value: this.fofMissedGcds,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.GORING_BLADE.icon,
			severity: matchClosestLower(SEVERETIES.MISSED_GCD, this.fofGoringTooCloseCount),
			content: <Trans id="pld.fightorflight.suggestions.goring-blade-clip.content">
				Try to refresh <ActionLink {...ACTIONS.GORING_BLADE}/> 9 GCDs after the
				first <ActionLink {...ACTIONS.GORING_BLADE}/> in
				a <ActionLink {...ACTIONS.FIGHT_OR_FLIGHT}/> window.
			</Trans>,
			why: <Trans id="pld.fightorflight.suggestions.goring-blade-clip.why">
				<Plural value={this.fofGoringTooCloseCount} one="# application was" other="# applications were"/> refreshed too early during <StatusLink {...STATUSES.FIGHT_OR_FLIGHT}/> windows.
			</Trans>,
			tiers: SEVERETIES.GORING_CLIP,
			value: this.fofGoringTooCloseCount,
		}))
	}

	output() {
		return <Table compact unstackable celled>
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell collapsing>
						<strong><Trans id="pld.fightorflight.table.header.time">Time</Trans></strong>
					</Table.HeaderCell>
					<Table.HeaderCell textAlign="center" collapsing>
						<strong><Trans id="pld.fightorflight.table.header.gcds">GCDs</Trans></strong>
					</Table.HeaderCell>
					<Table.HeaderCell textAlign="center" collapsing>
						<strong><ActionLink showName={false} {...ACTIONS.SPIRITS_WITHIN}/></strong>
					</Table.HeaderCell>
					<Table.HeaderCell textAlign="center" collapsing>
						<strong><ActionLink showName={false} {...ACTIONS.CIRCLE_OF_SCORN}/></strong>
					</Table.HeaderCell>
					<Table.HeaderCell textAlign="center" collapsing>
						<strong><ActionLink showName={false} {...ACTIONS.GORING_BLADE}/></strong>
					</Table.HeaderCell>
					<Table.HeaderCell>
						<strong><Trans id="pld.fightorflight.table.header.rotation">Rotation</Trans></strong>
					</Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{
					Object.keys(this.fofRotations)
						.map(timestamp => {
							const ts = _.toNumber(timestamp)

							const gcdCount = this.fofRotations[ts]
								.filter(event => (getAction(event.ability.guid) as any).onGcd)
								.length

							const goringCount = this.fofRotations[ts]
								.filter(event => event.ability.guid === ACTIONS.GORING_BLADE.id)
								.length

							const spiritsWithinCount = this.fofRotations[ts]
								.filter(event => event.ability.guid === ACTIONS.SPIRITS_WITHIN.id)
								.length

							const circleOfScornCount = this.fofRotations[ts]
								.filter(event => event.ability.guid === ACTIONS.CIRCLE_OF_SCORN.id)
								.length

							return <Table.Row key={timestamp}>
								<Table.Cell textAlign="center">
									<span style={{marginRight: 5}}>{this.parser.formatTimestamp(ts)}</span>
									<Button circular compact size="mini" icon="time" onClick={() => this.timeline.show(ts - this.parser.fight.start_time, ts + (STATUSES.FIGHT_OR_FLIGHT.duration * 1000) - this.parser.fight.start_time)}/>
								</Table.Cell>
								<Table.Cell textAlign="center" positive={gcdCount >= CONSTANTS.GCD.EXPECTED} negative={gcdCount < CONSTANTS.GCD.EXPECTED}>
									{gcdCount}/{CONSTANTS.GCD.EXPECTED}
								</Table.Cell>
								<Table.Cell textAlign="center" positive={spiritsWithinCount >= CONSTANTS.SPIRITS_WITHIN.EXPECTED} negative={spiritsWithinCount < CONSTANTS.SPIRITS_WITHIN.EXPECTED}>
									{spiritsWithinCount}/{CONSTANTS.SPIRITS_WITHIN.EXPECTED}
								</Table.Cell>
								<Table.Cell textAlign="center" positive={circleOfScornCount >= CONSTANTS.CIRCLE_OF_SCORN.EXPECTED} negative={circleOfScornCount < CONSTANTS.CIRCLE_OF_SCORN.EXPECTED}>
									{circleOfScornCount}/{CONSTANTS.CIRCLE_OF_SCORN.EXPECTED}
								</Table.Cell>
								<Table.Cell textAlign="center" positive={goringCount >= CONSTANTS.GORING.EXPECTED} negative={goringCount < CONSTANTS.GORING.EXPECTED}>
									{goringCount}/{CONSTANTS.GORING.EXPECTED}
								</Table.Cell>
								<Table.Cell>
									<Rotation events={this.fofRotations[ts]}/>
								</Table.Cell>
							</Table.Row>
						})
				}
			</Table.Body>
		</Table>
	}
}
