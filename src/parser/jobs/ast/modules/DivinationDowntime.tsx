import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import CooldownDowntime from 'parser/core/modules/CooldownDowntime'
import React from 'react'

const TARGETPERCENT = 100
const ALLOWED_DOWNTIME_ALL = 2500
// Diviniation at 9.5-12.5s for TA and other opener bursts
const FIRST_USE_OFFSET_DIVINATION = 12500

export default class OGCDDowntime extends CooldownDowntime {
	allowedDowntime = ALLOWED_DOWNTIME_ALL

	firstUseOffsetPerOgcd = {
		[ACTIONS.DIVINATION.id]: FIRST_USE_OFFSET_DIVINATION,
	}

	trackedCds = [
		ACTIONS.DIVINATION.id,
	]
	target = TARGETPERCENT
	checklistName =  <Trans id="ast.ogcd-downtime.divination.name">Use Divination</Trans>
	description = <Trans id="ast.ogcd-downtime.divination.description"><ActionLink {...ACTIONS.DIVINATION} /> provides Astrologian with a strong amount of raid DPS when stacked together with arcanum.
			Damage percentage bonuses stack multiplicatively, so it's most optimal to stack it with cards from <ActionLink {...ACTIONS.MINOR_ARCANA} />.
			Try to time the usage to match raid buffs and high output phases of other party members - it's more important to use it on time rather than hold it in an attempt to have 3 different seals.
		</Trans>
}
