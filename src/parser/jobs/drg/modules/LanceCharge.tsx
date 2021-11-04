import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, EvaluatedAction, ExpectedActionsEvaluator, ExpectedGcdCountEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export default class LanceCharge extends BuffWindow {
	static override handle: string = 'lancecharge'
	static override title = t('drg.lancecharge.title')`Lance Charge`
	static override displayOrder = DISPLAY_ORDER.LANCE_CHARGE

	@dependency globalCooldown!: GlobalCooldown

	override buffStatus = this.data.statuses.LANCE_CHARGE

	override initialise() {
		super.initialise()

		const suggestionIcon = this.data.actions.LANCE_CHARGE.icon
		const suggestionWindowName = <ActionLink action="LANCE_CHARGE" showIcon={false}/>
		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: 8,
			globalCooldown: this.globalCooldown,
			suggestionIcon,
			suggestionContent: <Trans id="drg.lc.suggestions.missedgcd.content">
				Try to land at least 8 GCDs during every <ActionLink action="LANCE_CHARGE" /> window.
			</Trans>,
			suggestionWindowName,
			severityTiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				4: SEVERITY.MAJOR,
			},
		}))

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{
					action: this.data.actions.CHAOS_THRUST,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.FULL_THRUST,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.FANG_AND_CLAW,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.WHEELING_THRUST,
					expectedPerWindow: 1,
				},
			],
			suggestionIcon,
			suggestionContent: <Trans id="drg.lc.suggestions.trackedactions.content">
				Each <ActionLink action="LANCE_CHARGE" /> window should contain at least one use each of <ActionLink action="CHAOS_THRUST" />, <ActionLink action="FULL_THRUST" />, <ActionLink action="FANG_AND_CLAW" />, and <ActionLink action="WHEELING_THRUST" />. In order to ensure that these actions fall within the buff window, try to avoid using <ActionLink action="LANCE_CHARGE" /> after <ActionLink action="CHAOS_THRUST" /> or <ActionLink action="FULL_THRUST" />.
			</Trans>,
			suggestionWindowName,
			severityTiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
			adjustCount: this.adjustExpectedActionCount.bind(this),
		}))
	}

	private adjustExpectedActionCount(window: HistoryEntry<EvaluatedAction[]>) {
		// so if a drg is rushing we don't really have expectations of specific actions that get fit in the window, we just want the buff used.
		if (this.isRushedEndOfPullWindow(window)) {
			return -1
		}
		return 0
	}
}
