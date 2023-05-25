import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export class oGCDs extends CooldownDowntime {

	override checklistName =  <Trans id="ast.ogcd-downtime.divination.name">Use Divination</Trans>
	override checklistDescription = <Trans id="ast.ogcd-downtime.divination.description">
		<DataLink action="DIVINATION" /> provides Astrologian with a strong amount of raid DPS when stacked together with arcanum.
		Try to time the usage to match raid buffs and high output phases of other party members - it's more important to use it on time rather than hold it.
	</Trans>
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	override checklistTarget = 100

	override trackedDisplayOrder = DISPLAY_ORDER.DIVINATION_CHECKLIST

	private DPS_COOLDOWNS_TRACKED = [
		//dps actions
		{
			cooldowns: [this.data.actions.DIVINATION],
			content: <Trans id="ast.ogcds_dps.divination.content">
				Consider using <DataLink action="DIVINATION" /> more frequently. <DataLink action="DIVINATION" /> provides an Astrologian with a strong amount of raid DPS.
			</Trans>,
			allowedAverageDowntime: 2500,
		},
	]

	override trackedCds = this.DPS_COOLDOWNS_TRACKED
}
