import {getDataBy, getDataArrayBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES, {Status, StatusKey} from 'data/STATUSES'
import {Event, Events} from 'event'
import _ from 'lodash'
import {Actor} from 'report'
import {AdapterStep} from './base'

type StatusEvent = Events['statusApply'] | Events['statusRemove']

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
				this.observeStatus(status.id, event.target)

			} else if (event.type === 'statusRemove') {
				const statuses = this.observedStatuses.get(event.target)
				if (statuses && statuses.has(status.id)) {
					// If we've already seen a matching apply event, skip
					continue
				}
				this.synthesizeActionIfNew(event, status)
				this.synthesizeStatusApply(event)
				this.observeStatus(status.id, event.target)
			}
		}

		return this.precastEvents.length > 0
			? [...this.precastEvents, ...adaptedEvents]
			: adaptedEvents
	}

	private observeAction(actionId: number, sourceId: Actor['id']) {
		let actions = this.observedActions.get(sourceId)
		if (actions == null) {
			actions = new Set()
			this.observedActions.set(sourceId, actions)
		}
		actions.add(actionId)
	}

	private observeStatus(statusId: number, targetId: Actor['id']) {
		let statuses = this.observedStatuses.get(targetId)
		if (statuses == null) {
			statuses = new Set()
			this.observedStatuses.set(targetId, statuses)
		}
		statuses.add(statusId)
	}

	private synthesizeActionIfNew(event: StatusEvent, status: Status) {
		const statusKey = _.findKey(STATUSES, status) as StatusKey | undefined
		if (!statusKey) {
			// This shouldn't be possible, but let's be safe and bail if there's no key
			return
		}

		const actions = getDataArrayBy(ACTIONS, 'statusesApplied', statusKey)
		if (!actions || actions.length > 1) {
			// No action is known to apply this status OR
			// multiple actions can apply this status, not enough info to synth
			return
		}

		const action = actions[0]
		const observedActions = this.observedActions.get(event.source)

		if (observedActions?.has(action.id) ?? false) {
			// We've already seen an action that applies this status, skip
			return
		}

		const actionEvent: Events['action'] = {
			...event,
			type: 'action',
			action: action.id,
			timestamp: this.pull.timestamp - 2,
		}

		this.precastEvents.push(actionEvent)
		this.observeAction(action.id, event.source)
	}

	private synthesizeStatusApply(event: StatusEvent) {
		const applyEvent: Events['statusApply'] = {
			...event,
			type: 'statusApply',
			timestamp: this.pull.timestamp - 1,
		}

		this.precastEvents.push(applyEvent)
	}
}
