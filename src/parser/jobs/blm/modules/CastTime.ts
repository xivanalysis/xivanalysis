import {Event} from 'event'
import {filter} from 'parser/core/filter'
import CoreCastTime from 'parser/core/modules/CastTime'

export class CastTime extends CoreCastTime {
	private tcIndex: number | null = null

	override initialise() {
		super.initialise()

		const triplecastFilter = filter<Event>()
			.target(this.parser.actor.id)
			.status(this.data.statuses.TRIPLECAST.id)

		this.addEventHook(triplecastFilter.type('statusApply'), this.onApplyTriplecast)
		this.addEventHook(triplecastFilter.type('statusRemove'), this.onRemoveTriplecast)
	}

	private onApplyTriplecast(): void {
		this.onRemoveTriplecast() // Close the previous stack's adjustment before starting a new one
		this.tcIndex = this.setInstantCastAdjustment()
	}

	private onRemoveTriplecast(): void {
		this.reset(this.tcIndex)
		this.tcIndex = null
	}
}
