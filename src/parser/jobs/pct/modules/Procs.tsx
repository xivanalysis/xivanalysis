import {Events} from 'event'
import {dependency} from 'parser/core/Injectable'
import CastTime from 'parser/core/modules/CastTime'
import {ProcGroup, Procs as CoreProcs} from 'parser/core/modules/Procs'

// Rainbow Bright makes Rainbow Drip instant, and lowers the 6s recast to a normal 2.5s GCD
const RAINBOW_BRIGHT_RECAST_ADJUSTMENT = -3500

export default class Procs extends CoreProcs {
	@dependency castTime!: CastTime

	override trackedProcs = [
		{
			procStatus: this.data.statuses.AETHERHUES,
			consumeActions: [
				this.data.actions.AERO_IN_GREEN,
				this.data.actions.AERO_II_IN_GREEN,
				this.data.actions.STONE_IN_YELLOW,
				this.data.actions.STONE_II_IN_YELLOW,
			],
		},
		{
			procStatus: this.data.statuses.AETHERHUES_II,
			consumeActions: [
				this.data.actions.WATER_IN_BLUE,
				this.data.actions.WATER_II_IN_BLUE,
				this.data.actions.THUNDER_IN_MAGENTA,
				this.data.actions.THUNDER_II_IN_MAGENTA,
			],
		},
		{
			procStatus: this.data.statuses.HYPERPHANTASIA,
			consumeActions: [
				this.data.actions.FIRE_IN_RED,
				this.data.actions.FIRE_II_IN_RED,
				this.data.actions.BLIZZARD_IN_CYAN,
				this.data.actions.BLIZZARD_II_IN_CYAN,
				this.data.actions.AERO_IN_GREEN,
				this.data.actions.AERO_II_IN_GREEN,
				this.data.actions.STONE_IN_YELLOW,
				this.data.actions.STONE_II_IN_YELLOW,
				this.data.actions.WATER_IN_BLUE,
				this.data.actions.WATER_II_IN_BLUE,
				this.data.actions.THUNDER_IN_MAGENTA,
				this.data.actions.THUNDER_II_IN_MAGENTA,
				this.data.actions.HOLY_IN_WHITE,
				this.data.actions.COMET_IN_BLACK,
				this.data.actions.STAR_PRISM,
			],
		},
		{
			procStatus: this.data.statuses.HAMMER_TIME,
			consumeActions: [
				this.data.actions.HAMMER_STAMP,
				this.data.actions.HAMMER_BRUSH,
				this.data.actions.POLISHING_HAMMER,
			],
		},
		{
			procStatus: this.data.statuses.RAINBOW_BRIGHT,
			consumeActions: [
				this.data.actions.RAINBOW_DRIP,
			],
		},
		{
			procStatus: this.data.statuses.STARSTRUCK,
			consumeActions: [
				this.data.actions.STAR_PRISM,
			],
		},
	]

	protected override checkMayConsumeAdditionalProcs(_action: number): boolean {
		return true // Technically should probably have some logic here but it'll just be a minor performance loss, not a functional problem
	}

	protected override jobSpecificOnConsumeProc(procGroup: ProcGroup, event: Events['action']): void {
		// Rainbow bright changes Rainbow Drip from a 4s cast/6s recast to a standard instant GCD
		if (procGroup.procStatus.id === this.data.statuses.RAINBOW_BRIGHT.id) {
			this.castTime.setInstantCastAdjustment([this.data.actions.RAINBOW_DRIP.id], event.timestamp, event.timestamp)
			this.castTime.setRecastTimeAdjustment([this.data.actions.RAINBOW_DRIP.id], RAINBOW_BRIGHT_RECAST_ADJUSTMENT)
		}
	}

	protected override addJobSpecificSuggestions(): void {
		// Suggest something here
	}
}
