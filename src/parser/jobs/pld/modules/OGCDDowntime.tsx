import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

// Allowed downtime set to 2s to account for PLD's natural rotation drift.
const ALLOWED_DOWNTIME_FOF = 2000
const ALLOWED_DOWNTIME_REQ = 2000

const FIRST_USE_OFFSET_REQ = 15000

export class OGCDDowntime extends CooldownDowntime {
	static override debug = false
	trackedCds = [
		{
			cooldowns: [this.data.actions.FIGHT_OR_FLIGHT],
			allowedAverageDowntime: ALLOWED_DOWNTIME_FOF,
		},
		{
			cooldowns: [this.data.actions.REQUIESCAT],
			allowedAverageDowntime: ALLOWED_DOWNTIME_REQ,
			firstUseOffset: FIRST_USE_OFFSET_REQ,
		},
		{cooldowns: [this.data.actions.EXPIACION]},
		{cooldowns: [this.data.actions.CIRCLE_OF_SCORN]},
		{
			cooldowns: [this.data.actions.INTERVENE],
			firstUseOffset: 15000,
		},
	]
}
