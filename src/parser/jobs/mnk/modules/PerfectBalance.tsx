import {t, Trans} from '@lingui/macro'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {Action} from 'data/ACTIONS/ACTIONS'
import STATUSES from 'data/STATUSES'
import {Status} from 'data/STATUSES/STATUSES'
import {BuffWindowModule} from 'parser/core/modules/BuffWindow'
import {SEVERITY} from 'parser/core/modules/Suggestions'

export default class PerfectBalance extends BuffWindowModule {
	static handle = 'pb'
	static title = t('mnk.pb.title')`Perfect Balance Windows`

	buffAction: Action = ACTIONS.PERFECT_BALANCE
	buffStatus: Status = STATUSES.PERFECT_BALANCE

	expectedGCDs = {
		expectedPerWindow: 6,
		suggestionContent: <Trans id="mnk.pb.suggestions.missedgcd.content">
			Try to land 6 GCDs during every <ActionLink {...ACTIONS.PERFECT_BALANCE} /> window.  If you cannot do this with full uptime and no clipping, consider adjusting your gearset for more Skill Speed.
		</Trans>,
		severityTiers: {
			1: SEVERITY.MEDIUM,
			3: SEVERITY.MAJOR,
		},
	}

	trackedBadActions = {
		icon: ACTIONS.TWIN_SNAKES.icon,
		actions: [
			{
				action: ACTIONS.TWIN_SNAKES,
				expectedPerWindow: 0,
			},
		],
		suggestionContent: <Trans id="mnk.pb.suggestions.trackedBadActions.content">
			Using <ActionLink {...ACTIONS.TWIN_SNAKES} /> or inside of <ActionLink {...ACTIONS.PERFECT_BALANCE} /> should be avoided under most circumstances. Try to refresh it before entering the window.
		</Trans>,
		severityTiers: {
			1: SEVERITY.MEDIUM,
		},
	}
}
