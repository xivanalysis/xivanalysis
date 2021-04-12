import {getDataArrayBy} from 'data'
import {layers as actionLayers, root as actionRoot} from 'data/ACTIONS'
import {getAppliedData, Layer} from 'data/layer'
import {Patch} from 'data/PATCHES'
import {layers as statusLayers, root as statusRoot, StatusKey} from 'data/STATUSES'
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

	postprocess(adaptedEvents: Event[]): Event[] {
		for (const event of adaptedEvents) {
			if (event.type !== 'statusApply' && event.type !== 'statusRemove') {
				if (event.type === 'action') {
					this.observeAction(event.action, event.source)
				}
				continue
			}

			if (event.type === 'statusApply') {
				this.synthesizeActionIfNew(event)
				this.observeStatus(event.status, event.target)

			} else if (event.type === 'statusRemove') {
				const statuses = this.observedStatuses.get(event.target)
				if (statuses && statuses.has(event.status)) {
					// If we've already seen a matching apply event, skip
					continue
				}
				this.synthesizeActionIfNew(event)
				this.synthesizeStatusApply(event)
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

	private synthesizeActionIfNew(event: StatusEvent) {
		const statusKey = _.findKey(this.getStatuses(), status => status.id === event.status) as StatusKey | undefined
		if (!statusKey) {
			// This shouldn't be possible, but let's be safe and bail if there's no key
			return
		}

		const actions = getDataArrayBy(this.getActions(), 'statusesApplied', statusKey)
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

		const actionEvent: Events['action'] = {
			...event,
			type: 'action',
			action: action.id,
			timestamp: this.pull.timestamp + PREPULL_OFFSETS.STATUS_ACTION,
		}

		this.precastEvents.push(actionEvent)
		this.observeAction(action.id, event.source)
	}

	private synthesizeStatusApply(event: StatusEvent) {
		const applyEvent: Events['statusApply'] = {
			...event,
			type: 'statusApply',
			timestamp: this.pull.timestamp + PREPULL_OFFSETS.STATUS_APPLY,
		}

		this.precastEvents.push(applyEvent)
	}

	// TODO: If these are needed in >1 adapter, lift to a generalised location
	private patch = new Patch(this.report.edition, this.report.timestamp / 1000)

	private getActions = () => this.getAppliedData(actionRoot, actionLayers)
	private getStatuses = () => this.getAppliedData(statusRoot, statusLayers)

	private getAppliedData<R extends object>(root: R, layers: Array<Layer<R>>) {
		return getAppliedData({
			root,
			layers,
			state: {patch: this.patch},
		})
	}
}
