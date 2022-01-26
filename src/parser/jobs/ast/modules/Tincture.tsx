import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {ExpectedActionsEvaluator} from 'parser/core/modules/ActionWindow'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import {Tincture as CoreTincture} from 'parser/core/modules/Tincture'
import React from 'react'

export class Tincture extends CoreTincture {

	override initialise() {
		super.initialise()

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{
					action: this.data.actions.COMBUST_III,
					expectedPerWindow: 1,
				},
			],
			suggestionIcon: this.data.actions.INFUSION_MND.icon,
			suggestionContent: <Trans id="ast.tincture.suggestions.trackedActions.content">
				Try to cover as much damage as possible with your Tinctures of Mind.
			</Trans>,
			suggestionWindowName: <DataLink action="INFUSION_MND" showIcon={false} />,
			severityTiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
		}))
	}
}
