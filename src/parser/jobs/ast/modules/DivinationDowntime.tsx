import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'
import React from 'react'

export default class OGCDDowntime extends CooldownDowntime {
	trackedCds = [
		{
			cooldowns: [ACTIONS.DIVINATION],
			allowedAverageDowntime: 2500,
			firstUseOffset: 12500,
		},
	]
	target = 100
	checklistName =  <Trans id="ast.ogcd-downtime.divination.name">Use Divination</Trans>
	checklistDescription = <Trans id="ast.ogcd-downtime.divination.description"><ActionLink {...ACTIONS.DIVINATION} /> provides Astrologian with a strong amount of raid DPS when stacked together with arcanum.
			Damage percentage bonuses stack multiplicatively, so it's most optimal to stack it with cards from <ActionLink {...ACTIONS.MINOR_ARCANA} />.
			Try to time the usage to match raid buffs and high output phases of other party members - it's more important to use it on time rather than hold it in an attempt to have 3 different seals.
	</Trans>
}
