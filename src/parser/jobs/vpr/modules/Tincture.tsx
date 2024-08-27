import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {EvaluatedAction, ExpectedActionsEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import {Tincture as CoreTincture} from 'parser/core/modules/Tincture'
import React from 'react'

const SEVERITY_TIERS = {
	1: SEVERITY.MEDIUM,
	2: SEVERITY.MAJOR,
}

const OPENER_BUFFER = 30000 //After 30 seconds, you have reached the point that you could do 2 reawakens if you burst right there.

// Remove support actions from the table to avoid clutter
const IGNORED_ACTIONS: ActionKey[] = [
	'ARMS_LENGTH',
	'BLOODBATH',
	'FEINT',
	'SECOND_WIND',
]

export class Tincture extends CoreTincture {

	private adjustExpectedActionCount = (window: HistoryEntry<EvaluatedAction[]>) => {
		if (window.start - OPENER_BUFFER <= this.parser.pull.timestamp) {
			return -1
		}
		return 0
	}

	override initialise() {
		super.initialise()

		this.ignoreActions(IGNORED_ACTIONS.map(key => this.data.actions[key].id))

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{
					action: this.data.actions.REAWAKEN,
					expectedPerWindow: 2,
				},
				{
					action: this.data.actions.OUROBOROS,
					expectedPerWindow: 2,
				},
			],
			suggestionIcon: this.data.actions.INFUSION_DEX.icon,
			suggestionContent: <Trans id="vpr.tincture.suggestions.trackedActions.content">
				Try to fit two full uses of <DataLink action="REAWAKEN"/> while under the effects of a Tincture.
			</Trans>,
			suggestionWindowName: <DataLink item="INFUSION_DEX" showIcon={false}/>,
			severityTiers: SEVERITY_TIERS,
			adjustCount: this.adjustExpectedActionCount,
		}))
	}
}
