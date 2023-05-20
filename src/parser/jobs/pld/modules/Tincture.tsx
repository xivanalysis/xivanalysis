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

		const suggestionIcon = this.data.actions.INFUSION_STR.icon
		const suggestionWindowName = <DataLink action="INFUSION_STR" />
		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: 12,
			globalCooldown: this.globalCooldown,
			hasStacks: false,
			suggestionIcon,
			suggestionContent: <Trans id="pld.tincture.suggestions.missedgcd.content">
				Try to land 12 GCDs during every <DataLink action="INFUSION_STR" /> window.
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
				{action: this.data.actions.EXPIACION, expectedPerWindow: 1},
				{action: this.data.actions.CIRCLE_OF_SCORN, expectedPerWindow: 1},
				{action: this.data.actions.GORING_BLADE, expectedPerWindow: 1},
				{action: this.data.actions.CONFITEOR, expectedPerWindow: 1},
				{action: this.data.actions.BLADE_OF_FAITH, expectedPerWindow: 1},
				{action: this.data.actions.BLADE_OF_TRUTH, expectedPerWindow: 1},
				{action: this.data.actions.BLADE_OF_VALOR, expectedPerWindow: 1},
				{action: this.data.actions.HOLY_SPIRIT, expectedPerWindow: 1},
			],
			suggestionIcon,
			suggestionContent: <Trans id="pld.tincture.suggestions.trackedactions.content">
				Try to land at least one cast of <DataLink action="EXPIACION" />, <DataLink action="CIRCLE_OF_SCORN" />
				, <DataLink action="INTERVENE" />, <DataLink action="GORING_BLADE" />, <DataLink action="CONFITEOR" />
				, <DataLink action="BLADE_OF_FAITH" />, <DataLink action="BLADE_OF_TRUTH" />, <DataLink action="BLADE_OF_VALOR" />
				, and a <DataLink status="DIVINE_MIGHT" /> empowered <DataLink action ="HOLY_SPIRIT" /> during every <DataLink action="INFUSION_STR" /> window.
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
