import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import CooldownDowntime from 'parser/core/modules/CooldownDowntime'
import React from 'react'

const TARGETPERCENT = 95
const FIRST_USE_OFFSET_ALL = 15000
const ALLOWED_DOWNTIME_ALL = 2500
// Diviniation at 9.5-12.5s for TA and other opener bursts
const FIRST_USE_OFFSET_DIVINATION = 12500
// Damage doesn't come right away in every fight
const FIRST_USE_OFFSET_HEALS = 30000

// It's okay to delay CO a little to match damage but usage should still be maximized as it's on such a short CD
const ALLOWED_DOWNTIME_CELESTIAL_OPPOSITION = 15000

export default class OGCDDowntime extends CooldownDowntime {
	allowedDowntime = ALLOWED_DOWNTIME_ALL

	firstUseOffset = FIRST_USE_OFFSET_ALL
	firstUseOffsetPerOgcd = {
		[ACTIONS.DIVINATION.id]: FIRST_USE_OFFSET_DIVINATION,
	}

	trackedCds = [
		ACTIONS.DIVINATION.id,
	]
	target = TARGETPERCENT
	description = <Trans id="ast.ogcd-downtime.divination"><ActionLink {...ACTIONS.DIVINATION} /> provides Astrologian with a strong amount of raid DPS when used together with arcanum.
			Damage percentage bonuses stack multiplicatively, so it's most optimal to stack it with cards from <ActionLink {...ACTIONS.MINOR_ARCANA} />. Try to time the usage to match high output phases of other party members.
		</Trans>
}
