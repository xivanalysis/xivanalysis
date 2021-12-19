import {Event} from 'event'
import {filter} from 'parser/core/filter'
import CastTime from 'parser/core/modules/CastTime'

export class Fuka extends CastTime {
	private fukaIndex: number | null = null

	override initialise() {
		super.initialise()

		const fukaFilter = filter<Event>()
			.target(this.parser.actor.id)
			.status(this.data.statuses.FUKA.id)

		this.addEventHook(fukaFilter.type('statusApply'), this.onApplyFuka)
		this.addEventHook(fukaFilter.type('statusRemove'), this.onRemoveFuka)
	}

	private onApplyFuka(): void {
		// If this is a reapply for a currently open Fuka window, do not reapply
		if (this.fukaIndex == null) {
			const fuka = this.data.statuses.FUKA
			this.fukaIndex = this.setPercentageAdjustment('all', fuka.speedModifier, 'both')
		}
	}

	private onRemoveFuka(): void {
		this.reset(this.fukaIndex)
		this.fukaIndex = null
	}
}
