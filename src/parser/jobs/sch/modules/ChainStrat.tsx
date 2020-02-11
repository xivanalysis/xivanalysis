import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'
import React from 'react'

export default class ChainStrat extends CooldownDowntime {
	trackedCds = [
		{
			cooldowns: [ACTIONS.CHAIN_STRATAGEM],
			allowedAverageDowntime: 7500,
			firstUseOffset: 10000,
		},
	]
	checklistDescription = <Trans id="sch.chainstrat.cooldown.description">Try to use <ActionLink {...ACTIONS.CHAIN_STRATAGEM}/> on cooldown throughout the fight, particularly when your team has other buffs up for maximum effect.</Trans>
}
