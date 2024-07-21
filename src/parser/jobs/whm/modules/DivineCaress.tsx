//import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {iconUrl} from 'data/icon'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import React from 'react'
//https://www.fflogs.com/reports/tbXrQWDn3fawqz9g#fight=44&type=casts&source=759&translate=true
const ICON_DIVINE_CARESS = 2128

export class DivineCaress extends CoreProcs {
	//static override title = t('whm.caress.title')`Divine Caress Misses`

	//Track Divine Caress as the only status currently
	override trackedProcs = [
		{
			procStatus: this.data.statuses.DIVINE_GRACE,
			consumeActions: [this.data.actions.DIVINE_CARESS],
		},
	]
	override showDroppedProcSuggestion = true;
	override droppedProcIcon = iconUrl(ICON_DIVINE_CARESS);
	override droppedProcContent =
		<Trans id="whm.procs.suggestions.dropped-divine-caress.content">
			Try to use Divine Caress whenever you have used Temperance. It is a free, groupwide oGCD shield and heal over time!
		</Trans>
}
