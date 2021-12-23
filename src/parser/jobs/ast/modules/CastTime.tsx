import {Event} from 'event'
import {filter} from 'parser/core/filter'
import CoreCastTime from 'parser/core/modules/CastTime'

export class CastTime extends CoreCastTime {
	private pomIndex: number | null = null

	override initialise() {
		super.initialise()

		const presenceOfMindFilter = filter<Event>()
			.target(this.parser.actor.id)
			.status(this.data.statuses.HARMONY_OF_BODY.id)

		this.addEventHook(presenceOfMindFilter.type('statusApply'), this.onApplyBody)
		this.addEventHook(presenceOfMindFilter.type('statusRemove'), this.onRemoveBody)
	}

	private onApplyBody(): void {
		const harmonyOfBody = this.data.statuses.HARMONY_OF_BODY
		this.pomIndex = this.setPercentageAdjustment('all', harmonyOfBody.speedModifier, 'both')
	}

	private onRemoveBody(): void {
		this.reset(this.pomIndex)
		this.pomIndex = null
	}
}
