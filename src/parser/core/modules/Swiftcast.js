import React from 'react'
import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'

import {BuffWindowModule} from 'parser/core/modules/BuffWindow'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import {getDataBy} from 'data/getDataBy'

export default class Swiftcast extends BuffWindowModule {
	static handle = 'swiftcast'
	static title = t('core.swiftcast.title')`Swiftcasts`

	buffAction = ACTIONS.SWIFTCAST
	buffStatus = STATUSES.SWIFTCAST

	expectedGCDs = {
		expectedPerWindow: 1,
		suggestionContent: <Trans id="core.swiftcast.suggestions.missedgcd.content">
			Try to use at least one move during every <ActionLink {...ACTIONS.SWIFTCAST} />
		</Trans>,
		severityTiers: {
			1: SEVERITY.MAJOR,
		},
	}

	// override to only use gcd casts
	onCast(event) {
		const action = getDataBy(ACTIONS, 'id', event.ability.guid)

		if (!action || action.autoAttack || !action.castTime) {
			return
		}

		if (this.activeBuffWindow) {
			this.activeBuffWindow.rotation.push(event)
		}
	}

	reduceExpectedGCDsEndOfFight() {
		return 0
	}
}
