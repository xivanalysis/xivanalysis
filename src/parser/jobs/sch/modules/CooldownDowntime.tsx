import {Trans} from '@lingui/react'
import {CooldownDowntime as CooldownDowntimeCore} from 'parser/core/modules/CooldownDowntime'
import React from 'react'

export class CooldownDowntime extends CooldownDowntimeCore {
	override trackedCds = [
		{
			cooldowns: [this.data.actions.CHAIN_STRATAGEM],
			firstUseOffset: 10000,
		},
		{
			cooldowns: [this.data.actions.AETHERFLOW],
			firstUseOffset: 7500,
		},
	]
	override defensiveCooldowns = [
		{cooldowns: [this.data.actions.SCH_WHISPERING_DAWN]},
		{cooldowns: [this.data.actions.SCH_FEY_ILLUMINATION]},
		{cooldowns: [this.data.actions.RECITATION]},
		{cooldowns: [this.data.actions.SUMMON_SERAPH]},
		{cooldowns: [this.data.actions.PROTRACTION]},
		{cooldowns: [this.data.actions.EXPEDIENT]},
	]
	override defenseChecklistDescription = <Trans id="sch.cooldownDowntime.defense-cd-metric">
		Using your mitigation and healing cooldowns allows you to help keep the party healthy while continuing to deal damage.
		While you shouldn't waste these actions, you should try to plan out when to use them to maximize their utility.
	</Trans>
}
