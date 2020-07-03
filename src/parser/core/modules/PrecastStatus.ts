import Module, {dependency} from 'parser/core/Module'
import {Event} from 'events'
import {Data} from 'parser/core/modules/Data'
import {Status} from 'data/STATUSES'
import {AbilityEvent, CastEvent} from 'fflogs'

const trackedBuffEventTypes = ['applybuff', 'applybuffstack', 'removebuff', 'removebuffstack', 'refreshbuff']
const isTrackedBuffEvent = (event: Event): event is AbilityEvent => (trackedBuffEventTypes.includes(event.type as string))
// Statuses applied before the pull won't have an apply(de)?buff event
// Fake buff applications so modules don't need to take it into account
export class PrecastStatus extends Module {
	static handle = 'precastStatus'
	static debug = false

	@dependency private data!: Data

	private trackedStatuses = new Map<number, number[]>()
	private trackedActions: number[] = []
	private buffEventsToSynth: AbilityEvent[] = []
	private castEventsToSynth: CastEvent[] = []
	private startTime = this.parser.fight.start_time

	normalise(events: Event[]) {
		for (const event of events) {
			this.CheckForPrecastStatuses(event)
		}

		return [...this.castEventsToSynth, ...this.buffEventsToSynth, ...events]
	}

	private CheckForPrecastStatuses(event: Event) {
		if (event.type === 'cast') {
			this.markActionAsTracked(event.ability.guid)
			return
		}

		if (isTrackedBuffEvent(event) && event.targetID) {
			this.debug(`Checking ${event.type} of ${event.ability.name} at ${this.parser.formatTimestamp(event.timestamp, 1)} with stacks ${event.stack ?? 0}`)
			this.fabricateBuffEventIfRequired(event, event.targetID)
		}
	}

	private fabricateBuffEventIfRequired(event: AbilityEvent, targetId: number) {
		if (this.statusEventIsTrackedForTarget(event.ability.guid, targetId)) {
			return
		}

		const statusInfo = this.data.getStatus(event.ability.guid)
		if (!statusInfo) {
			// No valid status data for this event, skip to next event
			return
		}

		if (statusInfo.stacksApplied != null && statusInfo.stacksApplied > 0) {
			this.handleBuffStackEvent(event, statusInfo)
		} else {
			this.handleBuffEvent(event, statusInfo)
		}
	}

	private handleBuffEvent(event: AbilityEvent, statusInfo: Status) {
		if (event.type === 'applybuffstack') {
			this.debug(`Unexpected applybuffstack event seen - check the data files and determine if a stacksApplied property is missing for status ${statusInfo.name}`)
		}

		// This action does not apply stacks, check to see if this is an applybuff event
		if (event.type !== 'applybuff') {
			// First event for this status is an apply buff, check if cast event needs to be synthesized
			this.fabricateBuffEvent(event, statusInfo)
		}
		this.fabricateCastEventIfRequired(event, statusInfo)
		this.markStatusAsTracked(event.ability.guid, event.targetID!)
	}

	private handleBuffStackEvent(event: AbilityEvent, statusInfo: Status) {
		if (event.type === 'applybuff') {
			// This action applies stacks, expected first cast will have an applybuff and an applybuffstack with max stacks at the same timestamp
			// Ignore the applybuff event and check the applybuffstack event for validity
			return
		}

		if (!(event.type === 'applybuffstack' && event.stack === statusInfo.stacksApplied!)) {
			this.fabricateBuffEvent(event, statusInfo)
			this.fabricateBuffStackEvent(event, statusInfo)
		}

		this.fabricateCastEventIfRequired(event, statusInfo)
		this.markStatusAsTracked(event.ability.guid, event.targetID!)
	}

	private fabricateBuffEvent(event: AbilityEvent, statusInfo: Status) {
		this.debug(`Fabricating applybuff event for status ${statusInfo.name} on target ${event.targetID}`)
		// Fab an event and splice it in at the start of the fight
		this.buffEventsToSynth.push({
			...event,
			timestamp: this.startTime - 1,
			type: 'applybuff',
		})
	}

	private fabricateBuffStackEvent(event: AbilityEvent, statusInfo: Status) {
		this.debug(`Fabricating applybuff event for status ${statusInfo.name} with ${statusInfo.stacksApplied} stacks`)
		// Status applies multiple stacks - fab an applybuffstack event
		this.buffEventsToSynth.push({
			// Can inherit most of the event data from the current one
			...event,
			// Override a few vals
			timestamp: this.startTime - 1,
			type: 'applybuffstack',
			stack: statusInfo.stacksApplied!,
		})
	}

	private fabricateCastEventIfRequired(event: AbilityEvent, statusInfo: Status) {
		this.debug(`Determining if status ${statusInfo.name} was applied by a known action`)
		// Determine if this buff comes from a known action, fab a cast event
		const actionInfo = this.data.getActionThatAppliesStatus(statusInfo)

		if (!actionInfo) {
			this.debug('No known action found, no cast event to synthesize')
		} else {
			if (this.trackedActions.includes(actionInfo.id)) {
				this.debug(`Cast event already seen for ${actionInfo.name}, no synth necessary`)
			} else {
				this.debug(`Fabricating cast event for action ${actionInfo.name} by ${event.sourceID}`)
				const fabricated: CastEvent = {
					...event,
					ability: {
						type: event.ability.type,
						name: actionInfo.name,
						abilityIcon: actionInfo.icon,
						guid: actionInfo.id,
					},
					timestamp: this.startTime - 2,
					type: 'cast',
				}
				this.castEventsToSynth.push(fabricated)
				this.markActionAsTracked(actionInfo.id)
			}
		}

	}

	private statusEventIsTrackedForTarget(eventId: number, targetId: number) {
		const trackedStatusesForTarget = this.trackedStatuses.get(targetId)
		return (trackedStatusesForTarget != null && trackedStatusesForTarget.includes(eventId))
	}

	private markStatusAsTracked(statusId: number, targetId: number) {
		let trackedStatusesForTarget = this.trackedStatuses.get(targetId)
		if (trackedStatusesForTarget == null) {
			trackedStatusesForTarget = []
			this.trackedStatuses.set(targetId, trackedStatusesForTarget)
		}
		trackedStatusesForTarget.push(statusId)
	}

	private markActionAsTracked(eventAbilityId: number) {
		const action = this.data.getAction(eventAbilityId)
		if (action && !this.trackedActions.includes(action.id)) {
			this.trackedActions.push(action.id)
		}
	}
}
