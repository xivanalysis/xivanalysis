import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'

import ACTIONS from 'data/ACTIONS'
import {ActionLink} from 'components/ui/DbLink'
import {BuffWindowModule, BuffWindowState, BuffWindowTrackedAction} from 'parser/core/modules/BuffWindow'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import STATUSES from 'data/STATUSES'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export default class LanceCharge extends BuffWindowModule {
	static handle: string = 'lancecharge'
	static title = t('drg.lancecharge.title')`Lance Charge`
	static displayOrder = DISPLAY_ORDER.LANCE_CHARGE

	buffAction = ACTIONS.LANCE_CHARGE
	buffStatus = STATUSES.LANCE_CHARGE

	expectedGCDs = {
		expectedPerWindow: 8,
		suggestionContent: <Trans id="drg.lc.suggestions.missedgcd.content">
			Try to land at least 8 GCDs during every <ActionLink {...ACTIONS.LANCE_CHARGE} /> window.
		</Trans>,
		severityTiers: {
			1: SEVERITY.MINOR,
			2: SEVERITY.MEDIUM,
			4: SEVERITY.MAJOR,
		},
	}

	trackedActions = {
		icon: ACTIONS.LANCE_CHARGE.icon,
		actions: [
			{
				action: ACTIONS.CHAOS_THRUST,
				expectedPerWindow: 1,
			},
			{
				action: ACTIONS.FULL_THRUST,
				expectedPerWindow: 1,
			},
			{
				action: ACTIONS.FANG_AND_CLAW,
				expectedPerWindow: 1,
			},
			{
				action: ACTIONS.WHEELING_THRUST,
				expectedPerWindow: 1,
			},
		],
		suggestionContent: <Trans id="drg.lc.suggestions.trackedactions.content">
			Each <ActionLink {...ACTIONS.LANCE_CHARGE} /> window should contain at least one use each of <ActionLink {...ACTIONS.CHAOS_THRUST} />, <ActionLink {...ACTIONS.FULL_THRUST} />, <ActionLink {...ACTIONS.FANG_AND_CLAW} />, and <ActionLink {...ACTIONS.WHEELING_THRUST} />. In order to ensure that these actions fall within the buff window, try to avoid using <ActionLink {...ACTIONS.LANCE_CHARGE} /> after <ActionLink {...ACTIONS.CHAOS_THRUST} /> or <ActionLink {...ACTIONS.FULL_THRUST} />.
		</Trans>,
		severityTiers: {
			1: SEVERITY.MINOR,
			3: SEVERITY.MEDIUM,
			5: SEVERITY.MAJOR,
		},
	}

	protected reduceTrackedActionsEndOfFight(buffWindow: BuffWindowState, action: BuffWindowTrackedAction): number {
		const windowDurationMillis = this.buffStatus.duration * 1000
		const fightTimeRemaining = this.parser.pull.duration - (buffWindow.start - this.parser.eventTimeOffset)

		// so if a drg is rushing we don't really have expectations of specific actions that get fit in the window, we just want the buff used.
		if (windowDurationMillis >= fightTimeRemaining) {
			return 1
		}

		return 0
	}
}
