import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import {Death} from 'parser/core/modules/Death'

// Deaths from Final Sting and Self-Destruct should not count for
// the report.
// It would be nice to check for early stings here, but that would
// require comparing how much damage the sting did vs how much health
// the boss had left, which is too fight-specific.

export class BLUDeath extends Death {
	@dependency private mydata!: Data

	private isFinalSting = false

	override initialise() {
		super.initialise()
		this.addEventHook(filter<Event>().source(this.parser.actor.id).type('action')
			.action(oneOf([
				this.mydata.actions.FINAL_STING.id,
				this.mydata.actions.SELF_DESTRUCT.id,
			])), this.onFinalSting)
	}

	private onFinalSting() {
		this.isFinalSting = true
	}

	override shouldCountDeath(event: Events['actorUpdate']): boolean {
		if (event.actor !== this.parser.actor.id) {
			return true
		}
		if (this.isFinalSting) {
			this.isFinalSting = false
			return false
		}
		return true
	}
}

