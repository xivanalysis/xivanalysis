import {Trans} from '@lingui/macro'
import {ActionLink} from 'components/ui/DbLink'
import {Swiftcast as CoreSwiftcast} from 'parser/core/modules/Swiftcast'
import React, {Fragment} from 'react'
import {Message} from 'semantic-ui-react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

export class Swiftcast extends CoreSwiftcast {
	static override displayOrder = DISPLAY_ORDER.SWIFTCAST

	override suggestionContent = <Trans id="smn.swiftcast.missed.suggestion.content">Use a spell with <ActionLink action="SWIFTCAST"/> before it expires.</Trans>

	override output() {
		return <Fragment>
			<Message>
				<Trans id="smn.swiftcast.note">Swiftcast should only be used on <ActionLink action="RESURRECTION" />, <ActionLink action="RUBY_RITE" />
				(<ActionLink action="RUBY_CATASTROPHE"/> in AoE), or when snapshotting buffs, <ActionLink action="SLIPSTREAM" />.  Avoid using Swiftcast
				on other skills by rearranging your Arcanum summoning order.</Trans>
			</Message>
			<>{super.output()}</>
		</Fragment>
	}
}
