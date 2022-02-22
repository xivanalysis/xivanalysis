import {getDataArrayBy} from 'data'
import {getActions} from 'data/ACTIONS'
import {StatusKey, getStatuses} from 'data/STATUSES'
import {Event, Events} from 'event'
import _ from 'lodash'
import {AdapterStep} from './base'

type EventSequenceKey = `${number}-${string}`

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

		return sortedEvents
	}

	private getSequenceKey = (action: number, source: string) =>
		<EventSequenceKey> `${action}-${source}`

	private getPossibleStatusKeys(event: Events['statusApply']): EventSequenceKey[] | undefined {
		const statusKey = _.findKey(getStatuses(this.report), status => status.id === event.status) as StatusKey | undefined

		// This shouldn't be possible, but bail if we don't find a matching status
		if (!statusKey) { return }

		const applyingActions = getDataArrayBy(getActions(this.report), 'statusesApplied', statusKey)

		// No actions are known to apply this status, so no need to sequence this event
		if (applyingActions.length === 0) { return }

		return applyingActions.map(action => this.getSequenceKey(action.id, event.source))
	}

	private sortTimestampBucket(events: Event[]): Event[] {
		const sortedEvents: Event[] = []
		const eventSequences: Map<EventSequenceKey, Event[]> = new Map()
		const rootEvents: Event[] = []

		// Build sequences of action -> status events
		for (const event of events.slice().reverse()) {
			if (event.type === 'action') {
				eventSequences.set(this.getSequenceKey(event.action, event.source), [event])
				rootEvents.push(event)

			} else if (event.type === 'statusApply') {
				const possibleKeys = this.getPossibleStatusKeys(event)
				const applyingActionKey = possibleKeys?.find(key => eventSequences.has(key))

				if (applyingActionKey != null) {
					const sequence = eventSequences.get(applyingActionKey)
					sequence?.push(event)

				} else {
					// An applying action does not exist or is already in the correct order,
					// so no need to sort this event
					rootEvents.push(event)
				}

			} else {
				rootEvents.push(event)
			}
		}

		for (const event of rootEvents.reverse()) {
			if (event.type === 'action') {
				const key = this.getSequenceKey(event.action, event.source)
				const sequence = eventSequences.get(key)

				if (sequence != null) {
					sortedEvents.push(...sequence)
				}

			} else {
				sortedEvents.push(event)
			}
		}

		return sortedEvents
	}
}
