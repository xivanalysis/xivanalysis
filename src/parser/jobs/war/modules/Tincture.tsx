import {Trans} from '@lingui/react'
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
		const suggestionWindowName = <Trans id="war.tincture.title">Gemdraught of Strength</Trans>

		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: 12,
			globalCooldown: this.globalCooldown,
			hasStacks: false,
			suggestionIcon,
			suggestionContent: <Trans id="war.tincture.suggestions.missedgcd.content">
				Try to land 12 GCDs during the damage buff given by your Gemdraught of Strength.
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
				Try to use all your higher damage abilities during your Gemdraughts of Strength.
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
