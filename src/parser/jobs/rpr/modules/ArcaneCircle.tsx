import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {filter, noneOf} from 'parser/core/filter'
import {BuffWindow, EvaluatedAction, ExpectedActionsEvaluator, TrackedAction} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import {OPENER_BUFFER} from '../Constants'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

export class ArcaneCircle extends BuffWindow {
	static override handle = 'arcaneCircle'
	static override title = t('rpr.arcanecircle.title')`Arcane Circle`
	static override displayOrder = DISPLAY_ORDER.ARCANE_CIRCLE

	override buffStatus = this.data.statuses.ARCANE_CIRCLE

	override initialise() {
		super.initialise()

		// Multiple reapers can override each other's buffs
		const dupeFilter = filter<Event>().source(noneOf([this.parser.actor.id]))
			.target(this.parser.actor.id)
			.status(this.buffStatus.id)

		this.addEventHook(dupeFilter.type('statusApply'), this.maybeReOpenPreviousWindow)

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{action: this.data.actions.COMMUNIO, expectedPerWindow: 2},
				{action: this.data.actions.PLENTIFUL_HARVEST, expectedPerWindow: 1},
			],
			suggestionIcon: this.data.actions.ARCANE_CIRCLE.icon,
			suggestionContent: <Trans id="rpr.arcanecircle.suggestions.content">
				Each <ActionLink action="ARCANE_CIRCLE"/> window should contain 2 uses of <ActionLink action="COMMUNIO"/> and a use
				of <ActionLink action="PLENTIFUL_HARVEST"/>.
			</Trans>,
			suggestionWindowName: <ActionLink action="ARCANE_CIRCLE" showIcon={false} />,
			severityTiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
			adjustCount: this.adjustCount.bind(this),
		}))
	}

	private maybeReOpenPreviousWindow(event: Events['statusApply']) {
		// See if another reaper overrode your Arcane Circle
		if (this.history.endOfLastEntry() === event.timestamp) {
			super.reOpenPreviousWindow(this.buffStatus.duration)
		}
	}

	private adjustCount(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction): number {
		if (action.action !== this.data.actions.COMMUNIO) { return 0 }

		return (window.start - OPENER_BUFFER <= this.parser.pull.timestamp) ? -1 : 0
	}

}
