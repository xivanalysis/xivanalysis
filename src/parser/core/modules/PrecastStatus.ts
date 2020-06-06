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
	static debug = true

	@dependency private data!: Data

	trackedStatuses = new Map<number, number[]>()
	trackedActions: number[] = []
	buffEventsToSynth: AbilityEvent[] = []
	castEventsToSynth: CastEvent[] = []
	private startTime = this.parser.fight.start_time

	normalise(events: Event[]) {
		for (const event of events) {
			if (event.type === 'cast') {
				const action = this.data.getAction(event.ability.guid)
				if (action && !this.trackedActions.includes(action.id)) {
					this.markActionAsTracked(action.id)
					continue
				}
			}

			if (isTrackedBuffEvent(event)) {
				if (event.targetID) {
					const trackedStatusesForTarget = this.trackedStatuses.get(event.targetID)
					if (trackedStatusesForTarget != null && trackedStatusesForTarget.includes(event.ability.guid)) {
						// Status is already tracked for this target and no synth needs to take place
						continue
					}

					const statusInfo = this.data.getStatus(event.ability.guid) as Status
					if (!statusInfo) {
						// No valid status data for this event, skip to next event
						continue
					}

					this.debug(`Checking ${event.type} of ${event.ability.name} at ${this.parser.formatTimestamp(event.timestamp, 1)} with stacks ${event.stack ?? 0}`)

					if (statusInfo.stacksApplied && statusInfo.stacksApplied > 0) {
						// This action applies stacks, expected first cast will have an applybuff and an applybuffstack with max stacks at the same timestamp
						// Ignore the applybuff event and check the applybuffstack event for validity
						if (event.type === 'applybuff') { continue }
						if (event.type === 'applybuffstack')
						{
							if (event.stack < statusInfo.stacksApplied) {
								// First applybuffstack seen with less than max stacks, synth the initial buff event
								this.fabricateBuffEvent(event, statusInfo)
							}
							else {
								// First applybuff stack seen with max stacks, check if cast event needs to be synthesized
								this.fabricateCastEvent(event, statusInfo)
							}
							this.markStatusAsTracked(event.ability.guid, event.targetID)
						}
					} else {
						// This action does not apply stacks, check to see if this is an applybuff event
						if (event.type === 'applybuff') {
							// First event for this status is an apply buff, check if cast event needs to be synthesized
							this.fabricateCastEvent(event, statusInfo)
							this.markStatusAsTracked(event.ability.guid, event.targetID)
						}
					}

					if (['removebuff', 'removebuffstack', 'refreshbuff'].includes(event.type)) {
						this.fabricateBuffEvent(event, statusInfo)
						this.markStatusAsTracked(event.ability.guid, event.targetID)
					}
				}
			}
		}

		return [...this.castEventsToSynth, ...this.buffEventsToSynth, ...events]
	}

	private fabricateBuffEvent(event: AbilityEvent, statusInfo: Status) {
		this.debug(`Fabricating applybuff event for status ${statusInfo.name} on target ${event.targetID}`)
		// Fab an event and splice it in at the start of the fight
		this.buffEventsToSynth.push({
			...event,
			timestamp: this.startTime - 1,
			type: 'applybuff',
		})

		if (statusInfo.stacksApplied && statusInfo.stacksApplied > 0) {
			this.debug(`Fabricating applybuff event for status ${statusInfo.name} with ${statusInfo.stacksApplied} stacks`)
			// Status applies multiple stacks - fab an applybuffstack event
			this.buffEventsToSynth.push({
				// Can inherit most of the event data from the current one
				...event,
				// Override a few vals
				timestamp: this.startTime - 1,
				type: 'applybuffstack',
				stack: statusInfo.stacksApplied,
			})
		}

		// Determine if this buff comes from a known action, fab a cast event
		this.fabricateCastEvent(event, statusInfo)
	}

	private fabricateCastEvent(event: AbilityEvent, statusInfo: Status) {
		this.debug(`Determining if status ${statusInfo.name} was applied by a known action`)
		// Determine if this buff comes from a known action, fab a cast event
		const actionInfo = this.data.getActionAppliedByStatus(statusInfo)

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

	private markStatusAsTracked(statusId: number, targetId: number) {
		let trackedStatusesForTarget = this.trackedStatuses.get(targetId)
		if (trackedStatusesForTarget == null) {
			trackedStatusesForTarget = []
			this.trackedStatuses.set(targetId, trackedStatusesForTarget)
		}
		trackedStatusesForTarget.push(statusId)
	}

	private markActionAsTracked(actionId: number) {
		this.trackedActions.push(actionId)
	}
}
