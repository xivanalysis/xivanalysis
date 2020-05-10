import {Trans} from '@lingui/react'
import ACTIONS from 'data/ACTIONS'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'
import React from 'react'

// Strict downtime allowance for drill/bio blaster/air anchor
const DOWNTIME_ALLOWED_GCD = 100

export default class GeneralCDDowntime extends CooldownDowntime {
	trackedCds = [ {
		cooldowns: [ACTIONS.WILDFIRE],
		firstUseOffset: 10000,
	}, {
		cooldowns: [ACTIONS.BARREL_STABILIZER],
		firstUseOffset: 3000,
	}, {
		cooldowns: [ACTIONS.REASSEMBLE],
		allowedAverageDowntime: 5000,
		firstUseOffset: 0,
	}, {
		cooldowns: [ACTIONS.AIR_ANCHOR],
		allowedAverageDowntime: DOWNTIME_ALLOWED_GCD,
		firstUseOffset: 9000,
		// isAffectedBySpeed: true,
	}, {
		cooldowns: [
			ACTIONS.DRILL,
			ACTIONS.BIOBLASTER,
		],
		allowedAverageDowntime: DOWNTIME_ALLOWED_GCD,
		firstUseOffset: 0,
		// isAffectedBySpeed: true,
	}, {
		cooldowns: [ACTIONS.GAUSS_ROUND],
		firstUseOffset: 3000,
		resetBy: {actions: [ACTIONS.HEAT_BLAST], refundAmount: 15000},
	}, {
		cooldowns: [ACTIONS.RICOCHET],
		firstUseOffset: 3000,
		resetBy: {actions: [ACTIONS.HEAT_BLAST], refundAmount: 15000},
	}]

	checklistName = <Trans id="mch.cooldownDowntime.name">Use your cooldowns</Trans>
	checklistDescription = <Trans id="mch.cooldownDowntime.suggestion">
		Always make sure to use your abilities when they are available, but do not clip or delay your GCD to use them.
	</Trans>
}
