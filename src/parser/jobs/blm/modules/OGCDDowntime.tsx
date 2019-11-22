import {Trans} from '@lingui/react'
import ACTIONS from 'data/ACTIONS'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'
import React from 'react'

const ALLOWEDDOWNTIMEALL = 1250
const FIRSTUSEOFFSETALL = 15000
const TARGETPERCENT = 95

export default class OGCDDowntime extends CooldownDowntime {
	// Time in ms that Laqi deems ok for a OGCD to be down : ^)
	defaultAllowedAverageDowntimeDowntime = ALLOWEDDOWNTIMEALL
	defaultFirstUseOffset = FIRSTUSEOFFSETALL
	trackedCds = [
		{cooldowns: [ACTIONS.LEY_LINES]},
		{cooldowns: [ACTIONS.SHARPCAST]},
		{
			cooldowns: [ACTIONS.MANAFONT],
			firstUseOffset: 25000,
		},
		{cooldowns: [ACTIONS.TRIPLECAST]},
	]

	checklistTarget = TARGETPERCENT
	checklistDescription = <Trans id="blm.ogcd-downtime.ogcd-cd-metric">Always make sure to use your OGCDs when they are up but don't clip them. Utilize your procs or fast Blizzard IIIs or Fire IIIs to weave them. <Trans id="blm.ogcd-downtime.ogcd-cd-buffer">To account for random factors you are given a buffer of {ALLOWEDDOWNTIMEALL} seconds per instance to hold your cooldowns.</Trans></Trans>
}
