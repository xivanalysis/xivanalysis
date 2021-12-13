import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {ExpectedActionsEvaluator, ExpectedGcdCountEvaluator} from 'parser/core/modules/ActionWindow'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import {Tincture as CoreTincture} from 'parser/core/modules/Tincture'
import React from 'react'

export class Tincture extends CoreTincture {

	@dependency private globalCooldown!: GlobalCooldown

	override initialise() {
		super.initialise()

		const suggestionIcon = this.data.actions.INFUSION_STR.icon
		const suggestionWindowName = <ActionLink action="INFUSION_STR" showIcon={false}/>
		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: 13,
			globalCooldown: this.globalCooldown,
			suggestionIcon,
			suggestionContent: <Trans id="pld.tincture.suggestions.missedgcd.content">
				Try to land 13 GCDs during every <ActionLink {...this.data.actions.INFUSION_STR}/> window.
			</Trans>,
			suggestionWindowName,
			severityTiers: {
				2: SEVERITY.MINOR,
				4: SEVERITY.MEDIUM,
				6: SEVERITY.MAJOR,
			},
		}))

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{
					action: this.data.actions.SPIRITS_WITHIN,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.CIRCLE_OF_SCORN,
					expectedPerWindow: 1,
				},
			],
			suggestionIcon,
			suggestionContent: <Trans id="pld.tincture.suggestions.trackedactions.content">
				One use of <ActionLink {...this.data.actions.SPIRITS_WITHIN}/> and at least one use of <ActionLink {...this.data.actions.CIRCLE_OF_SCORN}/> should occur during every <ActionLink {...this.data.actions.INFUSION_STR}/> window.
			</Trans>,
			suggestionWindowName,
			severityTiers: {
				2: SEVERITY.MINOR,
				4: SEVERITY.MEDIUM,
				6: SEVERITY.MAJOR,
			},
		}))
	}
}
