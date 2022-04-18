import {getDataArrayBy} from 'data'
import {getActions} from 'data/ACTIONS'
import {StatusKey, getStatuses} from 'data/STATUSES'
import {Event} from 'event'
import _ from 'lodash'
import {AdapterStep} from './base'

interface EventNode {
	event: Event
	isRoot: boolean
	after: Event[]
}

export class SortStatusAdapterStep extends AdapterStep {
	override postprocess(adaptedEvents: Event[]): Event[] {
		const sortedEvents: Event[] = []
		let currentEvents: Event[] = []

		for (const event of adaptedEvents) {
			if (currentEvents.length === 0 || event.timestamp === currentEvents[0].timestamp) {
				currentEvents.push(event)
			} else {
				sortedEvents.push(...this.sortTimestampBucket(currentEvents))
				currentEvents = [event]
			}
		}

		sortedEvents.push(...this.sortTimestampBucket(currentEvents))

		return sortedEvents
	}

	private canActionApplyStatus = _.memoize((action: number, status: number) => {
		const statusKey = _.findKey(getStatuses(this.report), other => status === other.id) as StatusKey | undefined

		// This shouldn't be possible, but bail if we don't find a matching status
		if (statusKey == null) { return false }

		const applyingActions = getDataArrayBy(getActions(this.report), 'statusesApplied', statusKey)

		return applyingActions.some(other => action === other.id)
	})

	private sortTimestampBucket(events: Event[]): Event[] {
		const nodes: EventNode[] = events.map(event => ({
			event: event,
			isRoot: true,
			after: [],
		}))

		for (const [index, node] of nodes.entries()) {
			const event = node.event

			if (event.type === 'statusApply') {
				// Sorts the event after its corresponding action event
				for (const other of nodes.slice(index + 1)) {
					if (other.event.type === 'action' && this.canActionApplyStatus(other.event.action, event.status)) {
						other.after.push(event)
						node.isRoot = false
					}
				}
			}
		}

		return nodes.reduce((events: Event[], node) => node.isRoot
			? events.concat(node.event, ...node.after)
			: events
		, [])
	}
}
