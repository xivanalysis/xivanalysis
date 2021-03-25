import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES, {Status} from 'data/STATUSES'
import {Event, Events} from 'event'
import _ from 'lodash'
import {Actor} from 'report'
import {AdapterStep} from './base'

type StatusEvent = Events['statusApply'] | Events['statusRemove']
type StatusKey = keyof typeof STATUSES

// Statuses applied before the pull won't have an applyStatus event
// Fabricate status applications so modules don't need to take this into account
export class PrepullStatusAdapterStep extends AdapterStep {
	private observedActions = new Map<Actor['id'], Set<number>>()
	private observedStatuses = new Map<Actor['id'], Set<number>>()
	private precastEvents: Event[] = []

	postprocess(adaptedEvents: Event[]): Event[] {
		for (const event of adaptedEvents) {
			if (event.type !== 'statusApply' && event.type !== 'statusRemove') {
				if (event.type === 'action') {
					this.observeAction(event.action, event.source)
				}
				continue
			}

			const status = getDataBy(STATUSES, 'id', event.status)
			if (!status) {
				// No data for this status, skip to next event
				continue
			}

			if (event.type === 'statusApply') {
				this.synthesizeActionIfNew(event, status)
				this.observeStatus(event.status, event.source)

			} else if (event.type === 'statusRemove') {
				if (this.observedStatuses.get(event.source)?.has(status.id)) {
					// If we've already seen a matching apply event, skip
					continue
				}
				this.synthesizeActionIfNew(event, status)
				this.synthesizeStatusApply(event)
				this.observeStatus(event.status, event.source)
			}
		}

		return this.precastEvents.length > 0
			? [...this.precastEvents, ...adaptedEvents]
			: adaptedEvents
	}

	private observeAction(actionId: number, sourceId: Actor['id']) {
		if (!this.observedActions.has(sourceId)) {
			this.observedActions.set(sourceId, new Set())
		}

		const actions = this.observedActions.get(sourceId)
		actions?.add(actionId)
	}

	private observeStatus(statusId: number, sourceId: Actor['id']) {
		if (!this.observedStatuses.has(sourceId)) {
			this.observedStatuses.set(sourceId, new Set())
		}

		const statuses = this.observedStatuses.get(sourceId)
		statuses?.add(statusId)
	}

	private synthesizeActionIfNew(event: StatusEvent, status: Status) {
		const statusKey = _.findKey(STATUSES, status) as StatusKey | undefined
		if (!statusKey) {
			// This shouldn't be possible, but let's be safe and bail if there's no key
			return
		}

		const action = getDataBy(ACTIONS, 'statusesApplied', statusKey)
		if (!action) {
			// No action is known to apply this status, skip
			return
		}

		const observedActions = this.observedActions.get(event.source)

		if (observedActions?.has(action.id)) {
			// We've already seen an action that applies this status, skip
			return
		}

		const actionEvent: Events['action'] = {
			...event,
			type: 'action',
			action: action.id,
			timestamp: this.pull.timestamp,
		}

		this.precastEvents.push(actionEvent)
		this.observeAction(action.id, event.source)
	}

	private synthesizeStatusApply(event: StatusEvent) {
		const applyEvent: Events['statusApply'] = {
			...event,
			type: 'statusApply',
			timestamp: this.pull.timestamp,
		}

		this.precastEvents.push(applyEvent)
	}
}
