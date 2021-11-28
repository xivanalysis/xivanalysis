import {Trans} from '@lingui/react'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'
import React from 'react'

// due to our limited weaving capabilities we'll allow a downtime of 5000ms or about 2 GCDs
const ALLOWEDDOWNTIMEALL = 5000
const FIRSTUSEOFFSETALL = 15000
const TARGETPERCENT = 95

export class OGCDDowntime extends CooldownDowntime {
	// Time in ms that Laqi deems ok for a OGCD to be down : ^)
	override defaultAllowedAverageDowntime = ALLOWEDDOWNTIMEALL
	override defaultFirstUseOffset = FIRSTUSEOFFSETALL
	trackedCds = [
		{cooldowns: [this.data.actions.LEY_LINES]},
		{
			cooldowns: [this.data.actions.MANAFONT],
			firstUseOffset: 25000,
		},
		{cooldowns: [this.data.actions.TRIPLECAST]},
		{cooldowns: [this.data.actions.AMPLIFIER]},
		{cooldowns: [this.data.actions.SHARPCAST]},
	]

	override checklistTarget = TARGETPERCENT
	override checklistDescription = <Trans id="blm.ogcd-downtime.ogcd-cd-metric">Always make sure to use your OGCDs when they are up but don't clip them. Utilize your procs or fast Blizzard IIIs or Fire IIIs to weave them. <Trans id="blm.ogcd-downtime.ogcd-cd-buffer">To account for random factors you are given a buffer of {ALLOWEDDOWNTIMEALL/1000} seconds per instance to hold your cooldowns.</Trans></Trans>
}
