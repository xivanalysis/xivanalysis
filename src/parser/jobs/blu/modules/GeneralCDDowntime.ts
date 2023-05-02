import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

const DEFAULT_ALLOWED_DOWNTIME = 1000
export class GeneralCDDowntime extends CooldownDowntime {
	override defaultAllowedAverageDowntime = DEFAULT_ALLOWED_DOWNTIME

	override trackedCds = [
		{
			cooldowns: [this.data.actions.NIGHTBLOOM],
			firstUseOffset: 5000,
		},
		{
			cooldowns: [this.data.actions.PHANTOM_FLURRY],
			firstUseOffset: 19000,
		},
		{
			cooldowns: [this.data.actions.FEATHER_RAIN],
			firstUseOffset: 15000,
		},
		{
			cooldowns: [this.data.actions.SHOCK_STRIKE],
			firstUseOffset: 15000,
		},
		{
			cooldowns: [this.data.actions.GLASS_DANCE],
			firstUseOffset: 12500,
			allowedAverageDowntime: 30000, // DPS gain to hold this until the Moon Flute window
		},
		{
			cooldowns: [this.data.actions.J_KICK],
			firstUseOffset: 2500,
		},
		{
			cooldowns: [this.data.actions.TRIPLE_TRIDENT],
			firstUseOffset: 2500,
			allowedAverageDowntime: 30000, // DPS gain for Crit builds to hold this until the Moon Flute window
		},
		{
			cooldowns: [this.data.actions.THE_ROSE_OF_DESTRUCTION],
			firstUseOffset: 5000,
		},
		{
			cooldowns: [this.data.actions.COLD_FOG],
			firstUseOffset: 30000, // some time after the opener
		},
		{
			cooldowns: [
				this.data.actions.OFF_GUARD,
				this.data.actions.PECULIAR_LIGHT,
			],
			firstUseOffset: 50000, // up to 50 seconds into the pull, if people are staggering their buffs
		},
	]
	override defensiveCooldowns = [
		{cooldowns: [this.data.actions.ADDLE]},
		{cooldowns: [this.data.actions.MAGIC_HAMMER]},
	]
}
