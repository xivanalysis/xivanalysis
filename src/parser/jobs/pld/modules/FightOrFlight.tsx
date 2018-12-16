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
import {FightOrFlightErrorResult} from 'parser/jobs/pld/modules/FightOrFlightErrorResult'
import {FightOrFlightState} from 'parser/jobs/pld/modules/FightOrFlightState'
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
	// ToDo: Merge some of these, so instead of saving rotations, make the rotation part of FoFState, so we can reduce the error result out of the saved rotations
	private fofState = new FightOrFlightState()
	private fofRotations: TimestampRotationMap = {}
	private fofErrorResult = new FightOrFlightErrorResult()

	protected init() {
		this.addHook('cast', {by: 'player'}, this.onCast)
		this.addHook(
			'removebuff',
			{
				by: 'player',
				to: 'player',
				abilityId: [STATUSES.FIGHT_OR_FLIGHT.id],
			},
			this.onRemoveFightOrFlight,
		)
		this.addHook('complete', this.onComplete)
	}

	private onCast(event: CastEvent) {
		const actionId = event.ability.guid

		if (actionId === ACTIONS.ATTACK.id) {
			return
		}

		if (actionId === ACTIONS.FIGHT_OR_FLIGHT.id) {
			this.fofState.start = event.timestamp
		}

		if (this.fofState.start) {
			const action = getAction(actionId) as TODO // Should be an Action type

			if (action.onGcd) {
				this.fofState.gcdCounter++
			}

			switch (actionId) {
				case ACTIONS.GORING_BLADE.id:
					this.fofState.goringCounter++

					if (this.fofState.lastGoringGcd !== null) {
						if (this.fofState.gcdCounter - this.fofState.lastGoringGcd < CONSTANTS.GORING.MINIMUM_DISTANCE) {
							this.fofErrorResult.goringTooCloseCounter++
						}
					}
					this.fofState.lastGoringGcd = this.fofState.gcdCounter
					break
				case ACTIONS.CIRCLE_OF_SCORN.id:
					this.fofState.circleOfScornCounter++
					break
				case ACTIONS.SPIRITS_WITHIN.id:
					this.fofState.spiritsWithinCounter++
					break
			}

			if (!Array.isArray(this.fofRotations[this.fofState.start])) {
				this.fofRotations[this.fofState.start] = []
			}

			this.fofRotations[this.fofState.start].push(event)
		}
	}

	private onRemoveFightOrFlight() {
		this.fofErrorResult.missedGcds += Math.max(0, CONSTANTS.GCD.EXPECTED - this.fofState.gcdCounter)
		this.fofErrorResult.missedGorings += Math.max(0, CONSTANTS.GORING.EXPECTED - this.fofState.goringCounter)
		this.fofErrorResult.missedSpiritWithins += Math.max(0, CONSTANTS.SPIRITS_WITHIN.EXPECTED - this.fofState.spiritsWithinCounter)
		this.fofErrorResult.missedCircleOfScorns += Math.max(0, CONSTANTS.CIRCLE_OF_SCORN.EXPECTED - this.fofState.circleOfScornCounter)

		this.fofState = new FightOrFlightState()
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.FIGHT_OR_FLIGHT.icon,
			content: <Trans id="pld.fightorflight.suggestions.gcds.content">
				Try to land 10 GCDs during every <ActionLink {...ACTIONS.FIGHT_OR_FLIGHT}/> window.
			</Trans>,
			why: <Trans id="pld.fightorflight.suggestions.gcds.why">
				<Plural value={this.fofErrorResult.missedGcds} one="# GCD" other="# GCDs"/> missed during <StatusLink {...STATUSES.FIGHT_OR_FLIGHT}/> windows.
			</Trans>,
			tiers: SEVERETIES.MISSED_GCD,
			value: this.fofErrorResult.missedGcds,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.GORING_BLADE.icon,
			content: <Trans id="pld.fightorflight.suggestions.goring-blade.content">
				Try to land 2 <ActionLink {...ACTIONS.GORING_BLADE}/> during
				every <ActionLink {...ACTIONS.FIGHT_OR_FLIGHT}/> window. One at the beginning and one at the end.
			</Trans>,
			why: <Trans id="pld.fightorflight.suggestions.goring-blade.why">
				<Plural value={this.fofErrorResult.missedGorings} one="# application" other="# applications"/> missed during <StatusLink {...STATUSES.FIGHT_OR_FLIGHT}/> windows.
			</Trans>,
			tiers: SEVERETIES.MISSED_GORING,
			value: this.fofErrorResult.missedGorings,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.SPIRITS_WITHIN.icon,
			content: <Trans id="pld.fightorflight.suggestions.spirits-within.content">
				Try to land one <ActionLink {...ACTIONS.SPIRITS_WITHIN}/> during
				every <ActionLink {...ACTIONS.FIGHT_OR_FLIGHT}/> window.
			</Trans>,
			why: <Trans id="pld.fightorflight.suggestions.spirits-within.why">
				<Plural value={this.fofErrorResult.missedSpiritWithins} one="# usage" other="# usages"/> missed during <StatusLink {...STATUSES.FIGHT_OR_FLIGHT}/> windows.
			</Trans>,
			tiers: SEVERETIES.MISSED_SPIRIT_WITHIN,
			value: this.fofErrorResult.missedSpiritWithins,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.CIRCLE_OF_SCORN.icon,
			content: <Trans id="pld.fightorflight.suggestions.circle-of-scorn.content">
				Try to land one <ActionLink {...ACTIONS.CIRCLE_OF_SCORN}/> during
				every <ActionLink {...ACTIONS.FIGHT_OR_FLIGHT}/> window.
			</Trans>,
			why: <Trans id="pld.fightorflight.suggestions.circle-of-scorn.why">
				<Plural value={this.fofErrorResult.missedCircleOfScorns} one="# usage" other="# usages"/> missed during <StatusLink {...STATUSES.FIGHT_OR_FLIGHT}/> windows.
			</Trans>,
			tiers: SEVERETIES.MISSED_CIRCLE_OF_SCORN,
			value: this.fofErrorResult.missedCircleOfScorns,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.GORING_BLADE.icon,
			severity: matchClosestLower(SEVERETIES.MISSED_GCD, this.fofErrorResult.goringTooCloseCounter),
			content: <Trans id="pld.fightorflight.suggestions.goring-blade-clip.content">
				Try to refresh <ActionLink {...ACTIONS.GORING_BLADE}/> 9 GCDs after the
				first <ActionLink {...ACTIONS.GORING_BLADE}/> in
				a <ActionLink {...ACTIONS.FIGHT_OR_FLIGHT}/> window.
			</Trans>,
			why: <Trans id="pld.fightorflight.suggestions.goring-blade-clip.why">
				<Plural value={this.fofErrorResult.goringTooCloseCounter} one="# application was" other="# applications were"/> refreshed too early during <StatusLink {...STATUSES.FIGHT_OR_FLIGHT}/> windows.
			</Trans>,
			tiers: SEVERETIES.GORING_CLIP,
			value: this.fofErrorResult.goringTooCloseCounter,
		}))
	}

	private RotationTableRow = ({timestamp, rotation}: {timestamp: number, rotation: CastEvent[]}) => {
		const gcdCount = rotation
			.filter(event => (getAction(event.ability.guid) as any).onGcd)
			.length

		const goringCount = rotation
			.filter(event => event.ability.guid === ACTIONS.GORING_BLADE.id)
			.length

		const spiritsWithinCount = rotation
			.filter(event => event.ability.guid === ACTIONS.SPIRITS_WITHIN.id)
			.length

		const circleOfScornCount = rotation
			.filter(event => event.ability.guid === ACTIONS.CIRCLE_OF_SCORN.id)
			.length

		return <Table.Row>
			<Table.Cell textAlign="center">
				<span style={{marginRight: 5}}>{this.parser.formatTimestamp(timestamp)}</span>
				<Button circular compact size="mini" icon="time" onClick={() => this.timeline.show(timestamp - this.parser.fight.start_time, timestamp + (STATUSES.FIGHT_OR_FLIGHT.duration * 1000) - this.parser.fight.start_time)}/>
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
				<Rotation events={rotation}/>
			</Table.Cell>
		</Table.Row>
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

							return <this.RotationTableRow
								key={ts}
								timestamp={ts}
								rotation={this.fofRotations[ts]}
							/>
						})
				}
			</Table.Body>
		</Table>
	}
}
