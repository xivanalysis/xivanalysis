import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {TARGET} from 'parser/core/modules/Checklist'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'
import React from 'react'

const DEFAULT_HEAL_CHECKLIST_TIERS = {
	20: TARGET.WARN,
	50: TARGET.SUCCESS,
	80: TARGET.SUCCESS, //left here to get rid of warning since 80 is required in defenseChecklistTiers
}

export class oGCDs extends CooldownDowntime {

	override defenseChecklistTiers = DEFAULT_HEAL_CHECKLIST_TIERS
	override defenseChecklistName = <Trans id="ast.cooldownDowntime.use-heal-ogcds">Use your healing OGDs</Trans>
	override defenseChecklistDescription = <Trans id="ast.cooldownDowntime.heals-ogcd.description">
		Try to use your healing oGCDs to reduce the amount of GCD healing necessary. The below list provides an oGCD healing snapshot for you to consider as you progress with your parties and is not meant to be an extensive healing checklist to complete.
	</Trans>

	override checklistName =  <Trans id="ast.ogcd-downtime.divination.name">Use Divination</Trans>
	override checklistDescription = <Trans id="ast.ogcd-downtime.divination.description">
		<DataLink action="DIVINATION" /> provides Astrologian with a strong amount of raid DPS when stacked together with arcanum.
		Try to time the usage to match raid buffs and high output phases of other party members - it's more important to use it on time rather than hold it.
	</Trans>
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	override checklistTarget = 100

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

	private HEALING_OGCDS = [
		//healing ogcds
		{
			cooldowns: [this.data.actions.EXALTATION],
		},
		{
			cooldowns: [this.data.actions.CELESTIAL_INTERSECTION],
		},
		{
			cooldowns: [this.data.actions.CELESTIAL_OPPOSITION],
		},
		{
			cooldowns: [this.data.actions.HOROSCOPE],
		},
		{
			cooldowns: [this.data.actions.NEUTRAL_SECT],
		},
	]

	override trackedCds = this.DPS_COOLDOWNS_TRACKED
	override defensiveCooldowns = this.HEALING_OGCDS
}
