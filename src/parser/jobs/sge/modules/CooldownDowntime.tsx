import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {CooldownDowntime as CoreCooldownDowntime} from 'parser/core/modules/CooldownDowntime'
import Suggestions from 'parser/core/modules/Suggestions'
import React from 'react'

const DPS_TARGET_PERCENT = 80

export class CooldownDowntime extends CoreCooldownDowntime {
	@dependency private suggestions!: Suggestions

	/**
	 * DPS cooldowns. For Sage, this is pretty much just Phlegma. Modified description since Phlegma is itself a GCD.
	 */
	trackedCds = [
		{cooldowns: [this.data.actions.PHLEGMA_III]},
	]
	override checklistDescription = <Trans id="sge.cooldownDowntime.ogcd-cd-metric"><DataLink showIcon={false} action="PHLEGMA_III"/> is stronger than <DataLink showIcon={false} action="DOSIS_III" />. Try not to lose out on using it by sitting on both charges for too long.</Trans>
	override checklistTarget = DPS_TARGET_PERCENT
}
