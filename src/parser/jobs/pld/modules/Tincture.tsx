import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import {Tincture as CoreTincture} from 'parser/core/modules/Tincture'
import React from 'react'

export default class Tincture extends CoreTincture {
	buffAction = this.data.actions.INFUSION_STR

	expectedGCDs = {
		expectedPerWindow: 13,
		suggestionContent: <Trans id="pld.tincture.suggestions.missedgcd.content">
			Try to land 13 GCDs during every <ActionLink {...this.data.actions.INFUSION_STR}/> window.
		</Trans>,
		severityTiers: {
			2: SEVERITY.MINOR,
			4: SEVERITY.MEDIUM,
			6: SEVERITY.MAJOR,
		},
	}

	trackedActions = {
		icon: this.data.actions.INFUSION_STR.icon,
		actions: [
			{
				action: this.data.actions.SPIRITS_WITHIN,
				expectedPerWindow: 1,
			},
			{
				action: this.data.actions.CIRCLE_OF_SCORN,
				expectedPerWindow: 1,
			},
		],
		suggestionContent: <Trans id="pld.tincture.suggestions.trackedactions.content">
			One use of <ActionLink {...this.data.actions.SPIRITS_WITHIN}/> and at least one use of <ActionLink {...this.data.actions.CIRCLE_OF_SCORN}/> should occur during every <ActionLink {...this.data.actions.INFUSION_STR}/> window.
		</Trans>,
		severityTiers: {
			2: SEVERITY.MINOR,
			4: SEVERITY.MEDIUM,
			6: SEVERITY.MAJOR,
		},
	}
}
