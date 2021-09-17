import {Event} from 'event'
import {filter} from 'parser/core/filter'
import CoreCastTime from 'parser/core/modules/CastTime'

export class CastTime extends CoreCastTime {
	private pomIndex: number | null = null

	override initialise() {
		super.initialise()

		const presenceOfMindFilter = filter<Event>()
			.target(this.parser.actor.id)
			.status(this.data.statuses.PRESENCE_OF_MIND.id)

		this.addEventHook(presenceOfMindFilter.type('statusApply'), this.onApplyPresence)
		this.addEventHook(presenceOfMindFilter.type('statusRemove'), this.onRemovePresence)
	}

	private onApplyPresence(): void {
		const presence = this.data.statuses.PRESENCE_OF_MIND
		this.pomIndex = this.setPercentageAdjustment('all', presence.speedModifier, 'both')
	}

	private onRemovePresence(): void {
		this.reset(this.pomIndex)
		this.pomIndex = null
	}
}
