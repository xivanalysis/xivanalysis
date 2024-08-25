import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'
import {ActionLink, StatusLink} from '../../../../../components/ui/DbLink'
import {dependency} from '../../../../core/Injectable'
import {BuffWindow} from '../../../../core/modules/ActionWindow'
import {RequiredGcdCountEvaluator} from '../../../../core/modules/ActionWindow/evaluators/RequiredGcdCountEvaluator'
import {GlobalCooldown} from '../../../../core/modules/GlobalCooldown'
import {SEVERITY} from '../../../../core/modules/Suggestions'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
import {DEBUG_SHOW_WINDOWS} from './Constants'

export class ArmysMuse extends BuffWindow {
	static override handle = 'armysmuse'
	static override title = t('brd.armysmuse.title')`Army's Muse`
	static override displayOrder = DISPLAY_ORDER.ARMYS_MUSE

	@dependency globalCooldown!: GlobalCooldown

	buffStatus = this.data.statuses.ARMYS_MUSE

	override initialise() {
		super.initialise()

		const suggestionIcon = this.data.actions.ARMYS_PAEON.icon
		const suggestionContent = <Trans id="brd.armysmuse.suggestions.missedgcd.content">
			Try to land 5 GCDs during every <StatusLink status="ARMYS_MUSE"  /> window.
		</Trans>
		const suggestionWindowName = <ActionLink action="ARMYS_PAEON" showIcon={false}/>

		const evaluator = new RequiredGcdCountEvaluator({
			requiredGcds: 5,
			globalCooldown: this.globalCooldown,
			hasStacks: false,
			suggestionIcon,
			suggestionContent,
			suggestionWindowName,
			severityTiers: {
				1: SEVERITY.MEDIUM,
			},
		})

		this.addEvaluator(evaluator)
		this.setHistoryOutputFilter((window) => evaluator.isWindowMissingGcds(window) || DEBUG_SHOW_WINDOWS)
	}
}
