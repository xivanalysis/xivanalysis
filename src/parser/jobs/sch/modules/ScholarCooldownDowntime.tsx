import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'
import React, { Fragment } from 'react'

export default class ScholarCooldownDowntime extends CooldownDowntime {
	override trackedCds = [
		{
			cooldowns: [this.data.actions.CHAIN_STRATAGEM],
			allowedAverageDowntime: 7500,
			firstUseOffset: 10000,
		},
		{
			cooldowns: [this.data.actions.AETHERFLOW],
			allowedAverageDowntime: 5000,
			firstUseOffset: 10000,
		},
	]
	override checklistDescription = <Fragment>
		<div><Trans id="sch.cooldown.chainstrat.description">Try to use <ActionLink {...this.data.actions.CHAIN_STRATAGEM}/> on cooldown throughout the fight, particularly when your team has other buffs up for maximum effect.</Trans></div>
		<div><Trans id="sch.cooldown.aetherflow.description">Try to use <ActionLink {...this.data.actions.AETHERFLOW}/> on cooldown throughout the fight. If you have extra Aetherflow charges, cast Energy Drain to do additional damage before casting <ActionLink {...this.data.actions.AETHERFLOW}/>.</Trans></div>
	</Fragment>
}
