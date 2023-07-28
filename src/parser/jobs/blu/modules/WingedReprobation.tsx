import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Cooldowns} from 'parser/core/modules/Cooldowns'
import {Data} from 'parser/core/modules/Data'

// Winged Reprobation (spell #118) works weird.  The description
// says it is a 1s cast time, 90s cooldown GCD.
//
// But when you cast it, you get a stack of a buff. When you get
// that buff, it resets the cooldown of Winged Reprobation, up to
// 4 stacks -- when you get 4 stacks, you lose the buff and the
// cooldown actually happens.
//
// So if we're getting the Winged Reprobation buff, and it's
// not the 4-stack version, then reset the skill's cooldown.

const MAX_WINGED_REPROBATION_STACKS = 4

export class WingedReprobation extends Analyser {
	static override handle = 'wingedprobation'

	@dependency private data!: Data
	@dependency private cooldowns!: Cooldowns

	override initialise() {
		super.initialise()

		const wingedActorFilter = filter<Event>()
			.source(this.parser.actor.id)
			.type('statusApply')
			.status(this.data.statuses.WINGED_REPROBATION.id)

		this.addEventHook(wingedActorFilter, this.onApplyWingedReprobation)
	}

	private onApplyWingedReprobation(event: Events['statusApply']) {
		const stacks = event.data ?? 1
		if (stacks === MAX_WINGED_REPROBATION_STACKS) {
			// In-game, you get the 4th stack and it immediately drops off and you
			// get Winged Redemption.
			// The logs don't seem to reflect this -- they show up to the third stack,
			// but no data: 4 in there.
			// Still, handle the case very simply, by not resetting the cooldown
			return
		}
		this.cooldowns.reset('WINGED_REPROBATION')
	}
}
