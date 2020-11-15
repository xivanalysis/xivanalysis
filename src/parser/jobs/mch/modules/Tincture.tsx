import {Trans} from '@lingui/react'
import Downtime from 'parser/core/modules/Downtime'
import {dependency} from 'parser/core/Module'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import {Tincture as CoreTincture} from 'parser/core/modules/Tincture'
import React from 'react'
import {BuffWindowState, BuffWindowTrackedAction} from 'parser/core/modules/BuffWindow'

// Arbitrary 1 GCD buffer for the tincture buff application
const TINCTURE_BUFFER = 2500

export default class Tincture extends CoreTincture {
	@dependency private downtime!: Downtime

	buffAction = this.data.actions.INFUSION_DEX

	petActions = [this.data.actions.PILE_BUNKER]

	trackedActions = {
		icon: this.data.actions.INFUSION_DEX.icon,
		actions: [
			{
				action: this.data.actions.WILDFIRE,
				expectedPerWindow: 1,
			},
			{
				action: this.data.actions.REASSEMBLE,
				expectedPerWindow: 1,
			},
			{
				action: this.data.actions.PILE_BUNKER,
				expectedPerWindow: 1,
			},
			{
				action: this.data.actions.DRILL,
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
		const bufferedWindowStart = buffWindow.start - TINCTURE_BUFFER

		if (action.action === this.data.actions.REASSEMBLE) {
			// Reassemble might be used prepull or during downtime
			if (bufferedWindowStart <= this.parser.fight.start_time || this.downtime.isDowntime(bufferedWindowStart)) {
				return -1
			}

		} else if (action.action === this.data.actions.PILE_BUNKER) {
			// We don't have queen in the opener
			if (bufferedWindowStart <= this.parser.fight.start_time) {
				return -1
			}
		}

		return 0
	}
}
