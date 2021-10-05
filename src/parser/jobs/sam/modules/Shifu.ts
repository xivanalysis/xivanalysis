import {Event} from 'event'
import {filter} from 'parser/core/filter'
import CastTime from 'parser/core/modules/CastTime'

export class Shifu extends CastTime {
	private shifuIndex: number | null = null

	override initialise() {
		super.initialise()

		const shifuFilter = filter<Event>()
			.target(this.parser.actor.id)
			.status(this.data.statuses.SHIFU.id)

		this.addEventHook(shifuFilter.type('statusApply'), this.onApplyShifu)
		this.addEventHook(shifuFilter.type('statusRemove'), this.onRemoveShifu)
	}

	private onApplyShifu(): void {
		// If this is a reapply for a currently open Shifu window, do not reapply
		if (this.shifuIndex == null) {
			const shifu = this.data.statuses.SHIFU
			this.shifuIndex = this.setPercentageAdjustment('all', shifu.speedModifier, 'both')
		}
	}

	private onRemoveShifu(): void {
		this.reset(this.shifuIndex)
		this.shifuIndex = null
	}
}
