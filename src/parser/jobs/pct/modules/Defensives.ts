import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {Defensives as CoreDefensives} from 'parser/core/modules/Defensives'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export class Defensives extends CoreDefensives {
	static override displayOrder = DISPLAY_ORDER.DEFENSIVES

	protected override trackedDefensives = [this.data.actions.TEMPERA_COAT]

	private lastShieldApplyStatusId: number | null = null
	private lastShieldApplyTimestamp: number | null = null

	private tempuraRefundAmounts = {
		[this.data.statuses.TEMPERA_COAT.id]: 60000,
		[this.data.statuses.TEMPERA_GRASSA.id]: 30000,
	}

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		const statusApplyFilter = playerFilter.type('statusApply')
		const statusRemoveFilter = playerFilter.type('statusRemove')

		this.addEventHook(statusApplyFilter.status(this.data.statuses.TEMPERA_COAT.id), this.onApplyShield)
		this.addEventHook(statusRemoveFilter.status(this.data.statuses.TEMPERA_COAT.id), this.onRemoveShield)

		this.addEventHook(statusApplyFilter.status(this.data.statuses.TEMPERA_GRASSA.id), this.onApplyShield)
		this.addEventHook(statusRemoveFilter.status(this.data.statuses.TEMPERA_GRASSA.id), this.onRemoveShield)
	}

	private onApplyShield(event: Events['statusApply']) {
		this.lastShieldApplyStatusId = event.status
		this.lastShieldApplyTimestamp = event.timestamp
	}

	private onRemoveShield(event: Events['statusRemove']) {
		this.addTimestampHook(event.timestamp + 1, () => this.onResolveShield(event))
	}

	private onResolveShield(event: Events['statusRemove']) {
		// If the shield we're resolving wasn't the last one the player applied (ie. they used Tempura Grassa and we're resolving Coat), bail
		if (event.status !== this.lastShieldApplyStatusId) { return }

		// Check to see how long this shield was applied for
		const shieldDuration = event.timestamp - (this.lastShieldApplyTimestamp ?? this.parser.currentEpochTimestamp)

		// If the shield lasted less than the full duration, and the status remove event indicates there is no shield remaining, it broke
		if ((event.remainingShield != null && event.remainingShield === 0) && shieldDuration < (this.data.getStatus(event.status)?.duration ?? 0)) {
			// Refund the proper amount of Tempura Coat's cooldown based on which shield broke
			this.cooldowns.reduce(this.data.actions.TEMPERA_COAT, this.tempuraRefundAmounts[event.status])
		}
	}
}
