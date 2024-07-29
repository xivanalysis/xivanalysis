import {getDataArrayBy, getDataBy} from 'data'
import {getActions} from 'data/ACTIONS'
import {StatusKey, getStatuses} from 'data/STATUSES'
import {Event, Events} from 'event'
import _ from 'lodash'
import {Actor} from 'report'
import {AdapterStep, PREPULL_OFFSETS} from './base'

type StatusEvent = Events['statusApply'] | Events['statusRemove']

// Statuses applied before the pull won't have an applyStatus event
// Fabricate status applications so modules don't need to take this into account
export class PrepullStatusAdapterStep extends AdapterStep {
	private observedActions = new Map<Actor['id'], Set<number>>()
	private observedStatuses = new Map<Actor['id'], Set<number>>()
	private precastEvents: Event[] = []

	static override debug = false

	override postprocess(adaptedEvents: Event[], firstEvent: number): Event[] {
		for (const event of adaptedEvents) {
			if (event.type !== 'statusApply' && event.type !== 'statusRemove') {
				if (event.type === 'action') {
					this.observeAction(event.action, event.source)
				}
				continue
			}

			if (event.type === 'statusApply') {
				const observed = this.observedStatuses.get(event.target)
				if (observed && observed.has(event.status)) {
					// If we've already seen a matching apply event, skip
					continue
				}

				this.debug(`Timestamp ${event.timestamp}: Saw first statusApply for status ${event.status} on target ${event.target}`)
				this.synthesizeActionIfNew(event, firstEvent)

				// If the first observed instance of a status that is applied
				// with stacks has fewer than the applied value, synth an apply
				// apply with max stacks.
				const applied = getDataBy(getStatuses(this.report), 'id', event.status)
				if (applied != null && applied.stacksApplied != null && applied.stacksApplied > 0 &&
					event.data != null && event.data < applied.stacksApplied) {
					this.synthesizeStatusApply(event, firstEvent, applied.stacksApplied)
				}

				this.observeStatus(event.status, event.target)

			} else if (event.type === 'statusRemove') {
				const statuses = this.observedStatuses.get(event.target)
				if (statuses && statuses.has(event.status)) {
					// If we've already seen a matching apply event, skip
					continue
				}
				this.synthesizeActionIfNew(event, firstEvent)
				this.synthesizeStatusApply(event, firstEvent)
				this.observeStatus(event.status, event.target)
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

	private synthesizeActionIfNew(event: StatusEvent, firstEvent: number) {
		const statusKey = _.findKey(getStatuses(this.report), status => status.id === event.status) as StatusKey | undefined
		if (!statusKey) {
			// This shouldn't be possible, but let's be safe and bail if there's no key
			return
		}

		const actions = getDataArrayBy(getActions(this.report), 'statusesApplied', statusKey)
		if (actions.length !== 1) {
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

		this.debug(`Timestamp ${event.timestamp}: Found unmatched application of ${statusKey} on ${event.target} - synthesizing action ${action.name}`)

		const actionEvent: Events['action'] = {
			...event,
			type: 'action',
			action: action.id,
			timestamp: firstEvent + PREPULL_OFFSETS.STATUS_ACTION,
		}

		this.precastEvents.push(actionEvent)
		this.observeAction(action.id, event.source)
	}

	private synthesizeStatusApply(event: StatusEvent, firstEvent: number, stacks?: number) {
		const applyEvent: Events['statusApply'] = {
			...event,
			type: 'statusApply',
			timestamp: firstEvent + PREPULL_OFFSETS.STATUS_APPLY,
		}
		if (stacks != null) {
			applyEvent.data = stacks
		}

		this.precastEvents.push(applyEvent)
	}
}
