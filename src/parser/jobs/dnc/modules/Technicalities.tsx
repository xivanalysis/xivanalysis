import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import _ from 'lodash'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {calculateExpectedGcdsForTime, EvaluatedAction, ExpectedGcdCountEvaluator, RaidBuffWindow} from 'parser/core/modules/ActionWindow'
import {RulePassedEvaluator} from 'parser/core/modules/ActionWindow/evaluators/RulePassedEvaluator'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {Message} from 'semantic-ui-react'
import {DANCE_MOVES, TECHNICAL_FINISHES} from '../CommonData'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
import {Gauge} from './Gauge'

// Harsher than the default since you'll only have 4-5 total windows anyways
export const TECHNICAL_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}

const FEATHER_THRESHHOLD = 3
const POST_WINDOW_GRACE_PERIOD_MILLIS = 500
const TECHNICAL_EXPECTED_GCDS = 9

export class Technicalities extends RaidBuffWindow {
	static override handle = 'technicalities'
	static override title = t('dnc.technicalities.title')`Technical Windows`
	static override displayOrder = DISPLAY_ORDER.TECHNICALITIES

	@dependency private gauge!: Gauge
	@dependency private globalCooldown!: GlobalCooldown

	override buffStatus = this.data.statuses.TECHNICAL_FINISH

	private technicalFinishIds = TECHNICAL_FINISHES.map(key => this.data.actions[key].id)
	private danceMoveIds = DANCE_MOVES.map(key => this.data.actions[key].id)
	private featherConsumerIds = Array<ActionKey>('FAN_DANCE', 'FAN_DANCE_II').map(key=> this.data.actions[key].id)

	private buffActive = false
	private badDevilments: number = 0

	private _mappedWindows: Array<HistoryEntry<EvaluatedAction[]>> | undefined = undefined
	public get mappedWindows() : Array<HistoryEntry<EvaluatedAction[]>> {
		if (this._mappedWindows == null) { this._mappedWindows = this.mapHistoryActions() }
		return this._mappedWindows
	}

	private timelyDevilmentEvaluator!: RulePassedEvaluator
	private pooledFeathersEvaluator!: RulePassedEvaluator
	private lateStandardEvaluator!: RulePassedEvaluator

	// If the log has multiple dancers in it, add the prepend warning message
	override prependMessages = this.parser.pull.actors.filter(actor => actor.job === 'DANCER').length > 1 ? <Message>
		<Trans id="dnc.technicalities.rotation-table.message">
			This log contains <DataLink showIcon={false} action="TECHNICAL_STEP" /> windows that were started or extended by other Dancers.<br />
			Use your best judgement about which windows you should be dumping <DataLink showIcon={false} action="DEVILMENT" />, Feathers, and Esprit under.<br />
			Try to make sure they line up with other raid buffs to maximize damage.
		</Trans>
	</Message> : undefined

	override initialise() {
		super.initialise()

		// We don't want the dance moves or technical finish itself showing up in the rotation for analysis. Also skip auto-attacks because why even.
		this.ignoreActions([this.data.actions.ATTACK.id, ...this.danceMoveIds, ...this.technicalFinishIds])

		// 6.4 changed the status application time from the players own finish to not always happen at the same time as the executing action
		// Hook the player's finish actions as well
		this.addEventHook(
			filter<Event>().type('action').action(oneOf(this.technicalFinishIds))
				.source(this.parser.actor.id),
			this.tryOpenWindow)

		// Hook devilment uses so we can double-check if a Technical Finish window is active and warn against using Devilment outside of the windows.
		this.addEventHook(filter<Event>().type('action').action(this.data.actions.DEVILMENT.id)
			.source(this.parser.actor.id), this.onCastDevilment)

		// Hook technical finish status applications to help with the Devilment-outside-of-window checks.
		const technicalFilter = filter<Event>().status(this.buffStatus.id)
		this.addEventHook(technicalFilter.type('statusApply'), this.onApplyTechnicalFinish)
		this.addEventHook(technicalFilter.type('statusRemove').source(this.parser.actor.id), this.onRemoveTechnicalFinish)

		// We expect 9 GCDs in a Technical Finish window
		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: TECHNICAL_EXPECTED_GCDS,
			globalCooldown: this.globalCooldown,
			hasStacks: false,
			suggestionIcon: this.data.statuses.TECHNICAL_FINISH.icon,
			suggestionContent: <Trans id="dnc.technicalities.suggestions.missedgcd.content">
				Try to land 9 GCDs during every <DataLink status="TECHNICAL_FINISH" /> window. Don't wait until the end to use <DataLink action="TILLANA" /> or you may not be able to fit them all in.
			</Trans>,
			suggestionWindowName: <DataLink status="TECHNICAL_FINISH" showIcon={false}/>,
			severityTiers: TECHNICAL_SEVERITY_TIERS,
		}))

		// Evaluate whether Devilment was used at the appropriate time within each window
		this.timelyDevilmentEvaluator = new RulePassedEvaluator({
			header: {
				header: <Trans id="dnc.technicalities.rotation-table.header.missed"><DataLink showName={false} action="DEVILMENT" /> On Time?</Trans>,
				accessor: 'timely',
			},
			passesRule: this.determineTimely.bind(this),
			suggestion: this.timelyDevilmentSuggestion.bind(this),
		})
		this.addEvaluator(this.timelyDevilmentEvaluator)

		// Evaluate whether feathers were properly pooled for each window. This must be added in oncomplete so we can actually get at the mapped history data
		this.pooledFeathersEvaluator = new RulePassedEvaluator({
			header: {
				header: <Trans id="dnc.technicalities.rotation-table.header.pooled"><DataLink showName={false} action="FAN_DANCE" /> Pooled?</Trans>,
				accessor: 'pooled',
			},
			passesRule: this.determinePooled.bind(this),
			suggestion: this.pooledFeatherSuggestion.bind(this),
		})
		this.addEvaluator(this.pooledFeathersEvaluator)

		// Evaluate whether the player missed finishing Standard Steps initiated within a window
		this.lateStandardEvaluator = new RulePassedEvaluator({
			passesRule: this.determineLate.bind(this),
			suggestion: this.lateStandardSuggestion.bind(this),
		})
		this.addEvaluator(this.lateStandardEvaluator)
	}

	private determinePooled(window: HistoryEntry<EvaluatedAction[]>): boolean | undefined {
		const feathersUsed = window.data.filter(event => this.featherConsumerIds.includes(event.action.id)).length
		// Check to see if this window could've had more feathers due to possible pooling problems
		if (feathersUsed >= FEATHER_THRESHHOLD) {
			return true
		}

		// Grant leniency for Technical Finish windows that overlapped the end of the fight
		const fightEnd = (this.parser.pull.timestamp + this.parser.pull.duration)
		const windowEnd = (window.end || fightEnd)
		if (windowEnd === fightEnd && windowEnd - window.start < this.data.statuses.TECHNICAL_FINISH.id) {
			// Should be able to weave at least one feather after each GCD, but don't count the last one in case the fight ended right as it hit
			const potentialWeaves = calculateExpectedGcdsForTime(TECHNICAL_EXPECTED_GCDS, this.globalCooldown.getDuration(), window.start, windowEnd) - 1
			if (feathersUsed >= potentialWeaves) {
				return true
			}
		}
		const previousWindowEnd = _.max(this.mappedWindows.filter(w => (w.end || fightEnd) < window.start).map(w => w.end))
		if (previousWindowEnd == null) {
			return undefined
		}
		const feathersBeforeWindow = this.gauge.feathersSpentInRange(previousWindowEnd + POST_WINDOW_GRACE_PERIOD_MILLIS, window.start)

		return feathersBeforeWindow === 0
	}

	private pooledFeatherSuggestion(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const unpooledWindows = this.pooledFeathersEvaluator.failedRuleCount(windows)
		return new TieredSuggestion({
			icon: this.data.actions.FAN_DANCE.icon,
			content: <Trans id="dnc.technicalities.suggestions.unpooled.content">
				Pooling your Feathers before going into a <DataLink status="TECHNICAL_FINISH" /> window allows you to use more <DataLink action="FAN_DANCE" />s with the multiplicative bonuses active, increasing their effectiveness. Try to build and hold on to at least three feathers between windows.
			</Trans>,
			tiers: TECHNICAL_SEVERITY_TIERS,
			value: unpooledWindows,
			why: <Trans id="dnc.technicalities.suggestions.unpooled.why">
				<Plural value={unpooledWindows} one="# window was" other="# windows were"/> missing potential <DataLink action="FAN_DANCE" />s.
			</Trans>,
		})
	}

	private determineTimely(window: HistoryEntry<EvaluatedAction[]>): boolean | undefined {
		if (window.data.filter(entry => entry.action.id === this.data.actions.DEVILMENT.id).length === 0) {
			return
		}
		// If the window actually contains Devilment, determine if it was used on time
		if (window.data[0].action.id === this.data.actions.DEVILMENT.id) {
			return true
		}

		return false
	}

	private timelyDevilmentSuggestion(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const lateDevilments = this.timelyDevilmentEvaluator.failedRuleCount(windows)
		return new TieredSuggestion({
			icon: this.data.actions.DEVILMENT.icon,
			content: <Trans id="dnc.technicalities.suggestions.late-devilments.content">
				Using <DataLink action="DEVILMENT" /> as early as possible during your <DataLink status="TECHNICAL_FINISH" /> windows allows you to maximize the multiplicative bonuses that both statuses give you. It should be used immediately after <DataLink action="TECHNICAL_FINISH" />.
			</Trans>,
			tiers: TECHNICAL_SEVERITY_TIERS,
			value: lateDevilments,
			why: <Trans id="dnc.technicalities.suggestions.late-devilments.why">
				<Plural value={lateDevilments} one="# Devilment was" other="# Devilments were"/> used later than optimal.
			</Trans>,
		})
	}

	private determineLate(window: HistoryEntry<EvaluatedAction[]>): boolean | undefined {
		if (window.data[window.data.length-1].action.id === this.data.actions.STANDARD_STEP.id) {
			return false // False since they're failing the rule
		}

		return true
	}

	private lateStandardSuggestion(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const lateStandards = this.lateStandardEvaluator.failedRuleCount(windows)
		return new TieredSuggestion({
			icon: this.data.actions.STANDARD_STEP.icon,
			content: <Trans id="dnc.technicalities.suggestions.late-standards.content">
				Avoid using <DataLink action="STANDARD_STEP" /> at the end of a <DataLink status="TECHNICAL_FINISH" showIcon={false} /> window, when the finish will fall outside the buff. Use another GCD for buffed damage instead.
			</Trans>,
			tiers: TECHNICAL_SEVERITY_TIERS,
			value: lateStandards,
			why: <Trans id="dnc.technicalities.suggestions.late-standards.why">
				<Plural value={lateStandards} one="# Standard Finish" other="# Standard Finishes"/> missed the <DataLink status="TECHNICAL_FINISH" showIcon={false} /> buff.
			</Trans>,
		})
	}

	// Open new windows to deal with 6.4+ buff timing weirdness
	private tryOpenWindow(event: Events['action']) {
		this.startWindowAndTimeout(event.timestamp)
	}

	//#region Hook functions to deal with outside-of-window Devilment suggestions
	private onApplyTechnicalFinish(event: Events['statusApply']) {
		if (event.target === this.parser.actor.id) {
			this.buffActive = true
		}
	}

	private onRemoveTechnicalFinish() {
		this.buffActive = false
	}

	private onCastDevilment(_event: Events['action']) {
		if (this.history.getCurrent() == null && !this.buffActive) {
			this.badDevilments++
		}
	}
	//#endregion

	override onComplete() {
		super.onComplete()

		// Suggestion to use Devilment under Technical
		// This suggestion is looking at Devilment usage *outside* of the buffwindows, so it can't be in an evaluator.
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.DEVILMENT.icon,
			content: <Trans id="dnc.technicalities.suggestions.bad-devilments.content">
				Using <DataLink action="DEVILMENT" /> outside of your <DataLink status="TECHNICAL_FINISH" /> windows leads to an avoidable loss in DPS. Aside from certain opener situations, you should be using <DataLink action="DEVILMENT" /> at the beginning of your <DataLink status="TECHNICAL_FINISH" /> windows.
			</Trans>,
			tiers: TECHNICAL_SEVERITY_TIERS,
			value: this.badDevilments,
			why: <Trans id="dnc.technicalities.suggestions.bad-devilments.why">
				<Plural value={this.badDevilments} one="# Devilment" other="# Devilments"/> used outside <DataLink status="TECHNICAL_FINISH" />.
			</Trans>,
		}))
	}
}
