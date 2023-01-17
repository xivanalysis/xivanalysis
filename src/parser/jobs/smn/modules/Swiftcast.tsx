import {Trans} from '@lingui/macro'
import {ActionLink} from 'components/ui/DbLink'
import {Swiftcast as CoreSwiftcast} from 'parser/core/modules/Swiftcast'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

export class Swiftcast extends CoreSwiftcast {
	static override displayOrder = DISPLAY_ORDER.SWIFTCAST

	override suggestionContent = <Trans id="smn.swiftcast.missed.suggestion.content">Use a spell with <ActionLink action="SWIFTCAST"/> before it expires.</Trans>
}
