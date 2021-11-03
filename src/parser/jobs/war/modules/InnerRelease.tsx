import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {AllowedGcdsOnlyEvaluator, BuffWindow, ExpectedActionsEvaluator, ExpectedGcdCountEvaluator, LimitedActionsEvaluator} from 'parser/core/modules/ActionWindow'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

export default class InnerRelease extends BuffWindow {
	static override handle = 'ir'
	static override title = t('war.ir.title')`Inner Release`

	@dependency globalCooldown!: GlobalCooldown

	override buffStatus = this.data.statuses.INNER_RELEASE

	override initialise() {
		super.initialise()

		const windowName = this.data.actions.INNER_RELEASE.name
		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: 5,
			globalCooldown: this.globalCooldown,
			suggestionIcon: this.data.actions.INNER_RELEASE.icon,
			suggestionContent: <Trans id="war.ir.suggestions.missedgcd.content">
				Try to land 5 GCDs during every <ActionLink action="INNER_RELEASE"/> window. If you cannot do this with full uptime and no clipping, consider adjusting your gearset for more Skill Speed.
			</Trans>,
			windowName,
			severityTiers: {
				1: SEVERITY.MAJOR,
			},
		}))

		this.addEvaluator(new AllowedGcdsOnlyEvaluator({
			expectedGcdCount: 5,
			allowedGcds: [
				this.data.actions.FELL_CLEAVE.id,
				this.data.actions.DECIMATE.id,
			],
			globalCooldown: this.globalCooldown,
			suggestionIcon: this.data.actions.FELL_CLEAVE.icon,
			suggestionContent: <Trans id="war.ir.suggestions.badgcd.content">
				GCDs used during <ActionLink action="INNER_RELEASE"/> should be limited to <ActionLink action="FELL_CLEAVE"/> for optimal damage (or <ActionLink action="DECIMATE"/> if three or more targets are present).
			</Trans>,
			windowName,
			severityTiers: {
				1: SEVERITY.MAJOR,
			},
		}))

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{
					action: this.data.actions.UPHEAVAL,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.ONSLAUGHT,
					expectedPerWindow: 1,
				},
			],
			suggestionIcon: this.data.actions.UPHEAVAL.icon,
			suggestionContent: <Trans id="war.ir.suggestions.trackedActions.content">
				One use of <ActionLink action="UPHEAVAL"/> and one use of <ActionLink action="ONSLAUGHT"/> should occur during every <ActionLink action="INNER_RELEASE"/> window.
			</Trans>,
			windowName,
			severityTiers: {
				1: SEVERITY.MEDIUM,
			},
		}))

		this.addEvaluator(new LimitedActionsEvaluator({
			expectedActions: [
				{
					action: this.data.actions.INNER_CHAOS,
					expectedPerWindow: 0,
				},
				{
					action: this.data.actions.CHAOTIC_CYCLONE,
					expectedPerWindow: 0,
				},
			],
			suggestionIcon: this.data.actions.INNER_CHAOS.icon,
			suggestionContent: <Trans id="war.ir.suggestions.trackedBadActions.content">
				Using <ActionLink action="INNER_CHAOS" /> or <ActionLink action="CHAOTIC_CYCLONE" /> inside of <ActionLink action="INNER_RELEASE" /> should be avoided at all costs. These abilities are guaranteed to be a critical direct hit, and make no use of <ActionLink showIcon={false} action="INNER_RELEASE"/>'s benefits.
			</Trans>,
			windowName,
			severityTiers: {
				1: SEVERITY.MAJOR,
			},
		}))
	}

}
