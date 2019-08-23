import {Trans} from '@lingui/react'
import ACTIONS from 'data/ACTIONS'
import CooldownDowntime from 'parser/core/modules/CooldownDowntime'
import React from 'react'

const TARGETPERCENT = 95
const FIRST_USE_OFFSET_ALL = 15000
const ALLOWED_DOWNTIME_ALL = 2500
// Diviniation at 10s for TA and other opener bursts
const FIRST_USE_OFFSET_DIVINATION = 10000
// Damage doesn't come right away in every fight
const FIRST_USE_OFFSET_HEALS = 30000

// It's okay to delay CO a little to match damage but usage should still be maximized as it's on such a short CD
const ALLOWED_DOWNTIME_CELESTIAL_OPPOSITION = 15000

export default class OGCDDowntime extends CooldownDowntime {
	allowedDowntime = ALLOWED_DOWNTIME_ALL
	allowedDowntimePerOgcd = {
		[ACTIONS.CELESTIAL_OPPOSITION.id]: ALLOWED_DOWNTIME_CELESTIAL_OPPOSITION,
	}
	firstUseOffset = FIRST_USE_OFFSET_ALL
	firstUseOffsetPerOgcd = {
		[ACTIONS.DIVINATION.id]: FIRST_USE_OFFSET_DIVINATION,
		[ACTIONS.CELESTIAL_INTERSECTION.id]: FIRST_USE_OFFSET_HEALS,
		[ACTIONS.CELESTIAL_OPPOSITION.id]: FIRST_USE_OFFSET_HEALS,
	}

	trackedCds = [
		ACTIONS.DIVINATION.id,
		ACTIONS.CELESTIAL_INTERSECTION.id,
		ACTIONS.CELESTIAL_OPPOSITION.id,
		ACTIONS.NEUTRAL_SECT.id,
		ACTIONS.COLLECTIVE_UNCONSCIOUS.id,
	]
	target = TARGETPERCENT
	description = <Trans id="ast.ogcd-downtime.ogcd-cd-metric">Maximize usage of OGCDs to contribute to raid damage and reduce your need to GCD heal.</Trans>
}
