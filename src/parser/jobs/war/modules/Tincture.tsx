import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {EvaluatedAction, ExpectedActionsEvaluator, TrackedAction} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import {Tincture as CoreTincture} from 'parser/core/modules/Tincture'
import React from 'react'

// A tincture window within the first 15s is an opener
const OPENER_BUFFER = 15000

export class Tincture extends CoreTincture {

	private adjustExpectedActionCount = (window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) => {
		if (window.start - OPENER_BUFFER <= this.parser.pull.timestamp) {
			if (action.action === this.data.actions.ONSLAUGHT) {
				// The opener expects you to use all of your Onslaught stacks
				return 2
			}
		}
		return 0
	}

	override initialise() {
		super.initialise()

		const suggestionIcon = this.data.actions.INFUSION_STR.icon
		const suggestionWindowName = <ActionLink action="INFUSION_STR" showIcon={false}/>
		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{
					action: this.data.actions.PRIMAL_REND,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.INNER_CHAOS,
					expectedPerWindow: 2,
				},
				{
					action: this.data.actions.FELL_CLEAVE,
					expectedPerWindow: 3,
				},
				{
					action: this.data.actions.UPHEAVAL,
					expectedPerWindow: 1,
				},
				// If we're concerned with optimal damage, may expect -3 onslaughts here instead.
				{
					action: this.data.actions.ONSLAUGHT,
					expectedPerWindow: 1,
				},
			],
			suggestionIcon,
			suggestionContent: <Trans id="war.tincture.suggestions.trackedactions.content">
				Try to cover as much damage as possible with your Tinctures of Strength.
			</Trans>,
			suggestionWindowName,
			severityTiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
			adjustCount: this.adjustExpectedActionCount.bind(this),
		}))
	}
}
