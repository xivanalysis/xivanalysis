import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {ExpectedGcdCountEvaluator, RaidBuffWindow} from 'parser/core/modules/ActionWindow'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {Message} from 'semantic-ui-react'
import {DANCE_MOVES, TECHNICAL_FINISHES} from '../CommonData'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
import {LateStandardEvaluator} from './evaluators/LateStandardEvaluator'
import {PooledFeathersEvaluator} from './evaluators/PooledFeathersEvaluator'
import {TimelyDevilmentEvaluator} from './evaluators/TimelyDevilmentEvaluator'
import {Gauge} from './Gauge'

// Harsher than the default since you'll only have 4-5 total windows anyways
export const TECHNICAL_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}

export const TECHNICAL_EXPECTED_GCDS = 9

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
		this.addEvaluator(new TimelyDevilmentEvaluator(this.data.actions.DEVILMENT))

		// Evaluate whether the player missed finishing Standard Steps initiated within a window
		this.addEvaluator(new LateStandardEvaluator(this.data.actions.STANDARD_STEP))
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
		// Evaluate whether feathers were properly pooled for each window. This must be added in oncomplete so we can actually get at the mapped history data
		this.addEvaluator(new PooledFeathersEvaluator({
			pullTime: this.parser.pull.timestamp,
			pullDuration: this.parser.pull.duration,
			technicalDuration: this.data.statuses.TECHNICAL_FINISH.duration,
			featherConsumerIds: this.featherConsumerIds,
			gauge: this.gauge,
			globalCooldown: this.globalCooldown.getDuration(),
			suggestionIcon: this.data.actions.FAN_DANCE.icon,
			windows: this.mapHistoryActions(),
		}))

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
