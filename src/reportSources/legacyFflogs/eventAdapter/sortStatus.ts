import {getDataArrayBy} from 'data'
import {getActions} from 'data/ACTIONS'
import {StatusKey, getStatuses} from 'data/STATUSES'
import {Event, Events} from 'event'
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

	private actionAppliedStatus(actionEvent: Events['action'], statusEvent: Events['statusApply']) {
		const sameSource = actionEvent.source === statusEvent.source
		return sameSource && this.canActionApplyStatus(actionEvent.action, statusEvent.status)
	}

	private getNode(cache: Record<number, EventNode>, index: number, event: Event) {
		if (index in cache) {
			return cache[index]
		}

		const newNode = {
			event: event,
			isRoot: true,
			after: [],
		}

		cache[index] = newNode
		return newNode
	}

	private sortTimestampBucket(events: Event[]): Event[] {
		const nodes: EventNode[] = []
		const nodeCache: Record<number, EventNode> = {}

		for (const [index, event] of events.entries()) {
			const node = this.getNode(nodeCache, index, event)

			if (event.type === 'statusApply') {
				// Sorts the event after its corresponding action event
				for (let actionIndex = index + 1; actionIndex < events.length; ++actionIndex) {
					const other = events[actionIndex]

					if (other.type === 'action' && this.actionAppliedStatus(other, event)) {
						const actionNode = this.getNode(nodeCache, actionIndex, other)
						actionNode.after.push(event)
						node.isRoot = false
						break
					}
				}
			}

			nodes.push(node)
		}

		return nodes.reduce((events: Event[], node) => node.isRoot
			? events.concat(node.event, ...node.after)
			: events
		, [])
	}
}
