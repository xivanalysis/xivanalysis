import {Event} from 'event'
import {filter} from 'parser/core/filter'
import CoreCastTime from 'parser/core/modules/CastTime'

export class CastTime extends CoreCastTime {
	private hobIndex: number | null = null

	override initialise() {
		super.initialise()

		const harmonyOfBodyFilter = filter<Event>()
			.target(this.parser.actor.id)
			.status(this.data.statuses.HARMONY_OF_BODY.id)

		this.addEventHook(harmonyOfBodyFilter.type('statusApply'), this.onApplyBody)
		this.addEventHook(harmonyOfBodyFilter.type('statusRemove'), this.onRemoveBody)
	}

	private onApplyBody(): void {
		const harmonyOfBody = this.data.statuses.HARMONY_OF_BODY
		this.hobIndex = this.setPercentageAdjustment('all', harmonyOfBody.speedModifier, 'both')
	}

	private onRemoveBody(): void {
		this.reset(this.hobIndex)
		this.hobIndex = null
	}
}
