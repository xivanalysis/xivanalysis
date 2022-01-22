import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {ExpectedActionsEvaluator} from 'parser/core/modules/ActionWindow'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import {Tincture as CoreTincture} from 'parser/core/modules/Tincture'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

export class Tincture extends CoreTincture {
	static override displayOrder = DISPLAY_ORDER.TINCTURES

	override initialise() {
		super.initialise()

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{
					action: this.data.actions.ASSIZE,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.DIA,
					expectedPerWindow: 1,
				},
			],
			suggestionIcon: this.data.actions.INFUSION_MND.icon,
			suggestionContent: <Trans id="whm.tincture.suggestions.trackedActions.content">
				Try to cover as much damage as possible with your Tinctures of Mind.
			</Trans>,
			suggestionWindowName: <DataLink action="INFUSION_MND" showIcon={false}/>,
			severityTiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
		}))
	}
}
