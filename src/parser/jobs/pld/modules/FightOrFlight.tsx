import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {RotationTable, RotationTableEntry} from 'components/ui/RotationTable'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {CastEvent} from 'fflogs'
import _ from 'lodash'
import Module, {dependency} from 'parser/core/Module'
import Invulnerability from 'parser/core/modules/Invulnerability'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import Timeline from 'parser/core/modules/Timeline'
import React from 'react'
import {matchClosestLower} from 'utilities'

interface TimestampRotationMap {
	[timestamp: number]: CastEvent[]
}

const SEVERETIES = {
	MISSED_OGCDS: {
		1: SEVERITY.MINOR,
		4: SEVERITY.MEDIUM,
		8: SEVERITY.MAJOR,
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
	INTERVENE: {
		EXPECTED: 1,
	},
	GCD: {
		EXPECTED: 10,
	},
}

const FOF_DURATION_MILLIS = STATUSES.FIGHT_OR_FLIGHT.duration * 1000

class FightOrFlightState {
	start: number | null = null
	lastGoringGcd: number | null = null
	gcdCounter: number = 0
	goringCounter: number = 0
	circleOfScornCounter: number = 0
	spiritsWithinCounter: number = 0
	interveneCounter: number = 0
	isRushed: boolean = false
}

class FightOrFlightErrorResult {
	missedGcds: number = 0
	missedGorings: number = 0
	missedSpiritWithins: number = 0
	missedCircleOfScorns: number = 0
	missedIntervenes: number = 0
	goringTooCloseCounter: number = 0
}

export default class FightOrFlight extends Module {
	static handle = 'fightorflight'
	static title = t('pld.fightorflight.title')`Fight Or Flight Usage`

	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline
	@dependency private invuln!: Invulnerability

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

			const endOfWindow = event.timestamp + FOF_DURATION_MILLIS
			this.fofState.isRushed = endOfWindow >= this.parser.fight.end_time
				|| this.invuln.isInvulnerable('all', endOfWindow)
				|| this.invuln.isUntargetable('all', endOfWindow)
		}

		if (this.fofState.start) {
			const action = getDataBy(ACTIONS, 'id', actionId) as TODO // Should be an Action type
			if (!action) { return }

			if (action.onGcd) {
				this.fofState.gcdCounter++
			}

			switch (actionId) {
				case ACTIONS.GORING_BLADE.id:
					this.fofState.goringCounter++

					if (this.fofState.lastGoringGcd !== null) {
						if (this.fofState.gcdCounter - this.fofState.lastGoringGcd < CONSTANTS.GORING.MINIMUM_DISTANCE
							&& !this.fofState.isRushed) {
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
				case ACTIONS.INTERVENE.id:
					this.fofState.interveneCounter++
					break
			}

			if (!Array.isArray(this.fofRotations[this.fofState.start])) {
				this.fofRotations[this.fofState.start] = []
			}

			this.fofRotations[this.fofState.start].push(event)
		}
	}

	private onRemoveFightOrFlight() {
		if (!this.fofState.isRushed) {
			this.fofErrorResult.missedGcds += Math.max(0, CONSTANTS.GCD.EXPECTED - this.fofState.gcdCounter)
			this.fofErrorResult.missedGorings += Math.max(0, CONSTANTS.GORING.EXPECTED - this.fofState.goringCounter)
			this.fofErrorResult.missedSpiritWithins += Math.max(0, CONSTANTS.SPIRITS_WITHIN.EXPECTED - this.fofState.spiritsWithinCounter)
			this.fofErrorResult.missedCircleOfScorns += Math.max(0, CONSTANTS.CIRCLE_OF_SCORN.EXPECTED - this.fofState.circleOfScornCounter)
			this.fofErrorResult.missedIntervenes += Math.max(0, CONSTANTS.INTERVENE.EXPECTED - this.fofState.interveneCounter)
		}

		this.fofState = new FightOrFlightState()
	}

	private onComplete() {
		const missedOgcds = this.fofErrorResult.missedSpiritWithins + this.fofErrorResult.missedCircleOfScorns + this.fofErrorResult.missedIntervenes

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
				Try to land 2 <ActionLink {...ACTIONS.GORING_BLADE}/> applications during
				every <ActionLink {...ACTIONS.FIGHT_OR_FLIGHT}/> window: one at the beginning and one at the end.
			</Trans>,
			why: <Trans id="pld.fightorflight.suggestions.goring-blade.why">
				<Plural value={this.fofErrorResult.missedGorings} one="# application" other="# applications"/> missed during <StatusLink {...STATUSES.FIGHT_OR_FLIGHT}/> windows.
			</Trans>,
			tiers: SEVERETIES.MISSED_GORING,
			value: this.fofErrorResult.missedGorings,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.SPIRITS_WITHIN.icon,
			content: <Trans id="pld.fightorflight.suggestions.ogcds.content">
				Try to land at least one cast of each of your off-GCD skills during
				every <ActionLink {...ACTIONS.FIGHT_OR_FLIGHT}/> window.
			</Trans>,
			why: <Trans id="pld.fightorflight.suggestions.ogcds.why">
				<Plural value={missedOgcds} one="# usage" other="# usages"/> missed during <StatusLink {...STATUSES.FIGHT_OR_FLIGHT}/> windows.
			</Trans>,
			tiers: SEVERETIES.MISSED_OGCDS,
			value: missedOgcds,
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

	private countAbility(rotation: CastEvent[], abilityId: number) {
		return rotation.reduce((sum, event) => sum + (event.ability.guid === abilityId ? 1 : 0), 0)
	}

	private countGCDs(rotation: CastEvent[]) {
		return rotation.reduce((sum, event) => {
			const action = getDataBy(ACTIONS, 'id', event.ability.guid) as TODO
			return sum + (action && action.onGcd ? 1 : 0)
		}, 0)
	}

	output() {
		return <RotationTable
			targets={[
				{
					header: <Trans id="pld.fightorflight.table.header.gcds">GCDs</Trans>,
					accessor: 'gcds',
				},
				{
					header: <ActionLink showName={false} {...ACTIONS.SPIRITS_WITHIN}/>,
					accessor: 'spiritsWithin',
				},
				{
					header: <ActionLink showName={false} {...ACTIONS.CIRCLE_OF_SCORN}/>,
					accessor: 'circleOfScorn',
				},
				{
					header: <ActionLink showName={false} {...ACTIONS.INTERVENE}/>,
					accessor: 'intervene',
				},
				{
					header: <ActionLink showName={false} {...ACTIONS.GORING_BLADE}/>,
					accessor: 'goring',
				},
			]}
			data={_.map(this.fofRotations, (rotation, timestamp): RotationTableEntry => {
				const ts = _.toNumber(timestamp)

				return {
					start: ts - this.parser.fight.start_time,
					end: ts - this.parser.fight.start_time + (STATUSES.FIGHT_OR_FLIGHT.duration * 1000),
					targetsData: {
						gcds: {
							actual: this.countGCDs(rotation),
							expected: CONSTANTS.GCD.EXPECTED,
						},
						spiritsWithin: {
							actual: this.countAbility(rotation, ACTIONS.SPIRITS_WITHIN.id),
							expected: CONSTANTS.SPIRITS_WITHIN.EXPECTED,
						},
						circleOfScorn: {
							actual: this.countAbility(rotation, ACTIONS.CIRCLE_OF_SCORN.id),
							expected: CONSTANTS.CIRCLE_OF_SCORN.EXPECTED,
						},
						intervene: {
							actual: this.countAbility(rotation, ACTIONS.INTERVENE.id),
							expected: CONSTANTS.INTERVENE.EXPECTED,
						},
						goring: {
							actual: this.countAbility(rotation, ACTIONS.GORING_BLADE.id),
							expected: CONSTANTS.GORING.EXPECTED,
						},
					},
					rotation,
				}
			})}
			onGoto={this.timeline.show}
		/>
	}
}
