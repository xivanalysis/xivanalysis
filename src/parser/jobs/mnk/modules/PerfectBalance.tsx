import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS, {Action} from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {Status} from 'data/STATUSES'

import {dependency} from 'parser/core/Module'
import {BuffWindowModule, BuffWindowState} from 'parser/core/modules/BuffWindow'
import {SEVERITY} from 'parser/core/modules/Suggestions'

import DISPLAY_ORDER from './DISPLAY_ORDER'
import {FISTS} from './Fists'
import Gauge, {MAX_FASTER} from './Gauge'

export default class PerfectBalance extends BuffWindowModule {
	static handle = 'perfectBalance'
	static title = t('mnk.pb.title')`Perfect Balance`
	static displayOrder = DISPLAY_ORDER.PERFECT_BALANCE

	@dependency private gauge!: Gauge

	buffAction: Action = ACTIONS.PERFECT_BALANCE
	buffStatus: Status = STATUSES.PERFECT_BALANCE

	expectedGCDs = {
		expectedPerWindow: 5,
		suggestionContent: <Trans id="mnk.pb.suggestions.missedgcd.content">
			Try to land 5 GCDs in GL3, or 6 GCDs in GL4, during every <ActionLink {...ACTIONS.PERFECT_BALANCE} /> window. If you cannot do this with full uptime and no clipping, consider adjusting your gearset for more Skill Speed.
		</Trans>,
		severityTiers: {
			1: SEVERITY.MINOR,
			2: SEVERITY.MEDIUM,
			3: SEVERITY.MAJOR,
		},
	}

	trackedBadActions = {
		icon: ACTIONS.PERFECT_BALANCE.icon,
		actions: [
			{
				action: ACTIONS.FORM_SHIFT,
				expectedPerWindow: 0,
			},
			{
				action: ACTIONS.MEDITATION,
				expectedPerWindow: 0,
			},
		],
		suggestionContent: <Trans id="mnk.pb.suggestions.trackedBadActions.content">
			Using <ActionLink {...ACTIONS.FORM_SHIFT} /> and <ActionLink {...ACTIONS.MEDITATION} /> inside of <ActionLink {...ACTIONS.PERFECT_BALANCE} /> does no damage and does not change your Form.
		</Trans>,
		severityTiers: {
			1: SEVERITY.MEDIUM,
		},
	}

	changeExpectedGCDsClassLogic(buffWindow: BuffWindowState): number {
		// If we changed Fist, we know we don't have GL4 the whole way
		if (buffWindow.getActionCountByIds(FISTS) > 0) {
			return 0
		}

		// For now let's go with if they were in GL4 at the start,
		// since it less GCDs than expected implies a mistake like GL dropping
		return this.gauge.getStacksAt(buffWindow.start) < MAX_FASTER ? 0 : 1
	}
}
