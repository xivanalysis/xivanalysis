import {Plural, t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {iconUrl} from 'data/icon'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'
//https://www.fflogs.com/reports/tbXrQWDn3fawqz9g#fight=44&type=casts&source=759&translate=true
const ICON_DIVINE_CARESS = 2128

const SEVERITY_MISSED_PROCS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}

export class DivineCaress extends CoreProcs {
	static override title = t('whm.caress.title')`Divine Caress Misses`
	static override displayOrder = DISPLAY_ORDER.DIVINE_CARESS

	//Track Divine Caress as the only status currently
	trackedProcs = [
		{
			procStatus: this.data.statuses.DIVINE_GRACE,
			consumeActions: [this.data.actions.DIVINE_CARESS],
		},
	]
	protected override addJobSpecificSuggestions() {
		const missedCaress = this.getDropCountForStatus(this.data.statuses.DIVINE_GRACE.id)
		this.suggestions.add(new TieredSuggestion({
			icon: iconUrl(ICON_DIVINE_CARESS),
			content: <Trans id="whm.procs.suggestions.dropped-divine-caress.content">Try to use Divine Caress whenever you have used Temperance. It is a free, groupwide oGCD shield and heal over time!</Trans>,
			tiers: SEVERITY_MISSED_PROCS,
			value: missedCaress,
			why: <Trans id="whm.procs.suggestions.dropped-divine-caress.why">You dropped <Plural value={missedCaress} one="# use" other="# uses" /> of Divine Grace</Trans>,
		}))
	}

}
