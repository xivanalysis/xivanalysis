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

	override considerSwiftAction(action: Action): boolean {
		//We want to inspect the cast time to determine if the player was allowed to use SwiftCast or not
		const castTime = action?.castTime ?? 0
		if (castTime > 0) {
		//As long as we aren't in downtime, the cast time must exceed the base GCD to qualify.
			if (!this.downtime.isDowntime() && castTime <= BASE_GCD) {
				return false
			}
			//Then it had to be VerRaise, VerAero III, or VerThunder III or we were in downtime so it's valid
			return true
		}
		//Use the default behavoir if we've gotten back no cast time
		return super.considerSwiftAction(action)
	}
	override suggestionContent = <Trans id="rdm.swiftcast.suggestion.content">Spells used while <DataLink status="SWIFTCAST"/> is up should be limited to <DataLink action="VERAERO_III"/>, <DataLink action="VERTHUNDER_III"/>, or <DataLink action="VERRAISE"/></Trans>
}
