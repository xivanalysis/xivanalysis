import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS, {Action} from 'data/ACTIONS'
import Downtime from 'parser/core/modules/Downtime'
import {dependency} from 'parser/core/Module'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import {Tincture} from 'parser/core/modules/Tincture'
import React from 'react'
import {BuffWindowState, BuffWindowTrackedAction} from 'parser/core/modules/BuffWindow'

export default class MchTincture extends Tincture {
	@dependency private downtime!: Downtime

	buffAction = ACTIONS.INFUSION_DEX

	petActions = [ACTIONS.PILE_BUNKER]

	trackedActions = {
		icon: ACTIONS.INFUSION_DEX.icon,
		actions: [
			{
				action: ACTIONS.WILDFIRE,
				expectedPerWindow: 1,
			},
			{
				action: ACTIONS.REASSEMBLE,
				expectedPerWindow: 1,
			},
			{
				action: ACTIONS.PILE_BUNKER,
				expectedPerWindow: 1,
			},
			{
				action: ACTIONS.DRILL,
				expectedPerWindow: 2,
			},
		],
		suggestionContent: <Trans id="mch.tincture.suggestions.trackedActions.content">
			Try to cover as much damage as possible with your Tinctures of Dexterity.
		</Trans>,
		severityTiers: {
			2: SEVERITY.MINOR,
			4: SEVERITY.MEDIUM,
			6: SEVERITY.MAJOR,
		},
	}

	changeExpectedTrackedActionClassLogic(buffWindow: BuffWindowState, action: BuffWindowTrackedAction): number {
		if (action.action === ACTIONS.REASSEMBLE) {
			// Reassemble might be used prepull or during downtime
			if (buffWindow.start <= this.parser.fight.start_time || this.downtime.isDowntime(buffWindow.start)) {
				return -1
			}

		} else if (action.action === ACTIONS.PILE_BUNKER) {
			// We don't have queen in the opener
			if (buffWindow.start <= this.parser.fight.start_time) {
				return -1
			}
		}

		return 0
	}
}
