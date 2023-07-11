import {Trans} from '@lingui/react'
import {Defensives as CoreDefensives} from 'parser/core/modules/Defensives'
import React from 'react'

export class Defensives extends CoreDefensives {
	protected override trackedDefensives = [
		this.data.actions.SCH_WHISPERING_DAWN,
		this.data.actions.SCH_FEY_ILLUMINATION,
		this.data.actions.RECITATION,
		this.data.actions.SUMMON_SERAPH,
		this.data.actions.PROTRACTION,
		this.data.actions.EXPEDIENT,
	]

	// Retaining the old trans ID
	protected override headerContent = <Trans id="sch.cooldownDowntime.defense-cd-metric">
		Using your mitigation and healing cooldowns allows you to help keep the party healthy while continuing to deal damage.
		While you shouldn't waste these actions, you should try to plan out when to use them to maximize their utility.
	</Trans>
}
