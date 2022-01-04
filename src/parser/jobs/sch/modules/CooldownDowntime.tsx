import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {CooldownDowntime as CooldownDowntimeCore} from 'parser/core/modules/CooldownDowntime'
import React, {Fragment} from 'react'

export default class CooldownDowntime extends CooldownDowntimeCore {
	override trackedCds = [
		{
			cooldowns: [this.data.actions.CHAIN_STRATAGEM],
			firstUseOffset: 8500,
		},
		{
			cooldowns: [this.data.actions.AETHERFLOW],
			firstUseOffset: 2500,
		},
	]
}
