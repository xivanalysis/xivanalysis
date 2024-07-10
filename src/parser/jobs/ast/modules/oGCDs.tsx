import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export class oGCDs extends CooldownDowntime {
	private oracle_override: Action = { //this is used to ensure that Oracle has the same cooldown as Divination since it functionally does
		...this.data.actions.ORACLE,
		cooldown: this.data.actions.DIVINATION.cooldown,
	}
	override checklistName = <Trans id="ast.divination.checklist.name">Use <DataLink action="DIVINATION" /> and <DataLink action="ORACLE" /></Trans>
	override checklistDescription = <Trans id="ast.divination.checklist.description">
		<DataLink action="DIVINATION" /> provides Astrologian with a strong amount of raid DPS when stacked together with arcanum.
		<br/><DataLink action="ORACLE" /> is a very powerful oGCD that should be used within the <DataLink action="DIVINATION" showIcon={false} /> window.
		<br/>Try to time <DataLink action="DIVINATION" showIcon={false} /> to match raid buffs and high output phases of other party members - it's more important to use it on time rather than hold it.
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
		{
			cooldowns: [this.oracle_override],
			content: <Trans id="ast.ogcds_dps.oracle.content">
				Consider using <DataLink action="ORACLE" /> more frequently. <DataLink action="ORACLE" /> is a very hard-hitting oGCD that should be utilized during the <DataLink action="DIVINATION" /> window.
			</Trans>,
			allowedAverageDowntime: 2500,
		},
	]

	override trackedCds = this.DPS_COOLDOWNS_TRACKED
}
