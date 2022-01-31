import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

// Time that Jump deems ok for a OGCD to be down : ^)
const DEFAULT_ALLOWED_DOWNTIME = 1000
export class GeneralCDDowntime extends CooldownDowntime {
	override defaultAllowedAverageDowntime = DEFAULT_ALLOWED_DOWNTIME

	override trackedCds = [
		// With the changes to Acceleration, we have a lot of instances where we should hold the skill.
		// Since it's not really possible to always know when during analysis we give a blanket grace of 20 and
		// hope that it's accurate enough
		{
			cooldowns: [this.data.actions.ACCELERATION],
			allowedAverageDowntime: 4000,
		},
		{
			cooldowns: [this.data.actions.MANAFICATION],
			firstUseOffset: 17500,
		},
		{
			cooldowns: [this.data.actions.EMBOLDEN],
			firstUseOffset: 7500,
		},
		{
			cooldowns: [this.data.actions.FLECHE],
		},
		{
			cooldowns: [this.data.actions.CONTRE_SIXTE],
		},
		{
			cooldowns: [this.data.actions.CORPS_A_CORPS],
		},
		{
			cooldowns: [
				this.data.actions.ENGAGEMENT,
				this.data.actions.DISPLACEMENT,
			],
		},
	]
	override defensiveCooldowns = [
		{cooldowns: [this.data.actions.ADDLE]},
		{cooldowns: [this.data.actions.MAGICK_BARRIER]},
	]
}
