import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction, ExpectedActionGroupsEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import {Tincture as CoreTincture} from 'parser/core/modules/Tincture'
import React from 'react'

const TINCTURE_OPENER_BUFFER = 10000
const BLOODSPILLER_REQUIREMENT = 2
const BLOODSPILLER_REQUIREMENT_OPENER = 1

export class Tincture extends CoreTincture {

	override initialise() {
		super.initialise()

		this.addEvaluator(new ExpectedActionGroupsEvaluator({
			expectedActionGroups: [
				{
					actions: [this.data.actions.DELIRIUM],
					expectedPerWindow: 1,
				},
				{
					actions: [this.data.actions.BLOODSPILLER],
					expectedPerWindow: 2,
				},
				{
					actions: [this.data.actions.SHADOWBRINGER],
					expectedPerWindow: 2,
				},
				{
					actions: [this.data.actions.CARVE_AND_SPIT, this.data.actions.ABYSSAL_DRAIN],
					expectedPerWindow: 1,
				},
				{
					actions: [this.data.actions.DISESTEEM],
					expectedPerWindow: 1,
				},
				{
					actions: [this.data.actions.EDGE_OF_SHADOW, this.data.actions.FLOOD_OF_SHADOW],
					expectedPerWindow: 5,
				},
			],
			suggestionIcon: this.data.actions.INFUSION_STR.icon,
			suggestionContent: <Trans id="gnb.tincture.suggestions.trackedActions.content">
				Try to cover as much damage as possible with your Tinctures of Strength.
			</Trans>,
			suggestionWindowName: <DataLink action="INFUSION_STR" showIcon={false}/>,
			severityTiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			adjustCount: this.adjustExpectedBloodspillerCount.bind(this),
		}))
	}

	private adjustExpectedBloodspillerCount(window: HistoryEntry<EvaluatedAction[]>) {
		const evaluatedAction = window.data[0].action
		if (window.start - TINCTURE_OPENER_BUFFER <= this.parser.pull.timestamp && evaluatedAction === this.data.actions.BLOODSPILLER) {
			return BLOODSPILLER_REQUIREMENT_OPENER - BLOODSPILLER_REQUIREMENT
		}

		return 0
	}
}
