import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffWindowModule} from 'parser/core/modules/BuffWindow'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

export default class Delirium extends BuffWindowModule {
	static handle = 'delirium'
	static title = t('drk.delirium.title')`Delirium Usage`
	static displayOrder = DISPLAY_ORDER.DELIRIUM

	buffAction = ACTIONS.DELIRIUM
	buffStatus = STATUSES.DELIRIUM

	expectedGCDs = {
		expectedPerWindow: 5,
		suggestionContent: <Trans id="drk.delirium.suggestions.missedgcd.content">
			Try to land 5 GCDs during every <ActionLink {...ACTIONS.DELIRIUM} /> window.  If you cannot do this with full uptime and no clipping, consider adjusting your gearset for more Skill Speed.
		</Trans>,
		severityTiers: {
			1: SEVERITY.MEDIUM,
			3: SEVERITY.MAJOR,
		},
	}
	requiredGCDs = {
		icon: ACTIONS.BLOODSPILLER.icon,
		actions: [
			ACTIONS.BLOODSPILLER,
			ACTIONS.QUIETUS,
		],
		suggestionContent: <Trans id="drk.delirium.suggestions.badgcd.content">
			GCDs used during <ActionLink {...ACTIONS.DELIRIUM}/> should be limited to <ActionLink {...ACTIONS.BLOODSPILLER}/> for optimal damage (or <ActionLink {...ACTIONS.QUIETUS}/> if three or more targets are present).
		</Trans>,
		severityTiers: {
			1: SEVERITY.MEDIUM,
			2: SEVERITY.MAJOR,
		},
	}
}
