import {Event} from 'event'
import {filter} from 'parser/core/filter'
import CoreCastTime from 'parser/core/modules/CastTime'

export class CastTime extends CoreCastTime {
	private reqIndex: number | null = null

	override initialise() {
		super.initialise()

		const requiescatFilter = filter<Event>()
			.target(this.parser.actor.id)
			.status(this.data.statuses.REQUIESCAT.id)

		this.addEventHook(requiescatFilter.type('statusApply'), this.onApplyReq)
		this.addEventHook(requiescatFilter.type('statusRemove'), this.onRemoveReq)
	}

	private onApplyReq(): void {
		this.reqIndex = this.setInstantCastAdjustment()
	}

	private onRemoveReq(): void {
		this.reset(this.reqIndex)
		this.reqIndex = null
	}
}
