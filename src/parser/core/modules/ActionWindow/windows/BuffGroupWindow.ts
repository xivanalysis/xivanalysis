import {Status} from 'data/STATUSES'
import {Events} from 'event'
import {BuffWindow} from './BuffWindow'

export type StatusEvents = {
	apply: Events['statusApply']
	remove?: Events['statusRemove']
}
/**
 * Tracks actions that occur while multiple buff statuses are simultaneously active on the player.
 */
export abstract class BuffGroupWindow extends BuffWindow {

	private activeStatuses: Map<number, Events['statusApply']> = new Map()
	private overlapInProgress: boolean = false

	abstract override buffStatus: Status[]
	protected failedOverlapStarts: Array<Events['statusApply']> = []

	override initialise() {
		super.initialise()
	}

	private areAllStatusesPresent = () => this.buffStatus.map(it => it.id).every(status => this.activeStatuses.has(status))
	private isBuffStatus = (event: Events['statusApply' | 'statusRemove']) => this.buffStatus.map(it => it.id).includes(event.status)

	protected override onStatusApply(event: Events['statusApply']) {
		if (!this.isBuffStatus(event)) {
			return
		}

		// Always adds the status to the map
		this.activeStatuses.set(event.status, event)
		this.overlapInProgress = true

		// Only open a window if all statuses are present
		if (this.areAllStatusesPresent()) {
			this.overlapInProgress = false
			super.onStatusApply(event)
		}
	}

	protected override onStatusRemove(event: Events['statusRemove']) {
		if (!this.isBuffStatus(event)) {
			return
		}

		const apply = this.activeStatuses.get(event.status)

		// Only close a window if all statuses are present and there's a window open
		// (probably redundant checks?)
		if (this.areAllStatusesPresent() && this.history.getCurrent()) {
			super.onStatusRemove(event)
			this.overlapInProgress = false
		} else if (this.overlapInProgress) {
			// If a buff is removed while overlap is still in progress,
			// this is a bad overlap buff window
			if (apply) {
				this.failedOverlapStarts.push(apply)
			}
		}

		// Always removes the status from the map
		this.activeStatuses.delete(event.status)

		if (this.activeStatuses.size === 0) {
			this.overlapInProgress = false
		}
	}
}
