import {getDataArrayBy} from 'data'
import {getActions} from 'data/ACTIONS'
import {StatusKey, getStatuses} from 'data/STATUSES'
import {Event, Events} from 'event'
import _, {values} from 'lodash'
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
		// Lodash normally treats the first param of the memoized function as the key for the memo lookup
		// We want it to lookup by action+status combo instead
	}, (...args) => values(args).join('_'))

	private actionAppliedStatus(actionEvent: Events['action'], statusEvent: Events['statusApply']) {
		const sameSource = actionEvent.source === statusEvent.source
		return sameSource && this.canActionApplyStatus(actionEvent.action, statusEvent.status)
	}

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
				for (let actionIndex = index + 1; actionIndex < nodes.length; ++actionIndex) {
					const other = nodes[actionIndex]

					if (other.event.type === 'action' && this.actionAppliedStatus(other.event, event)) {
						other.after.push(event)
						node.isRoot = false
						break
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
