import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {RaidBuffWindow, EvaluatedAction, ExpectedActionsEvaluator, TrackedAction} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import {OPENER_BUFFER} from '../constants'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

// The minimum AC length to hard require a Communio
const COMMUNIO_BUFFER = 8000

const SEVERITIES = {
	1: SEVERITY.MINOR,
	3: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}

export class ArcaneCircle extends RaidBuffWindow {
	static override handle = 'arcaneCircle'
	static override title = t('rpr.arcanecircle.title')`Arcane Circle`
	static override displayOrder = DISPLAY_ORDER.ARCANE_CIRCLE

	override buffStatus = this.data.statuses.ARCANE_CIRCLE

	// RPR should not evaluate Arcance Circle overwrites since it's also a gauge generator
	override evaluateOverwrites = false

	override initialise() {
		super.initialise()

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{
					action: this.data.actions.COMMUNIO,
					expectedPerWindow: 2,
				},
				{
					action: this.data.actions.PLENTIFUL_HARVEST,
					expectedPerWindow: 1,
				},
			],
			suggestionIcon: this.data.actions.ARCANE_CIRCLE.icon,
			suggestionContent: <Trans id="rpr.arcanecircle.suggestions.content">
				Each <ActionLink action="ARCANE_CIRCLE"/> window should contain 2 uses of <ActionLink action="COMMUNIO"/>
				and 1 use of <ActionLink action="PLENTIFUL_HARVEST"/>. In your opener, only 1 <ActionLink showIcon={false} action="COMMUNIO"/> is expected.
			</Trans>,
			suggestionWindowName: <ActionLink action="ARCANE_CIRCLE" showIcon={false} />,
			severityTiers: SEVERITIES,
			adjustCount: this.adjustCount.bind(this),
		}))
	}

	private adjustCount(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction): number {
		const fightTimeRemaining = (this.parser.pull.timestamp + this.parser.pull.duration) - window.start

		if (this.isRushedEndOfPullWindow(window)) {
			if (fightTimeRemaining < COMMUNIO_BUFFER) {
				switch (action.action) {
				case this.data.actions.COMMUNIO:
					// I hate this linter bypass, but -2 is technically magic and is weird as a const
					// eslint-disable-next-line @typescript-eslint/no-magic-numbers
					return -2

				case this.data.actions.PLENTIFUL_HARVEST:
					return -1

				default:
					return 0
				}
			}

			// We have enough time for 1 Communio, but not both
			if (action.action === this.data.actions.COMMUNIO) {
				return -1
			}
		}

		// If it's not Communio, we don't care at this point
		if (action.action !== this.data.actions.COMMUNIO) { return 0 }

		return (window.start - OPENER_BUFFER <= this.parser.pull.timestamp) ? -1 : 0
	}
}
