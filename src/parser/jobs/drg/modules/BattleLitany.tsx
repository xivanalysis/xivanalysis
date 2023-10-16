import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {ExpectedGcdCountEvaluator, RaidBuffWindow} from 'parser/core/modules/ActionWindow'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const BL_GCD_TARGET = 6

export class BattleLitany extends RaidBuffWindow {
	static override handle = 'battlelitany'
	static override title = t('drg.battlelitany.title')`Battle Litany`
	static override displayOrder = DISPLAY_ORDER.BATTLE_LITANY

	@dependency private globalCooldown!: GlobalCooldown

	buffAction = this.data.actions.BATTLE_LITANY
	buffStatus = this.data.statuses.BATTLE_LITANY

	override initialise() {
		super.initialise()

		const suggestionIcon = this.data.actions.BATTLE_LITANY.icon
		const suggestionWindowName = <ActionLink action="BATTLE_LITANY" showIcon={false} />
		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: BL_GCD_TARGET,
			globalCooldown: this.globalCooldown,
			hasStacks: false,
			suggestionIcon,
			suggestionContent: <Trans id="drg.bl.suggestions.missedgcd.content">
				Try to land at least 6 GCDs during every <ActionLink action="BATTLE_LITANY" /> window.
			</Trans>,
			suggestionWindowName,
			severityTiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
		}))
	}
}
