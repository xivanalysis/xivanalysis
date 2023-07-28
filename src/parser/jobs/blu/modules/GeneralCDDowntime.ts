import {Events} from 'event'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

const DEFAULT_ALLOWED_DOWNTIME = 1000
const MAX_WINGED_STACKS_BEFORE_CD = 3
export class GeneralCDDowntime extends CooldownDowntime {
	override defaultAllowedAverageDowntime = DEFAULT_ALLOWED_DOWNTIME

	@dependency private actors!: Actors

	override countUsage(e: Events['action']): boolean {
		const actionId = e.action
		if (actionId !== this.data.actions.WINGED_REPROBATION.id) {
			return true
		}
		const wingedReprobationStacks = this.actors.current.getStatusData(this.data.statuses.WINGED_REPROBATION.id) ?? 0
		if (wingedReprobationStacks < MAX_WINGED_STACKS_BEFORE_CD) {
			return false
		}
		return true
	}

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
			cooldowns: [this.data.actions.FEATHER_RAIN, this.data.actions.ERUPTION],
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
			cooldowns: [this.data.actions.SEA_SHANTY],
			firstUseOffset: 12500,
		},
		{
			cooldowns: [this.data.actions.BEING_MORTAL, this.data.actions.APOKALYPSIS],
			// If they are taking Apokalypsis, they may be holding it until the odd-minute burst
			firstUseOffset: 75000,
		},
		{
			cooldowns: [this.data.actions.J_KICK, this.data.actions.QUASAR],
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
			cooldowns: [this.data.actions.WINGED_REPROBATION],
			firstUseOffset: 35000, // First use will at best be during MF, but the cooldown won't trigger until after
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
	override suggestionOnlyCooldowns = [
		{cooldowns: [this.data.actions.MATRA_MAGIC]},
		{cooldowns: [this.data.actions.DRAGON_FORCE]},
		{cooldowns: [this.data.actions.ANGELS_SNACK]},
	]

	override onComplete() {
		this.trackedCds = this.trackedCds.filter(cdGroup => this.calculateUsageCount(cdGroup) !== 0)
		return super.onComplete()
	}
}
