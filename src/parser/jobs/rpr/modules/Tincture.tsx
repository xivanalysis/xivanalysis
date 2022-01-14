import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {EvaluatedAction, ExpectedActionsEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import {Tincture as CoreTincture} from 'parser/core/modules/Tincture'
import React from 'react'
import {OPENER_BUFFER} from '../Constants'

const COMMUNIO_SEVERITY = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
}

// Remove support actions from the table to avoid clutter
const IGNORED_ACTIONS: ActionKey[] = [
	'ARCANE_CREST',
	'ARMS_LENGTH',
	'BLOODBATH',
	'FEINT',
	'HELLS_EGRESS',
	'HELLS_INGRESS',
	'REGRESS',
	'SECOND_WIND',
]

export class Tincture extends CoreTincture {

	private adjustExpectedActionCount = (window: HistoryEntry<EvaluatedAction[]>) => {
		if (window.start - OPENER_BUFFER <= this.parser.pull.timestamp) {
			// We can only do one Communio in the opener
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
					action: this.data.actions.COMMUNIO,
					expectedPerWindow: 2,
				},
			],
			suggestionIcon: this.data.actions.INFUSION_STR.icon,
			suggestionContent: <Trans id="rpr.tincture.suggestions.trackedActions.content">
				Try to fit two uses of <DataLink action="COMMUNIO"/> while under the effects of a Tincture.
			</Trans>,
			suggestionWindowName: <DataLink action="INFUSION_STR" showIcon={false}/>,
			severityTiers: COMMUNIO_SEVERITY,
			adjustCount: this.adjustExpectedActionCount,
		}))
	}
}
