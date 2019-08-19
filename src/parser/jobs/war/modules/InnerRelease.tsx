import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffWindowModule} from 'parser/core/modules/BuffWindow'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

export default class InnerRelease extends BuffWindowModule {
	static handle = 'ir'
	static title = t('war.ir.title')`Inner Release Usage`

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
		icon: ACTIONS.FELL_CLEAVE.icon,
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
	trackedActions = {
		icon: ACTIONS.UPHEAVAL.icon,
		actions: [
			{
				action: ACTIONS.UPHEAVAL,
				expectedPerWindow: 1,
			},
			{
				action: ACTIONS.ONSLAUGHT,
				expectedPerWindow: 1,
			},
		],
		suggestionContent: <Trans id="war.ir.suggestions.trackedActions.content">
			One use of <ActionLink {...ACTIONS.UPHEAVAL}/> and one use of <ActionLink {...ACTIONS.ONSLAUGHT}/> should occur during every <ActionLink {...ACTIONS.INNER_RELEASE}/> window.
		</Trans>,
		severityTiers: {
			1: SEVERITY.MEDIUM,
		},
	}

	trackedBadActions = {
		icon: ACTIONS.INNER_CHAOS.icon,
		actions: [
			{
				action: ACTIONS.INNER_CHAOS,
				expectedPerWindow: 0,
			},
			{
				action: ACTIONS.CHAOTIC_CYCLONE,
				expectedPerWindow: 0,
			},
		],
		suggestionContent: <Trans id="war.ir.suggestions.trackedBadActions.content">
			Using <ActionLink {...ACTIONS.INNER_CHAOS} /> or <ActionLink {...ACTIONS.CHAOTIC_CYCLONE} /> inside of <ActionLink {...ACTIONS.INNER_RELEASE} /> should be avoided at all costs. These abilities are guaranteed to be a critical direct hit, and make no use of <ActionLink showIcon={false} {...ACTIONS.INNER_RELEASE}/>'s benefits.
		</Trans>,
		severityTiers: {
			1: SEVERITY.MAJOR,
		},
	}
}
