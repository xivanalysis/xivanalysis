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
					action: this.data.actions.SONIC_BREAK,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.GNASHING_FANG,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.DOUBLE_DOWN,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.LION_HEART,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.BOW_SHOCK,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.BLASTING_ZONE,
					expectedPerWindow: 1,
				},
			],
			suggestionIcon: this.data.actions.INFUSION_STR.icon,
			suggestionContent: <Trans id="gnb.tincture.suggestions.trackedActions.content">
				Try to cover as much damage as possible with your Tinctures of Strength.
			</Trans>,
			suggestionWindowName: <DataLink item="INFUSION_STR" showIcon={false}/>,
			severityTiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
		}))
	}
}
