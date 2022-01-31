import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {BASE_GCD} from 'data/CONSTANTS'
import {dependency} from 'parser/core/Injectable'
import Downtime from 'parser/core/modules/Downtime'
import {Swiftcast as CoreSwiftcast} from 'parser/core/modules/Swiftcast'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

export class Swiftcast extends CoreSwiftcast {
static override displayOrder = DISPLAY_ORDER.SWIFTCAST

@dependency private downtime!: Downtime

override considerSwiftAction(_action: Action): boolean {
	const castTime = _action?.castTime ?? 0
	if (castTime > 0) {
		if (!this.downtime.isDowntime() && (castTime <= BASE_GCD || _action === this.data.actions.SPRINT)) {
			return false
		}
		return true
	}
	//Use the default behavoir if we've gotten back no cast time
	return true
}
	override suggestionContent = <Trans id="rdm.swiftcast.suggestion.content">Spells used while <DataLink status="SWIFTCAST"/> is up should be limited to <DataLink action="VERAERO_III"/>, <DataLink action="VERTHUNDER_III"/>, or <DataLink action="VERRAISE"/></Trans>
}
