import {Trans} from '@lingui/react'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import {Tincture as CoreTincture} from 'parser/core/modules/Tincture'
import React from 'react'

export default class Tincture extends CoreTincture {
	buffAction = this.data.actions.INFUSION_STR

	trackedActions = {
		icon: this.data.actions.INFUSION_STR.icon,
		actions: [
			{
				action: this.data.actions.WICKED_TALON,
				expectedPerWindow: 1,
			},
			{
				action: this.data.actions.BLASTING_ZONE,
				expectedPerWindow: 1,
			},
		],
		suggestionContent: <Trans id="gnb.tincture.suggestions.trackedActions.content">
			Try to cover as much damage as possible with your Tinctures of Strength.
		</Trans>,
		severityTiers: {
			1: SEVERITY.MINOR,
			2: SEVERITY.MEDIUM,
			3: SEVERITY.MAJOR,
		},
	}
}
