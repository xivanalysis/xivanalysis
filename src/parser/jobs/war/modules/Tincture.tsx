import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
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

		const suggestionIcon = this.data.actions.G2_GEMDRAUGHT_STR.icon
		const suggestionWindowName = <DataLink status="MEDICATED" showIcon={false}/>

		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: 12,
			globalCooldown: this.globalCooldown,
			hasStacks: false,
			suggestionIcon,
			suggestionContent: <Trans id="war.tincture.suggestions.missedgcd.content">
				Try to land 12 GCDs before your <DataLink status="MEDICATED" /> buff runs out.
			</Trans>,
			suggestionWindowName,
			severityTiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
		}))

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{action: this.data.actions.PRIMAL_REND, expectedPerWindow: 1},
				{action: this.data.actions.PRIMAL_RUINATION, expectedPerWindow: 1},
				{action: this.data.actions.PRIMAL_WRATH, expectedPerWindow: 1},
				{action: this.data.actions.INNER_CHAOS, expectedPerWindow: 2},
				{action: this.data.actions.FELL_CLEAVE, expectedPerWindow: 3},
				{action: this.data.actions.ONSLAUGHT, expectedPerWindow: 3},
				{action: this.data.actions.UPHEAVAL, expectedPerWindow: 1},
			],
			suggestionIcon,
			suggestionContent: <Trans id="war.tincture.suggestions.trackedactions.content">
				Try to land at least one cast of <DataLink action="PRIMAL_REND" />, <DataLink action="PRIMAL_RUINATION" />, <DataLink action="PRIMAL_WRATH" />, <DataLink action="UPHEAVAL" />, three or more casts of <DataLink action="FELL_CLEAVE" /> and <DataLink action="ONSLAUGHT" />, and two or more uses of <DataLink action="INNER_CHAOS" /> before your <DataLink status="MEDICATED" /> buff runs out.
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
