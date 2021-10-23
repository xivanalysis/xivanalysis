import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import {StatusKey} from 'data/STATUSES'
import {Cause, Event, Events} from 'event'
import _ from 'lodash'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import CheckList, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import Downtime from 'parser/core/modules/Downtime'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {Statuses} from 'parser/core/modules/Statuses'
import Suggestions, {SEVERITY, TieredSuggestion, Suggestion} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'
import {isSuccessfulHit} from 'utilities'
import {DANCE_MOVES, DEFAULT_SEVERITY_TIERS, FINISHES, STEPS} from '../CommonData'
import DISPLAY_ORDER from '../DISPLAY_ORDER'

// Slightly different than normal severity. Start at minor in case it's just a math error, but upgrade
// Severity with every additional calculated drift since it's a more important issue than others
const DRIFT_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}

const EXPECTED_DANCE_MOVE_COUNT: {[key: string]: number} = {
	['Standard Step']: 2,
	['Technical Step']: 4,
}

const DANCE_COMPLETION_LENIENCY_MILLIS = 1000

class Dance {
	end?: number
	initiatingStep: Events['action']
	rotation: Array<Events['action']> = []
	dancing: boolean = false
	resolved: boolean = false

	dirty: boolean = false
	missed: boolean = false
	footloose: boolean = false

	data!: Data

	public get error(): boolean {
		return this.dirty || this.missed || this.footloose
	}

	public get expectedFinishId(): number {
		const actualFinish = _.last(this.rotation)
		let expectedFinish = -1
		if (actualFinish) {
			if (this.initiatingStep.action === this.data.actions.TECHNICAL_STEP.id) {
				expectedFinish =  this.data.actions.QUADRUPLE_TECHNICAL_FINISH.id
			} else if (this.initiatingStep.action === this.data.actions.STANDARD_STEP.id) {
				expectedFinish = this.data.actions.DOUBLE_STANDARD_FINISH.id
			}
		}
		return expectedFinish
	}

	public get expectedEndTime(): number {
		const actionData = this.data.getAction(this.initiatingStep.action)
		if (actionData == null) { return this.initiatingStep.timestamp }
		return this.start + (actionData.gcdRecast ?? 0)
			+ this.expectedDanceMoves * this.data.actions.JETE.cooldown // All of the dance moves have the same cooldown, so just pick one
			+ DANCE_COMPLETION_LENIENCY_MILLIS // Additional leniency to account for network latency
	}

	public get expectedDanceMoves(): number {
		const actionData = this.data.getAction(this.initiatingStep.action)
		if (actionData == null) { return 0 }
		return EXPECTED_DANCE_MOVE_COUNT[actionData.name]
	}

	public get start(): number {
		return this.initiatingStep.timestamp
	}

	constructor(danceEvent: Events['action'], data: Data) {
		this.initiatingStep = danceEvent
		this.dancing = true
		this.data = data
	}
}

export class DirtyDancing extends Analyser {
	static override handle = 'dirtydancing'
	static override title = t('dnc.dirty-dancing.title')`Dance Issues`
	static override displayOrder = DISPLAY_ORDER.DIRTY_DANCING

	@dependency private checklist!: CheckList
	@dependency private suggestions!: Suggestions
	@dependency private invulnerability!: Invulnerability
	@dependency private actors!: Actors
	@dependency private timeline!: Timeline
	@dependency private downtime!: Downtime
	@dependency private statuses!: Statuses
	@dependency private data!: Data

	private danceHistory: Dance[] = []
	private missedDances = 0
	private dirtyDances = 0
	private footlooseDances = 0

	private previousUseTimestamp = {
		[this.data.actions.STANDARD_STEP.id]: this.parser.pull.timestamp,
		[this.data.actions.TECHNICAL_STEP.id]: this.parser.pull.timestamp,
	}
	private totalDrift = {
		[this.data.actions.STANDARD_STEP.id]: 0,
		[this.data.actions.TECHNICAL_STEP.id]: 0,
	}

	private stepIds = STEPS.map(key => this.data.actions[key].id)
	private danceMoveIds = DANCE_MOVES.map(key => this.data.actions[key].id)

	override initialise() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action').action(oneOf(this.stepIds)), this.beginDance)
		this.addEventHook(playerFilter.type('action').action(oneOf(this.danceMoveIds)), this.continueDance)
		this.addEventHook(playerFilter.type('action').action(oneOf(FINISHES)), this.finishDance)
		this.addEventHook(playerFilter.type('damage').cause(filter<Cause>().action(oneOf(FINISHES))), this.resolveDance)
		this.addEventHook('complete', this.onComplete)
	}

	dancesInRange(startTime: number, endTime: number) {
		return this.danceHistory.filter(dance => dance.start >= startTime && dance.start <= endTime).length
	}

	private addDanceToHistory(event: Events['action']): Dance {
		const newDance = new Dance(event, this.data)
		newDance.rotation.push(event)
		this.danceHistory.push(newDance)
		const stepId = event.action
		if (this.previousUseTimestamp[stepId]) {
			const lastUse = this.previousUseTimestamp[stepId]
			const downtime = this.downtime.getDowntime(lastUse, event.timestamp)
			const drift = Math.max(0, event.timestamp - lastUse - (this.data.getAction(stepId)?.cooldown ?? 0) - downtime)
			this.totalDrift[stepId] += drift
			this.previousUseTimestamp[stepId] = event.timestamp
		}

		return newDance
	}

	private beginDance(event: Events['action']) {
		this.addDanceToHistory(event)
	}

	private get lastDance(): Dance | undefined {
		return _.last(this.danceHistory)
	}

	private continueDance(event: Events['action']) {
		const dance = this.lastDance
		if (dance && dance.dancing) {
			dance.rotation.push(event)
		}
	}

	private finishDance(event: Events['action']) {
		let dance = this.lastDance
		if (dance && dance.dancing) {
			dance.rotation.push(event)
		} else {
			dance = this.addDanceToHistory(event)
		}
		dance.dancing = false
	}

	private resolveDance(event: Events['damage']) {
		const dance = this.lastDance

		if (!dance || dance.resolved) {
			return
		}

		const finisher = dance.rotation[dance.rotation.length-1]
		dance.end = finisher.timestamp

		// Count dance as dirty if we didn't get the expected finisher, and the fight wouldn't have ended or been in an invuln window before we could have
		if (finisher.action !== dance.expectedFinishId && dance.expectedEndTime <= this.parser.pull.timestamp + this.parser.pull.duration) {
			this.addTimestampHook(dance.expectedEndTime, ({timestamp}) => {
				dance.dirty = this.invulnerability.isActive({
					timestamp,
					types: ['invulnerable'],
				})
			})
		}

		// If the finisher didn't hit anything, and something could've been, ding it.
		// Don't gripe if the boss is invuln, there is use-case for finishing during the downtime
		if (
			!isSuccessfulHit(event)
			&& !this.invulnerability.isActive({
				timestamp: finisher.timestamp,
				types: ['invulnerable'],
			})
		) {
			dance.missed = true
		}
		// Dancer messed up if more step actions were recorded than we expected
		const actualCount = dance.rotation.filter(step => this.danceMoveIds.includes(step.action)).length
		// Only ding if the step count is greater than expected, we're not going to catch the steps in the opener dance
		if (actualCount > dance.expectedDanceMoves) {
			dance.footloose = true
		}

		dance.resolved = true
	}

	private getStatusUptimePercent(statusKey: StatusKey): number {
		// Exclude downtime from both the status time and expected uptime
		const statusTime = this.statuses.getUptime(statusKey, this.actors.friends) - this.downtime.getDowntime()
		const uptime = this.parser.currentDuration - this.downtime.getDowntime()

		return (statusTime / uptime) * 100
	}

	private onComplete() {
		const zeroStandards = this.danceHistory.filter(dance => dance.dirty && dance.initiatingStep.action === this.data.actions.STANDARD_STEP.id &&
			_.last(dance.rotation)?.action === this.data.actions.STANDARD_FINISH.id).length
		const zeroTechnicals = this.danceHistory.filter(dance => dance.dirty && dance.initiatingStep.action === this.data.actions.TECHNICAL_STEP.id &&
			_.last(dance.rotation)?.action === this.data.actions.TECHNICAL_FINISH.id).length
		this.missedDances = this.danceHistory.filter(dance => dance.missed).length
		this.dirtyDances = Math.max(this.danceHistory.filter(dance => dance.dirty).length - (zeroStandards + zeroTechnicals), 0)
		this.footlooseDances = this.danceHistory.filter(dance => dance.footloose).length

		// Suggest to move closer for finishers.
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.TECHNICAL_FINISH.icon,
			content: <Trans id="dnc.dirty-dancing.suggestions.missed-finishers.content">
				<ActionLink {...this.data.actions.TECHNICAL_FINISH} /> and <ActionLink {...this.data.actions.STANDARD_FINISH} /> are a significant source of damage. Make sure you're in range when finishing a dance.
			</Trans>,
			tiers: DEFAULT_SEVERITY_TIERS,
			value: this.missedDances,
			why: <Trans id="dnc.dirty-dancing.suggestions.missed-finishers.why">
				<Plural value={this.missedDances} one="# finish" other="# finishes"/> missed.
			</Trans>,
		}))

		// Suggestion to get all expected finishers
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.STANDARD_FINISH.icon,
			content: <Trans id="dnc.dirty-dancing.suggestions.dirty-dances.content">
				Performing fewer steps than expected reduces the damage of your finishes. Make sure you perform the expected number of steps.
			</Trans>,
			tiers: DEFAULT_SEVERITY_TIERS,
			value: this.dirtyDances,
			why: <Trans id="dnc.dirty-dancing.suggestions.dirty-dances.why">
				<Plural value={this.dirtyDances} one="# dance" other="# dances"/> finished with missing steps.
			</Trans>,
		}))

		// Suggestion to not faff about with steps
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.EMBOITE.icon,
			content: <Trans id="dnc.dirty-dancing.suggestions.footloose.content">
				Performing the wrong steps makes your dance take longer and leads to a loss of DPS uptime. Make sure to perform your dances correctly.
			</Trans>,
			tiers: DEFAULT_SEVERITY_TIERS,
			value: this.footlooseDances,
			why: <Trans id="dnc.dirty-dancing.suggestions.footloose.why">
				<Plural value={this.footlooseDances} one="# dance" other="# dances"/> finished with extra steps.
			</Trans>,
		}))

		const standardFinishUptimePct = this.getStatusUptimePercent('STANDARD_FINISH')
		this.checklist.add(new Rule({
			name: <Trans id="dnc.dirty-dancing.checklist.standard-finish-buff.name">Keep your <StatusLink {...this.data.statuses.STANDARD_FINISH} /> buff up</Trans>,
			description: <Trans id="dnc.dirty-dancing.checklist.standard-finish-buff.description">
				Your <StatusLink {...this.data.statuses.STANDARD_FINISH} /> buff contributes significantly to your overall damage, and the damage of your <StatusLink {...this.data.statuses.DANCE_PARTNER} /> as well. Make sure to keep it up at all times.
			</Trans>,
			target: 95,
			requirements: [
				new Requirement({
					name: <Fragment><StatusLink {...this.data.statuses.STANDARD_FINISH} /> uptime</Fragment>,
					percent: standardFinishUptimePct,
				}),
			],
		}))

		const closedPositionUptimePct = this.getStatusUptimePercent('CLOSED_POSITION')
		this.checklist.add(new Rule({
			name: <Trans id="dnc.dirty-dancing.checklist.closed-position-buff.name">Choose a <StatusLink {...this.data.statuses.DANCE_PARTNER} /></Trans>,
			description: <Trans id="dnc.dirty-dancing.checklist.closed-position-buff.description">
				Choosing a <StatusLink {...this.data.statuses.DANCE_PARTNER} /> will also give them the <StatusLink {...this.data.statuses.STANDARD_FINISH_PARTNER} /> and <StatusLink {...this.data.statuses.DEVILMENT} /> buffs. Make sure to keep it up at all times except for rare circumstances where a switch is warranted.
			</Trans>,
			target: 95,
			requirements: [
				new Requirement({
					name: <Fragment><StatusLink {...this.data.statuses.CLOSED_POSITION} /> uptime (excluding downtime)</Fragment>,
					percent: closedPositionUptimePct,
				}),
			],
		}))

		const driftedStandards = Math.floor(this.totalDrift[this.data.actions.STANDARD_STEP.id] / this.data.actions.STANDARD_STEP.cooldown)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.STANDARD_STEP.icon,
			content: <Trans id="dnc.dirty-dancing.suggestions.standard-drift.content">You may have lost a use of <ActionLink {...this.data.actions.STANDARD_STEP} /> by letting the cooldown drift. Try to keep it on cooldown, even if it means letting your GCD sit for a second.
			</Trans>,
			tiers: DRIFT_SEVERITY_TIERS,
			value: driftedStandards,
			why: <Trans id="dnc.dirty-dancing.suggestions.standard-drift.why">
				<Plural value={driftedStandards} one="# Standard Step was" other="# Standard Steps were"/> lost due to drift.
			</Trans>,
		}))

		const driftedTechnicals = Math.floor(this.totalDrift[this.data.actions.TECHNICAL_STEP.id] / this.data.actions.TECHNICAL_STEP.cooldown)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.TECHNICAL_STEP.icon,
			content: <Trans id="dnc.dirty-dancing.suggestions.technical-drift.content">You may have lost a use of <ActionLink {...this.data.actions.TECHNICAL_STEP} /> by letting the cooldown drift. Try to keep it on cooldown, even if it means letting your GCD sit for a second.
			</Trans>,
			tiers: DRIFT_SEVERITY_TIERS,
			value: driftedTechnicals,
			why: <Trans id="dnc.dirty-dancing.suggestions.technical-drift.why">
				<Plural value={driftedTechnicals} one="# Technical Step was" other="# Technical Steps were"/> lost due to drift.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.STANDARD_STEP.icon,
			content: <Trans id="dnc.dirty-dancing.suggestions.zero-standard.content">
				Using <ActionLink {...this.data.actions.STANDARD_FINISH} /> without completing any steps provides no damage buff to you and your <StatusLink {...this.data.statuses.DANCE_PARTNER} />, which is a core part of the job. Make sure to perform your dances correctly.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			value: zeroStandards,
			why: <Trans id="dnc.dirty-dancing.suggestions.zero-standard.why">
				<Plural value={zeroStandards} one="# Standard Step was" other="# Standard Steps were"/> completed with no dance steps.
			</Trans>,
		}))

		if (zeroTechnicals > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.TECHNICAL_STEP.icon,
				content: <Trans id="dnc.dirty-dancing.suggestions.zero-technical.content">
					Using <ActionLink {...this.data.actions.TECHNICAL_FINISH} /> without completing any steps provides no damage buff to you and your party, which is a core part of the job. Make sure to perform your dances correctly.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="dnc.dirty-dancing.suggestions.zero-technical.why">
					<Plural value={zeroTechnicals} one="# Technical Step was" other="# Technical Steps were"/> completed with no dance steps.
				</Trans>,
			}))
		}
	}

	override output() {
		if (this.danceHistory.some(dance => dance.error)) {
			return <Fragment>
				<Message>
					<Trans id="dnc.dirty-dancing.rotation-table.message">
						One of Dancer's primary responsibilities is buffing the party's damage via dances.<br />
						Each dance also contributes to the Dancer's own damage and should be performed correctly.
					</Trans>
				</Message>
				<RotationTable
					notes={[
						{
							header: <Trans id="dnc.dirty-dancing.rotation-table.header.missed">Hit Target</Trans>,
							accessor: 'missed',
						},
						{
							header: <Trans id="dnc.dirty-dancing.rotation-table.header.dirty">Correct Finish</Trans>,
							accessor: 'dirty',
						},
						{
							header: <Trans id="dnc.dirty-dancing.rotation-table.header.footloose">No Extra Moves</Trans>,
							accessor: 'footloose',
						},
					]}
					data={this.danceHistory.filter(dance => dance.error).map(dance => {
						return ({
							start: dance.start - this.parser.pull.timestamp,
							end: dance.end != null ?
								dance.end - this.parser.pull.timestamp :
								dance.start - this.parser.pull.timestamp,
							notesMap: {
								missed: <>{this.getNotesIcon(dance.missed)}</>,
								dirty: <>{this.getNotesIcon(dance.dirty)}</>,
								footloose: <>{this.getNotesIcon(dance.footloose)}</>,
							},
							rotation: dance.rotation,
						})
					})}
					onGoto={this.timeline.show}
				/>
			</Fragment>
		}
	}

	private getNotesIcon(ruleFailed: boolean): TODO {
		return <Icon
			name={ruleFailed ? 'remove' : 'checkmark'}
			className={ruleFailed ? 'text-error' : 'text-success'}
		/>
	}
}
