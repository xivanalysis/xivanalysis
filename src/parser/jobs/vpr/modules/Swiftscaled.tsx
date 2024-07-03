import {Event} from 'event'
import {filter} from 'parser/core/filter'
import CastTime from 'parser/core/modules/CastTime'

export class Swiftscaled extends CastTime {
	private SwiftscaledIndex: number | null = null

	override initialise() {
		super.initialise()

		const fukaFilter = filter<Event>()
			.target(this.parser.actor.id)
			.status(this.data.statuses.SWIFTSCALED.id)

		this.addEventHook(fukaFilter.type('statusApply'), this.onApplySwiftscaled)
		this.addEventHook(fukaFilter.type('statusRemove'), this.onRemoveSwiftscaled)
	}

	private onApplySwiftscaled(): void {
		// If this is a reapply for a currently open Fuka window, do not reapply
		if (this.SwiftscaledIndex == null) {
			const swiftscaled = this.data.statuses.SWIFTSCALED
			this.SwiftscaledIndex = this.setPercentageAdjustment('all', swiftscaled.speedModifier, 'both')
		}
	}

	private onRemoveSwiftscaled(): void {
		this.reset(this.SwiftscaledIndex)
		this.SwiftscaledIndex = null
	}
}
