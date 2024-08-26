import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {StatusLink} from 'components/ui/DbLink'
import {StatusKey} from 'data/STATUSES'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {ActionWindow, EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Actors} from 'parser/core/modules/Actors'
import CheckList, {Requirement, Rule} from 'parser/core/modules/Checklist'
import Downtime from 'parser/core/modules/Downtime'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {Statuses} from 'parser/core/modules/Statuses'
import React from 'react'
import {Message} from 'semantic-ui-react'
import {isSuccessfulHit} from 'utilities'
import {DANCE_MOVES, FINISHES, STEPS} from '../CommonData'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
import {CleanDanceEvaluator} from './evaluators/CleanDanceEvaluator'
import {FootlooseEvaluator} from './evaluators/FootlooseEvaluator'
import {HitTargetEvaluator} from './evaluators/HitTargetEvaluator'
import {ZeroStepStandardEvaluator} from './evaluators/ZeroStepStandardEvaluator'
import {ZeroStepTechnicalEvaluator} from './evaluators/ZeroStepTechnicalEvaluator'

const DEBUG_SHOW_ALL = false && process.env.NODE_ENV !== 'production'

const DANCE_COMPLETION_LENIENCY_MILLIS = 1000
const STANDARD_DANCE_MOVES = 2
const TECHNICAL_DANCE_MOVES = 4

export class DirtyDancing extends ActionWindow {
	static override handle = 'dirtydancing'
	static override title = t('dnc.dirty-dancing.title')`Dance Issues`
	static override displayOrder = DISPLAY_ORDER.DIRTY_DANCING

	@dependency private actors!: Actors
	@dependency private checklist!: CheckList
	@dependency private downtime!: Downtime
	@dependency private invulnerability!: Invulnerability
	@dependency private statuses!: Statuses

	private missedDanceWindowStarts: number[] = []
	private errorIndex: number[] = []

	private danceMoveIds = DANCE_MOVES.map(key => this.data.actions[key].id)
	private finishIds = FINISHES.map(key => this.data.actions[key].id)
	private stepIds = STEPS.map(key => this.data.actions[key].id)

	override prependMessages = <Message>
		<Trans id="dnc.dirty-dancing.rotation-table.message">
			One of Dancer's primary responsibilities is buffing the party's damage via dances.<br />
			Each dance also contributes to the Dancer's own damage and should be performed correctly.
		</Trans>
	</Message>

	override initialise() {
		this.trackOnlyActions([...this.danceMoveIds, ...this.finishIds, ...this.stepIds])

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(STEPS)), this.beginDance)
		this.addEventHook(playerFilter.type('damage').cause(this.data.matchCauseAction(FINISHES)), this.resolveDance)

		this.addEvaluator(new HitTargetEvaluator({
			missedDanceWindowStarts: this.missedDanceWindowStarts,
			suggestionIcon: this.data.actions.TECHNICAL_FINISH.icon,
			finishIds: this.finishIds,
			errorIndex: this.errorIndex,
		}))

		this.addEvaluator(new CleanDanceEvaluator({
			danceExpectations: {
				[this.data.actions.STANDARD_STEP.id]: {
					expectedFinisherId: this.data.actions.DOUBLE_STANDARD_FINISH.id,
					expectedDuration: this.data.actions.STANDARD_STEP.gcdRecast + this.data.actions.JETE.cooldown * STANDARD_DANCE_MOVES + DANCE_COMPLETION_LENIENCY_MILLIS,
				},
				[this.data.actions.TECHNICAL_STEP.id]: {
					expectedFinisherId: this.data.actions.QUADRUPLE_TECHNICAL_FINISH.id,
					expectedDuration: this.data.actions.TECHNICAL_STEP.gcdRecast + this.data.actions.JETE.cooldown * TECHNICAL_DANCE_MOVES + DANCE_COMPLETION_LENIENCY_MILLIS,
				},
			},
			invulnerability: this.invulnerability,
			pullEnd: this.parser.pull.timestamp + this.parser.pull.duration,
			suggestionIcon: this.data.actions.STANDARD_FINISH.icon,
			finishIds: this.finishIds,
			errorIndex: this.errorIndex,
		}))

		this.addEvaluator(new FootlooseEvaluator({
			expectedDanceMoves: {
				[this.data.actions.STANDARD_STEP.id]: STANDARD_DANCE_MOVES,
				[this.data.actions.TECHNICAL_STEP.id]: TECHNICAL_DANCE_MOVES,
			},
			suggestionIcon: this.data.actions.EMBOITE.icon,
			errorIndex: this.errorIndex,
		}))

		this.addEvaluator(new ZeroStepStandardEvaluator({
			standardFinishId: this.data.actions.STANDARD_FINISH.id,
			suggestionIcon: this.data.actions.STANDARD_FINISH.icon,
		}))

		this.addEvaluator(new ZeroStepTechnicalEvaluator({
			technicalFinishId: this.data.actions.TECHNICAL_FINISH.id,
			suggestionIcon: this.data.actions.TECHNICAL_FINISH.icon,
		}))

		this.setHistoryOutputFilter(this.filterHistoryOutput.bind(this))

		this.addEventHook({
			type: 'death',
			actor: this.parser.actor.id,
		}, () => this.onWindowEnd(this.parser.currentEpochTimestamp))
		this.addEventHook('complete', this.onComplete)
	}

	private filterHistoryOutput(window: HistoryEntry<EvaluatedAction[]>) {
		return DEBUG_SHOW_ALL || this.errorIndex.includes(window.start)
	}

	private beginDance(event: Events['action']) {
		// Forcibly close any open windows in case the previous was finished during downtime and didn't have a damage event
		this.onWindowEnd(event.timestamp)
		// Then start the new window
		this.onWindowStart(event.timestamp)
	}

	private resolveDance(event: Events['damage']) {
		// Tech Finish's buff range extension from 6.4 sometimes produces unsequenced 'damage' events 'targeting' the source player that 'miss'.
		// If they come before the actual damage event, it'll mess things up so just ignore them
		if (!event.sequence) { return }

		const currentWindow = this.history.getCurrent()
		if (!currentWindow) { return }

		// If the finisher didn't hit anything, and something could've been, ding it.
		// Don't gripe if the boss is invuln, there is use-case for finishing during the downtime
		if (
			!isSuccessfulHit(event)
			&& !this.invulnerability.isActive({
				timestamp: event.timestamp,
				types: ['invulnerable'],
			})
		) {
			const windowStart = this.history.getCurrent()?.start
			if (windowStart) {
				this.missedDanceWindowStarts.push(windowStart)
			}
		}

		this.onWindowEnd(event.timestamp)
	}

	private getStatusUptimePercent(statusKey: StatusKey): number {
		// Exclude downtime from both the status time and expected uptime
		const statusTime = Math.max(this.statuses.getUptime(statusKey, this.actors.friends) - this.downtime.getDowntime(), 0)
		const uptime = Math.max(this.parser.currentDuration - this.downtime.getDowntime(), 0)

		return Math.min((statusTime / uptime) * 100, 100)
	}

	override onComplete() {
		super.onComplete()

		const standardFinishUptimePct = this.getStatusUptimePercent('STANDARD_FINISH')
		this.checklist.add(new Rule({
			name: <Trans id="dnc.dirty-dancing.checklist.standard-finish-buff.name">Keep your <StatusLink {...this.data.statuses.STANDARD_FINISH} /> buff up</Trans>,
			description: <Trans id="dnc.dirty-dancing.checklist.standard-finish-buff.description">
				Your <StatusLink {...this.data.statuses.STANDARD_FINISH} /> buff contributes significantly to your overall damage, and the damage of your <StatusLink {...this.data.statuses.DANCE_PARTNER} /> as well. Make sure to keep it up at all times.
			</Trans>,
			target: 95,
			requirements: [
				new Requirement({
					name: <Trans id="dnc.dirty-dancing.checklist.standard-finish-buff.uptime"><StatusLink {...this.data.statuses.STANDARD_FINISH} /> uptime</Trans>,
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
					name: <Trans id="dnc.dirty-dancing.checklist.closed-position-buff.uptime"><StatusLink {...this.data.statuses.CLOSED_POSITION} /> uptime (excluding downtime)</Trans>,
					percent: closedPositionUptimePct,
				}),
			],
		}))
	}
}
