import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, ExpectedActionsEvaluator} from 'parser/core/modules/ActionWindow'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

export class RiddleOfWind extends BuffWindow {
	static override handle = 'riddleofwind'
	static override title = t('mnk.row.title')`Riddle of Wind`
	static override displayOrder = DISPLAY_ORDER.RIDDLE_OF_WIND

	@dependency globalCooldown!: GlobalCooldown

	buffStatus = this.data.statuses.RIDDLE_OF_WIND

	override initialise() {
		super.initialise()

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{
					action: this.data.actions.ATTACK,
					expectedPerWindow: 16,
				},
			],
			suggestionIcon: this.data.actions.INFUSION_MND.icon,
			suggestionContent: <Trans id="whm.tincture.suggestions.trackedActions.content">
				Try to cover as much damage as possible with your Tinctures of Mind.
			</Trans>,
			suggestionWindowName: <DataLink action="INFUSION_MND" showIcon={false}/>,
			severityTiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
		}))
	}
}
