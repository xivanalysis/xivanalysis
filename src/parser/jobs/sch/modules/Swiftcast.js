import React from 'react'
import {t, Trans, Plural} from '@lingui/macro'

import {BuffWindowModule} from 'parser/core/modules/BuffWindow'
import {getDataBy} from 'data/getDataBy'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

import DISPLAY_ORDER from './DISPLAY_ORDER'
import {ActionLink} from 'components/ui/DbLink'

const MISSED_SWIFTCASTS_SEVERITIES = {
	1: SEVERITY.MAJOR,
}

export default class Swiftcast extends BuffWindowModule {
	static displayOrder = DISPLAY_ORDER.SWIFTCAST
	static handle = 'swiftcast'
	static title = t('sch.swiftcast.title')`Swiftcast Actions`

	buffAction = ACTIONS.SWIFTCAST
	buffStatus = STATUSES.SWIFTCAST
	rotationTableHeader = <Trans id="sch.swiftcast.title">Swiftcast Actions</Trans>

	// override to ignore non-GCD casts
	onCast(event) {
		const action = getDataBy(ACTIONS, 'id', event.ability.guid)

		if (!action || action.autoAttack || !action.castTime) {
			return
		}

		if (this.activeBuffWindow) {
			this.activeBuffWindow.rotation.push(event)
		}
	}

	// override since we're not really useing any of the other BuffWindow tracking features
	onComplete() {
		const missedSwifts = this.buffWindows.reduce((sum, buffWindow) => {
			return sum + buffWindow.rotation.length ? 0 : 1
		}, 0)

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.SWIFTCAST.icon,
			content: <Trans id="sch.swiftcast.missed.suggestion.content">Use spells with <ActionLink {...ACTIONS.SWIFTCAST}/> before it expires. This allows you to use spells with cast time instantly, such as <ActionLink {...ACTIONS.RESURRECTION}/> for a quick revive, or <ActionLink {...ACTIONS.BROIL_III}/> for weaving.</Trans>,
			tiers: MISSED_SWIFTCASTS_SEVERITIES,
			value: missedSwifts,
			why: <Trans id="sch.swiftcast.missed.suggestion.why">
				{missedSwifts} <Plural value={missedSwifts} one="Swiftcast was" other="Swiftcasts were" /> wasted because you did not use a spell in time.
			</Trans>,

		}))
	}
}
