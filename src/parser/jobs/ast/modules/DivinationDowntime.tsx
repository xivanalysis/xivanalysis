import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'
import React from 'react'

export default class OGCDDowntime extends CooldownDowntime {
	override trackedCds = [
		{
			cooldowns: [this.data.actions.DIVINATION],
			allowedAverageDowntime: 2500,
			firstUseOffset: 12500,
		},
	]
	override checklistTarget = 100
	override checklistName =  <Trans id="ast.ogcd-downtime.divination.name">Use Divination</Trans>
	override checklistDescription = <Trans id="ast.ogcd-downtime.divination.description"><ActionLink {...this.data.actions.DIVINATION} /> provides Astrologian with a strong amount of raid DPS when stacked together with arcanum.
			Damage percentage bonuses stack multiplicatively, so it's most optimal to stack it with cards from <ActionLink {...this.data.actions.MINOR_ARCANA} />.
			Try to time the usage to match raid buffs and high output phases of other party members - it's more important to use it on time rather than hold it in an attempt to have 3 different seals.
	</Trans>
}
