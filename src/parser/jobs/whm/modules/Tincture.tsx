import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction, ExpectedActionsEvaluator, TrackedAction} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import {Tincture as CoreTincture} from 'parser/core/modules/Tincture'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

const TINCTURE_OPENER_BUFFER = 10000

export class Tincture extends CoreTincture {
	static override displayOrder = DISPLAY_ORDER.TINCTURES

	override initialise() {
		super.initialise()

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{
					action: this.data.actions.ASSIZE,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.DIA,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.GLARE_IV,
					expectedPerWindow: 3,
				},
			],
			suggestionIcon: this.data.actions.INFUSION_MND.icon,
			suggestionContent: <Trans id="whm.tincture.suggestions.trackedActions.content">
				Try to cover as much damage as possible with your Tinctures of Mind.
			</Trans>,
			suggestionWindowName: <DataLink item="INFUSION_MND" showIcon={false}/>,
			severityTiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			adjustCount: this.adjustDiaCountInOpener.bind(this),
		}))
	}

	private adjustDiaCountInOpener(window: HistoryEntry<EvaluatedAction[]>, trackedAction: TrackedAction) {
		const isInOpener = window.start - TINCTURE_OPENER_BUFFER <= this.parser.pull.timestamp
		const currentActionIsDia = trackedAction.action.id === this.data.actions.DIA.id

		return isInOpener && currentActionIsDia ? 1 : 0
	}
}
