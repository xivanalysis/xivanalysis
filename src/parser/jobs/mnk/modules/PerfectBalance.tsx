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
		expectedPerWindow: 5,
		suggestionContent: <Trans id="mnk.pb.suggestions.missedgcd.content">
			Try to land 5 GCDs during every <ActionLink {...ACTIONS.PERFECT_BALANCE} /> window. If you cannot do this with full uptime and no clipping, consider adjusting your gearset for more Skill Speed.
		</Trans>,
		severityTiers: {
			1: SEVERITY.MINOR,
			2: SEVERITY.MEDIUM,
			3: SEVERITY.MAJOR,
		},
	}

	trackedBadActions = {
		icon: ACTIONS.FORM_SHIFT.icon,
		actions: [
			{
				action: ACTIONS.FORM_SHIFT,
				expectedPerWindow: 0,
			},
		],
		suggestionContent: <Trans id="mnk.pb.suggestions.trackedBadActions.content">
			Using <ActionLink {...ACTIONS.FORM_SHIFT} /> inside of <ActionLink {...ACTIONS.PERFECT_BALANCE} /> does no damage and does not change your form.
		</Trans>,
		severityTiers: {
			1: SEVERITY.MEDIUM,
		},
	}
}
