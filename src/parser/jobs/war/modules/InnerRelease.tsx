import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffWindowModule} from 'parser/core/modules/BuffWindow'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

export default class InnerRelease extends BuffWindowModule {
	static handle = 'delirium'
	static title = t('drk.delirium.title')`Delirium Usage`

	buffAction = ACTIONS.INNER_RELEASE
	buffStatus = STATUSES.INNER_RELEASE

	expectedGCDs = {
		expectedPerWindow: 5,
		suggestionContent: <Trans id="war.ir.suggestions.missedgcd.content">
			Try to land 5 GCDs during every <ActionLink {...ACTIONS.INNER_RELEASE}/> window. If you cannot do this with full uptime and no clipping, consider adjusting your gearset for more Skill Speed.
		</Trans>,
		severityTiers: {
			1: SEVERITY.MAJOR,
		},
	}
	requiredGCDs = {
		iconAction: ACTIONS.FELL_CLEAVE,
		actions: [
			ACTIONS.FELL_CLEAVE,
			ACTIONS.DECIMATE,
		],
		suggestionContent: <Trans id="war.ir.suggestions.badgcd.content">
			GCDs used during <ActionLink {...ACTIONS.INNER_RELEASE}/> should be limited to <ActionLink {...ACTIONS.FELL_CLEAVE}/> for optimal damage (or <ActionLink {...ACTIONS.DECIMATE}/> if three or more targets are present).
		</Trans>,
		severityTiers: {
			1: SEVERITY.MAJOR,
		},
	}
	trackedCooldowns = [
		{
			action: ACTIONS.UPHEAVAL,
			expectedPerWindow: 1,
			suggestionContent: <Trans id="war.ir.suggestions.upheaval.content">
				One use of <ActionLink {...ACTIONS.UPHEAVAL}/> should occur during every <ActionLink {...ACTIONS.INNER_RELEASE}/> window.
			</Trans>,
			severityTiers: {
				1: SEVERITY.MEDIUM,
			},
		},
		{
			action: ACTIONS.ONSLAUGHT,
			expectedPerWindow: 1,
			suggestionContent: <Trans id="war.ir.suggestions.onslaught.content">
				One use of <ActionLink {...ACTIONS.ONSLAUGHT}/> should occur during every <ActionLink {...ACTIONS.INNER_RELEASE}/> window.
			</Trans>,
			severityTiers: {
				1: SEVERITY.MEDIUM,
			},
		},
	]
	trackedBadCooldowns = [
		{
			action: ACTIONS.INNER_CHAOS,
			expectedPerWindow: 0,
			suggestionContent: <Trans id="war.ir.suggestions.innerchaos.content">
				Using <ActionLink {...ACTIONS.INNER_CHAOS} /> inside of <ActionLink {...ACTIONS.INNER_RELEASE} /> should be avoided at all costs. The ability is guaranteed to be a critical direct hit, and makes no use of <ActionLink {...ACTIONS.INNER_RELEASE}/>'s benefits.
			</Trans>,
			severityTiers: {
				1: SEVERITY.MAJOR,
			},
		},
		{
			action: ACTIONS.CHAOTIC_CYCLONE,
			expectedPerWindow: 0,
			suggestionContent: <Trans id="war.ir.suggestions.chaoticcyclone.content">
				Using <ActionLink {...ACTIONS.CHAOTIC_CYCLONE} /> inside of <ActionLink {...ACTIONS.INNER_RELEASE} /> should be avoided at all costs. The ability is guaranteed to be a critical direct hit, and makes no use of <ActionLink {...ACTIONS.INNER_RELEASE}/>'s benefits.
			</Trans>,
			severityTiers: {
				1: SEVERITY.MAJOR,
			},
		},
	]
}
