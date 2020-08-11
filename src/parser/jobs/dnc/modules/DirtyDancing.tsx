import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import _ from 'lodash'
import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import CheckList, {Requirement, Rule} from 'parser/core/modules/Checklist'
import Combatants from 'parser/core/modules/Combatants'
import Downtime from 'parser/core/modules/Downtime'
import {EntityStatuses} from 'parser/core/modules/EntityStatuses'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {NormalisedDamageEvent} from 'parser/core/modules/NormalisedEvents'
import Suggestions, {SEVERITY, TieredSuggestion, Suggestion} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import {DEFAULT_SEVERITY_TIERS, FINISHES, STANDARD_FINISHES, TECHNICAL_FINISHES} from '../CommonData'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
import {getDataBy} from 'data'

// Slightly different than normal severity. Start at minor in case it's just a math error, but upgrade
// Severity with every additional calculated drift since it's a more important issue than others
const DRIFT_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}

const STEPS = [
	ACTIONS.STANDARD_STEP.id,
	ACTIONS.TECHNICAL_STEP.id,
]

const DANCE_MOVES = [
	ACTIONS.ENTRECHAT.id,
	ACTIONS.EMBOITE.id,
	ACTIONS.JETE.id,
	ACTIONS.PIROUETTE.id,
]

const EXPECTED_DANCE_MOVE_COUNT = {
	[ACTIONS.DOUBLE_STANDARD_FINISH.id]: 2,
	[ACTIONS.QUADRUPLE_TECHNICAL_FINISH.id]: 4,
	[-1]: 0,
}

// All of the dance moves have the same cooldown, so we'll just use one of them for this...
const DANCE_MOVE_COOLDOWN_MILLIS = ACTIONS.JETE.cooldown * 1000

const STEP_COOLDOWN_MILLIS = {
	[ACTIONS.STANDARD_STEP.id]: ACTIONS.STANDARD_STEP.cooldown * 1000,
	[ACTIONS.TECHNICAL_STEP.id]: ACTIONS.TECHNICAL_STEP.cooldown * 1000,
}

const DANCE_COMPLETION_LENIENCY_MILLIS = 1000

class Dance {
	end?: number
	initiatingStep: CastEvent
	rotation: CastEvent[] = []
	dancing: boolean = false
	resolved: boolean = false

	dirty: boolean = false
	missed: boolean = false
	footloose: boolean = false

	public get error(): boolean {
		return this.dirty || this.missed || this.footloose
	}

	public get expectedFinishId(): number {
		const actualFinish = _.last(this.rotation)
		let expectedFinish = -1
		if (actualFinish) {
			if (this.initiatingStep.ability.guid === ACTIONS.TECHNICAL_STEP.id) {
				expectedFinish =  ACTIONS.QUADRUPLE_TECHNICAL_FINISH.id
			} else if (this.initiatingStep.ability.guid === ACTIONS.STANDARD_STEP.id) {
				expectedFinish = ACTIONS.DOUBLE_STANDARD_FINISH.id
			}
		}
		return expectedFinish
	}

	public get expectedEndTime(): number {
		const actionData = getDataBy(ACTIONS, 'id', this.initiatingStep.ability.guid) as TODO
		return this.start + actionData.gcdRecast * 1000
			+ EXPECTED_DANCE_MOVE_COUNT[this.expectedFinishId] * DANCE_MOVE_COOLDOWN_MILLIS
			+ DANCE_COMPLETION_LENIENCY_MILLIS // Additional leniency to account for network latency
	}

	public get start(): number {
		return this.initiatingStep.timestamp
	}

	constructor(danceEvent: CastEvent) {
		this.initiatingStep = danceEvent
		this.dancing = true
	}
}

export default class DirtyDancing extends Module {
	static handle = 'dirtydancing'
	static title = t('dnc.dirty-dancing.title')`Dance Issues`
	static displayOrder = DISPLAY_ORDER.DIRTY_DANCING

	@dependency private checklist!: CheckList
	@dependency private suggestions!: Suggestions
	@dependency private invuln!: Invulnerability
	@dependency private combatants!: Combatants
	@dependency private timeline!: Timeline
	@dependency private downtime!: Downtime
	@dependency private entityStatuses!: EntityStatuses

	private danceHistory: Dance[] = []
	private missedDances = 0
	private dirtyDances = 0
	private footlooseDances = 0

	private previousUseTimestamp = {
		[ACTIONS.STANDARD_STEP.id]: this.parser.fight.start_time,
		[ACTIONS.TECHNICAL_STEP.id]: this.parser.fight.start_time,
	}
	private totalDrift = {
		[ACTIONS.STANDARD_STEP.id]: 0,
		[ACTIONS.TECHNICAL_STEP.id]: 0,
	}

	protected init() {
		this.addEventHook('cast', {by: 'player', abilityId: STEPS}, this.beginDance)
		this.addEventHook('cast', {by: 'player'}, this.continueDance)
		this.addEventHook('cast', {by: 'player', abilityId: FINISHES}, this.finishDance)
		this.addEventHook('normaliseddamage', {by: 'player', abilityId: FINISHES}, this.resolveDance)
		this.addEventHook('complete', this.onComplete)
	}

	dancesInRange(startTime: number, endTime: number) {
		return this.danceHistory.filter(dance => dance.start >= startTime && dance.start <= endTime).length
	}

	private addDanceToHistory(event: CastEvent): Dance {
		const newDance = new Dance(event)
		newDance.rotation.push(event)
		this.danceHistory.push(newDance)
		const stepId = event.ability.guid
		if (this.previousUseTimestamp[stepId]) {
			const lastUse = this.previousUseTimestamp[stepId]
			const drift = Math.max(0, event.timestamp - lastUse - STEP_COOLDOWN_MILLIS[stepId] - this.downtime.getDowntime(lastUse, event.timestamp))
			this.totalDrift[stepId] += drift
			this.previousUseTimestamp[stepId] = event.timestamp
		}

		return newDance
	}

	private beginDance(event: CastEvent) {
		this.addDanceToHistory(event)
	}

	private get lastDance(): Dance | undefined {
		return _.last(this.danceHistory)
	}

	private continueDance(event: CastEvent) {
		// Bail if beginDance or finishDance should be handling this event
		if (STEPS.includes(event.ability.guid) || FINISHES.includes(event.ability.guid)) {
			return
		}

		const dance = this.lastDance
		if (dance && dance.dancing) {
			dance.rotation.push(event)
		}
	}

	private finishDance(event: CastEvent) {
		let dance = this.lastDance
		if (dance && dance.dancing) {
			dance.rotation.push(event)
		} else {
			dance = this.addDanceToHistory(event)
		}
		dance.dancing = false
	}

	private resolveDance(event: NormalisedDamageEvent) {
		const dance = this.lastDance

		if (!dance || dance.resolved) {
			return
		}

		const finisher = dance.rotation[dance.rotation.length-1]
		dance.end = finisher.timestamp

		// Count dance as dirty if we didn't get the expected finisher, and the fight wouldn't have ended or been in an invuln window before we could have
		if (finisher.ability.guid !== dance.expectedFinishId && !(this.parser.fight.end_time < dance.expectedEndTime || this.invuln.isInvulnerable('all', dance.expectedEndTime))) {
			dance.dirty = true
		}
		// If the finisher didn't hit anything, and something could've been, ding it.
		// Don't gripe if the boss is invuln, there is use-case for finishing during the downtime
		if (!event.hasSuccessfulHit && !this.invuln.isInvulnerable('all', finisher.timestamp)) {
			dance.missed = true
		}
		// Dancer messed up if more step actions were recorded than we expected
		const actualCount = dance.rotation.filter(step => DANCE_MOVES.includes(step.ability.guid)).length
		const expectedCount = EXPECTED_DANCE_MOVE_COUNT[dance.expectedFinishId]
		// Only ding if the step count is greater than expected, we're not going to catch the steps in the opener dance
		if (actualCount > expectedCount) {
			dance.footloose = true
		}

		dance.resolved = true
	}

	private getStandardFinishUptimePercent() {
		// Exclude downtime from both the status time and expected uptime
		const statusTime = this.entityStatuses.getStatusUptime(STATUSES.STANDARD_FINISH.id, this.combatants.getEntities()) - this.downtime.getDowntime()
		const uptime = this.parser.currentDuration - this.downtime.getDowntime()

		return (statusTime / uptime) * 100
	}

	private onComplete() {
		const zeroStandards = this.danceHistory.filter(dance => dance.dirty && dance.initiatingStep.ability.guid === ACTIONS.STANDARD_STEP.id &&
			_.last(dance.rotation)?.ability.guid === ACTIONS.STANDARD_FINISH.id).length
		const zeroTechnicals = this.danceHistory.filter(dance => dance.dirty && dance.initiatingStep.ability.guid === ACTIONS.TECHNICAL_STEP.id &&
			_.last(dance.rotation)?.ability.guid === ACTIONS.TECHNICAL_FINISH.id).length
		this.missedDances = this.danceHistory.filter(dance => dance.missed).length
		this.dirtyDances = Math.max(this.danceHistory.filter(dance => dance.dirty).length - (zeroStandards + zeroTechnicals), 0)
		this.footlooseDances = this.danceHistory.filter(dance => dance.footloose).length

		// Suggest to move closer for finishers.
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.TECHNICAL_FINISH.icon,
			content: <Trans id="dnc.dirty-dancing.suggestions.missed-finishers.content">
				<ActionLink {...ACTIONS.TECHNICAL_FINISH} /> and <ActionLink {...ACTIONS.STANDARD_FINISH} /> are a significant source of damage. Make sure you're in range when finishing a dance.
			</Trans>,
			tiers: DEFAULT_SEVERITY_TIERS,
			value: this.missedDances,
			why: <Trans id="dnc.dirty-dancing.suggestions.missed-finishers.why">
				<Plural value={this.missedDances} one="# finish" other="# finishes"/> missed.
			</Trans>,
		}))

		// Suggestion to get all expected finishers
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.STANDARD_FINISH.icon,
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
			icon: ACTIONS.EMBOITE.icon,
			content: <Trans id="dnc.dirty-dancing.suggestions.footloose.content">
				Performing the wrong steps makes your dance take longer and leads to a loss of DPS uptime. Make sure to perform your dances correctly.
			</Trans>,
			tiers: DEFAULT_SEVERITY_TIERS,
			value: this.footlooseDances,
			why: <Trans id="dnc.dirty-dancing.suggestions.footloose.why">
				<Plural value={this.footlooseDances} one="# dance" other="# dances"/> finished with extra steps.
			</Trans>,
		}))

		this.checklist.add(new Rule({
			name: <Trans id="dnc.dirty-dancing.checklist.standard-finish-buff.name">Keep your <StatusLink {...STATUSES.STANDARD_FINISH} /> buff up</Trans>,
			description: <Trans id="dnc.dirty-dancing.checklist.standard-finish-buff.description">
				Your <StatusLink {...STATUSES.STANDARD_FINISH} /> buff contributes significantly to your overall damage, and the damage of your <StatusLink {...STATUSES.DANCE_PARTNER} /> as well. Make sure to keep it up at all times.
			</Trans>,
			target: 95,
			requirements: [
				new Requirement({
					name: <Fragment><StatusLink {...STATUSES.STANDARD_FINISH} /> uptime</Fragment>,
					percent: () => this.getStandardFinishUptimePercent(),
				}),
			],
		}))

		const driftedStandards = Math.floor(this.totalDrift[ACTIONS.STANDARD_STEP.id]/STEP_COOLDOWN_MILLIS[ACTIONS.STANDARD_STEP.id])
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.STANDARD_STEP.icon,
			content: <Trans id="dnc.dirty-dancing.suggestions.standard-drift.content">You may have lost a use of <ActionLink {...ACTIONS.STANDARD_STEP} /> by letting the cooldown drift. Try to keep it on cooldown, even if it means letting your GCD sit for a second.
			</Trans>,
			tiers: DRIFT_SEVERITY_TIERS,
			value: driftedStandards,
			why: <Trans id="dnc.dirty-dancing.suggestions.standard-drift.why">
				<Plural value={driftedStandards} one="# Stanard Step was" other="# Standard Steps were"/> lost due to drift.
			</Trans>,
		}))

		const driftedTechnicals = Math.floor(this.totalDrift[ACTIONS.TECHNICAL_STEP.id]/STEP_COOLDOWN_MILLIS[ACTIONS.TECHNICAL_STEP.id])
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.TECHNICAL_STEP.icon,
			content: <Trans id="dnc.dirty-dancing.suggestions.technical-drift.content">You may have lost a use of <ActionLink {...ACTIONS.TECHNICAL_STEP} /> by letting the cooldown drift. Try to keep it on cooldown, even if it means letting your GCD sit for a second.
			</Trans>,
			tiers: DRIFT_SEVERITY_TIERS,
			value: driftedTechnicals,
			why: <Trans id="dnc.dirty-dancing.suggestions.technical-drift.why">
				<Plural value={driftedTechnicals} one="# Technical Step was" other="# Technical Steps were"/> lost due to drift.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.STANDARD_STEP.icon,
			content: <Trans id="dnc.dirty-dancing.suggestions.zero-standard.content">
				Using <ActionLink {...ACTIONS.STANDARD_FINISH} /> without completing any steps provides no damage buff to you and your <StatusLink {...STATUSES.DANCE_PARTNER} />, which is a core part of the job. Make sure to perform your dances correctly.
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
				icon: ACTIONS.TECHNICAL_STEP.icon,
				content: <Trans id="dnc.dirty-dancing.suggestions.zero-technical.content">
					Using <ActionLink {...ACTIONS.TECHNICAL_FINISH} /> without completing any steps provides no damage buff to you and your party, which is a core part of the job. Make sure to perform your dances correctly.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="dnc.dirty-dancing.suggestions.zero-technical.why">
					<Plural value={zeroTechnicals} one="# Technical Step was" other="# Technical Steps were"/> completed with no dance steps.
				</Trans>,
			}))
		}
	}

	output() {
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
							start: dance.start - this.parser.fight.start_time,
							end: dance.end != null ?
								dance.end - this.parser.fight.start_time :
								dance.start - this.parser.fight.start_time,
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
