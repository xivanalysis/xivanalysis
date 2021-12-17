import {Event} from 'event'
import {filter} from 'parser/core/filter'
import CoreCastTime from 'parser/core/modules/CastTime'

export class CastTime extends CoreCastTime {
	private accelerationIndex: number | null = null

	override initialise() {
		super.initialise()

		const accelerationFilter = filter<Event>()
			.target(this.parser.actor.id)
			.status(this.data.statuses.ACCELERATION.id)

		this.addEventHook(accelerationFilter.type('statusApply'), this.onApplyAcceleration)
		this.addEventHook(accelerationFilter.type('statusRemove'), this.onRemoveAcceleration)
	}

	private onApplyAcceleration(): void {
		this.onRemoveAcceleration() // Close the previous stack's adjustment before starting a new one
		this.accelerationIndex = this.setInstantCastAdjustment([
			this.data.actions.VERAERO.id,
			this.data.actions.VERAERO_III.id,
			this.data.actions.VERTHUNDER.id,
			this.data.actions.VERTHUNDER_III.id,
			this.data.actions.SCATTER.id,
			this.data.actions.IMPACT.id,
		])
	}

	private onRemoveAcceleration(): void {
		this.reset(this.accelerationIndex)
		this.accelerationIndex = null
	}
}
