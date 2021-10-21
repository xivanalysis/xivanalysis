import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'
import React from 'react'

export default class ChainStrat extends CooldownDowntime {
	override trackedCds = [
		{
			cooldowns: [this.data.actions.CHAIN_STRATAGEM],
			allowedAverageDowntime: 7500,
			firstUseOffset: 10000,
		},
	]
	override checklistDescription = <Trans id="sch.chainstrat.cooldown.description">Try to use <ActionLink {...this.data.actions.CHAIN_STRATAGEM}/> on cooldown throughout the fight, particularly when your team has other buffs up for maximum effect.</Trans>
}
