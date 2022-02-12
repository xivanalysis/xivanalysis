import {MessageDescriptor} from '@lingui/core'
import {t, Trans} from '@lingui/macro'
import {ActionLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Status} from 'data/STATUSES'
import {Events} from 'event'
import {SEVERITY, SeverityTiers} from 'parser/core/modules/Suggestions'
import React from 'react'
import {dependency} from '../Injectable'
import {BuffWindow, EvaluatedAction, ExpectedGcdCountEvaluator} from './ActionWindow'
import {HistoryEntry} from './ActionWindow/History'
import {GlobalCooldown} from './GlobalCooldown'

// Global default
const MISSED_SWIFTCAST_SEVERITIES: SeverityTiers = {
	1: SEVERITY.MAJOR,
}

export abstract class Swiftcast extends BuffWindow {
	static override handle: string = 'swiftcast'
	static override title: MessageDescriptor = t('core.swiftcast.title')`Swiftcast Actions`

	@dependency private globalCooldown!: GlobalCooldown

	override buffStatus: Status = this.data.statuses.SWIFTCAST

	override initialise() {
		super.initialise()

		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: 1,
			globalCooldown: this.globalCooldown,
			suggestionIcon: this.data.actions.SWIFTCAST.icon,
			suggestionContent: this.suggestionContent,
			suggestionWindowName: <ActionLink action="SWIFTCAST" showIcon={false} />,
			severityTiers: this.severityTiers,
			adjustCount: this.adjustExpectedGcdCount.bind(this),
		}))
	}

	/**
	 * Implementing modules MAY want to override this to change the column header, but at this point
	 * it's probably universal to call it a 'Spell'
	 */
	protected override rotationTableHeader: JSX.Element = <Trans id="core.swiftcast.table.title">Spell</Trans>
	/**
	 * Implementing modules MAY want to override the suggestionContent to provide job-specific guidance.
	 */
	protected suggestionContent: JSX.Element = <Trans id="core.swiftcast.missed.suggestion.content">Use spells with <ActionLink action="SWIFTCAST"/> before it expires. This allows you to use spells with cast times instantly for movement or weaving.</Trans>
	/**
	 * Implementing modules MAY want to override the severityTiers to provide job-specific severities.
	 * By default, 1 miss is a major severity
	 */
	protected severityTiers: SeverityTiers = MISSED_SWIFTCAST_SEVERITIES

	/**
	 * Implementing modules MAY override this if they have special cases not covered
	 * by the standard 'considerAction' method – for example, SMN with instant ruins during
	 * DWT.
	 * @param action - the action to consider
	 * @returns true to allow the spell; false to ignore the spell
	 */
	protected considerSwiftAction(_action: Action): boolean {
		return true
	}

	// Provide our own logic for the end of the fight – even though the window is
	// ~4 GCDs 'wide', we can only use one action with it anyway; this change should
	// ding them only if they had enough time during the window to use a spell with
	// swiftcast
	private adjustExpectedGcdCount(window: HistoryEntry<EvaluatedAction[]>) {
		const fightTimeRemaining = (this.parser.pull.timestamp + this.parser.pull.duration) - window.start
		const gcdEstimate = this.globalCooldown.getDuration()
		return (fightTimeRemaining > gcdEstimate) ? 0 : -1
	}

	override onWindowAction(event: Events['action']) {
		this.debug('Evaluating action during window:', event.action)
		// ignore actions that don't have a castTime
		const action = this.data.getAction(event.action)
		if (
			action == null
			|| (action.castTime ?? 0) === 0
			|| !this.considerSwiftAction(action)
		) {
			return
		}
		super.onWindowAction(event)
	}
}
