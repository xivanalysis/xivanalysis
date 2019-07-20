import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import _ from 'lodash'
import React, {Fragment} from 'react'
import {Accordion, Icon, Message} from 'semantic-ui-react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import {RotationTable} from 'components/ui/RotationTable'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {CastEvent, DamageEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import CheckList, {Requirement, Rule} from 'parser/core/modules/Checklist'
import Combatants from 'parser/core/modules/Combatants'
import Invulnerability from 'parser/core/modules/Invulnerability'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import Timeline from 'parser/core/modules/Timeline'

const ISSUE_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	3: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
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

const STANDARD_FINISHES = [
	ACTIONS.STANDARD_FINISH.id,
	ACTIONS.SINGLE_STANDARD_FINISH.id,
	ACTIONS.DOUBLE_STANDARD_FINISH.id,
]

const TECHNICAL_FINISHES = [
	ACTIONS.TECHNICAL_FINISH.id,
	ACTIONS.SINGLE_TECHNICAL_FINISH.id,
	ACTIONS.DOUBLE_TECHNICAL_FINISH.id,
	ACTIONS.TRIPLE_TECHNICAL_FINISH.id,
	ACTIONS.QUADRUPLE_TECHNICAL_FINISH.id,
]

const FINISHES = [
	...STANDARD_FINISHES,
	...TECHNICAL_FINISHES,
]

const EXPECTED_DANCE_MOVE_COUNT = {
	[ACTIONS.DOUBLE_STANDARD_FINISH.id]: 2,
	[ACTIONS.QUADRUPLE_TECHNICAL_FINISH.id]: 4,
}

class Dance {
	start: number
	end?: number
	rotation: CastEvent[] = []
	dancing: boolean = false
	resolved: boolean = false

	dirty: boolean = false
	missed: boolean = false
	extraMoves: boolean = false

	public get error(): boolean {
		return this.dirty || this.missed || this.extraMoves
	}

	public get expectedFinishId(): number {
		const actualFinish = _.last(this.rotation)
		let expectedFinish = -1
		if (actualFinish) {
			if (TECHNICAL_FINISHES.includes(actualFinish.ability.guid)) {
				expectedFinish =  ACTIONS.QUADRUPLE_TECHNICAL_FINISH.id
			} else if (STANDARD_FINISHES.includes(actualFinish.ability.guid)) {
				expectedFinish = ACTIONS.DOUBLE_STANDARD_FINISH.id
			}
		}
		return expectedFinish
	}

	constructor(start: number) {
		this.start = start
		this.dancing = true
	}
}

export default class DirtyDancing extends Module {
	static handle = 'dirtydancing'
	static title = t('dnc.dirty-dancing.title')`Dance Issues`
	// static displayOrder = DISPLAY_ORDER.ROTATION

	@dependency private checklist!: CheckList
	@dependency private suggestions!: Suggestions
	@dependency private invuln!: Invulnerability
	@dependency private combatants!: Combatants
	@dependency private timeline!: Timeline

	private danceHistory: Dance[] = []
	private missedDances = 0
	private dirtyDances = 0
	private extraMoves = 0

	protected init() {
		this.addHook('cast', {by: 'player', abilityId: STEPS}, this.beginDance)
		this.addHook('cast', {by: 'player'}, this.continueDance)
		this.addHook('cast', {by: 'player', abilityId: FINISHES}, this.finishDance)
		this.addHook('damage', {by: 'player', abilityId: FINISHES}, this.resolveDance)
		this.addHook('complete', this.onComplete)
	}

	private addDanceToHistory(event: CastEvent): Dance {
		const newDance = new Dance(event.timestamp)
		newDance.rotation.push(event)
		this.danceHistory.push(newDance)

		return newDance
	}

	private beginDance(event: CastEvent) {
		this.addDanceToHistory(event)
	}

	private get lastDance(): Dance | undefined {
		return _.last(this.danceHistory)
	}

	private continueDance(event: CastEvent) {
		if (!STEPS.includes(event.ability.guid) && !FINISHES.includes(event.ability.guid)) {
			const dance = this.lastDance
			if (dance && dance.dancing) {
				dance.rotation.push(event)
			}
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

	private resolveDance(event: DamageEvent) {
		const dance = this.lastDance
		if (dance && !dance.resolved) {

			const finisher = dance.rotation[dance.rotation.length-1]
			dance.end = finisher.timestamp

			// Count dance as dirty if we didn't get the expected finisher
			if (finisher.ability.guid !== dance.expectedFinishId) {
				dance.dirty = true
			}
			// If the finisher didn't hit anything, and something could've been, ding it.
			// Don't gripe if the boss is invuln, there is use-case for finishing during the downtime
			if (event.amount === 0 && !this.invuln.isInvulnerable('all', finisher.timestamp)) {
				dance.missed = true
			}
			// Dancer messed up if more step actions were recorded than we expected
			const actualCount = dance.rotation.filter(step => DANCE_MOVES.includes(step.ability.guid)).length
			let expectedCount = 0
			expectedCount = EXPECTED_DANCE_MOVE_COUNT[dance.expectedFinishId]
			// Only ding if the step count is greater than expected, we're not going to catch the steps in the opener dance
			if (actualCount > expectedCount) {
				dance.extraMoves = true
			}

			dance.resolved = true
		}
	}

	private getStandardFinishUptimePercent() {
		const statusTime = this.combatants.getStatusUptime(STATUSES.STANDARD_FINISH.id, this.parser.player.id)
		const uptime = this.parser.fightDuration - this.invuln.getInvulnerableUptime()

		return (statusTime / uptime) * 100
	}

	private onComplete() {
		this.missedDances = this.danceHistory.filter(dance => dance.missed).length
		this.dirtyDances = this.danceHistory.filter(dance => dance.dirty).length
		this.extraMoves = this.danceHistory.filter(dance => dance.extraMoves).length

		// Suggest to move closer for finishers.
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.TECHNICAL_FINISH.icon,
			content: <Trans id="dnc.dirty-dancing.suggestions.missed-finishers.content">
				<ActionLink {...ACTIONS.TECHNICAL_FINISH} /> and <ActionLink {...ACTIONS.STANDARD_FINISH} /> are a significant source of damage. Make sure you're in range when finishing a dance.
			</Trans>,
			tiers: ISSUE_SEVERITY_TIERS,
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
			tiers: ISSUE_SEVERITY_TIERS,
			value: this.dirtyDances,
			why: <Trans id="dnc.dirty-dancing.suggestions.dirty-dances.why">
				<Plural value={this.dirtyDances} one="# dance" other="# dances"/> finished with missing steps.
			</Trans>,
		}))

		// Suggestion to not faff about with steps
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.EMBOITE.icon,
			content: <Trans id="dnc.dirty-dancing.suggestions.extra-moves.content">
				Performing the wrong steps makes your dance take longer and leads to a loss of DPS uptime. Make sure to perform your dances correctly.
			</Trans>,
			tiers: ISSUE_SEVERITY_TIERS,
			value: this.extraMoves,
			why: <Trans id="dnc.dirty-dancing.suggestions.extra-moves.why">
				<Plural value={this.extraMoves} one="# dance" other="# dances"/> finished with extra steps.
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
	}

	output() {
		if (this.danceHistory.some(dance => dance.error)) {
			return <Fragment>
				<Message>
					<Trans id="dnc.dirty-dancing.rotationtable.message">
						One of Dancer's primary responsibilities is buffing the party's damage via dances.<br />
						Each dance also contributes to the Dancer's own damage and should be performed correctly.
					</Trans>
				</Message>
				<RotationTable
					notes={[
						{
							header: <Trans id="dnc.dirty-dancing.table.header.missed">Hit Target</Trans>,
							accessor: 'missed',
						},
						{
							header: <Trans id="dnc.dirty-dancing.table.header.dirty">Correct Finish</Trans>,
							accessor: 'dirty',
						},
						{
							header: <Trans id="dnc.dirty-dancing.table.header.extraMoves">Correct Moves</Trans>,
							accessor: 'extraMoves',
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
								extraMoves: <>{this.getNotesIcon(dance.extraMoves)}</>,
							},
							rotation: dance.rotation,
						})
					})}
					onGoto={this.timeline.show}
				/>
			</Fragment>
		}
	}

	private getNotesIcon(ruleFailed: boolean): any {
		return <Icon
			name={ruleFailed ? 'remove' : 'checkmark'}
			className={ruleFailed ? 'text-error' : 'text-success'}
		/>
	}
}
