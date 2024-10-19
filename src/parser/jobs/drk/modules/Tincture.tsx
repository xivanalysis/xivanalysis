import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction, ExpectedActionGroupsEvaluator, TrackedActionGroup} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import {Tincture as CoreTincture} from 'parser/core/modules/Tincture'
import React from 'react'
import {Message} from 'semantic-ui-react'

const TINCTURE_OPENER_BUFFER = 10000
const BLOODSPILLER_REQUIREMENT = 2
const BLOODSPILLER_REQUIREMENT_OPENER = 1

export class Tincture extends CoreTincture {
	override prependMessages = <Message>
		<Trans id="drk.tincture.description">
			While you can use <DataLink action="DELIRIUM" /> either before or during your potion window, you should be sure to fit all three <DataLink action="DELIRIUM" /> enhanced skills within the potion window.
		</Trans>
	</Message>

	override initialise() {
		super.initialise()

		this.addEvaluator(new ExpectedActionGroupsEvaluator({
			expectedActionGroups: [
				{
					actions: [this.data.actions.SCARLET_DELIRIUM, this.data.actions.COMEUPPANCE, this.data.actions.TORCLEAVER, this.data.actions.IMPALEMENT],
					expectedPerWindow: 3,
					overrideHeader: <DataLink showName={false} action="DELIRIUM" />,
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
			suggestionWindowName: <DataLink item="INFUSION_STR" showIcon={false}/>,
			severityTiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			adjustCount: this.adjustExpectedBloodspillerCount.bind(this),
		}))
	}

	private adjustExpectedBloodspillerCount(window: HistoryEntry<EvaluatedAction[]>, action: TrackedActionGroup) {
		const evaluatedAction = action.actions[0]
		if (window.start - TINCTURE_OPENER_BUFFER <= this.parser.pull.timestamp && evaluatedAction === this.data.actions.BLOODSPILLER) {
			return BLOODSPILLER_REQUIREMENT_OPENER - BLOODSPILLER_REQUIREMENT
		}

		return 0
	}
}
