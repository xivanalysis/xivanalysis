import Module, {dependency} from 'parser/core/Module'
import _ from 'lodash'
import {Event} from 'events'
import {Data} from 'parser/core/modules/Data'
import {getDataBy} from 'data'
import {Status} from 'data/STATUSES'
import {StatusRoot} from 'data/STATUSES/root'
import {AbilityEvent, CastEvent} from 'fflogs'

const trackedBuffEventTypes = ['applybuff', 'applybuffstack', 'removebuff', 'removebuffstack', 'refreshbuff']
const isTrackedBuffEvent = (event: Event): event is AbilityEvent => (trackedBuffEventTypes.includes(event.type as string))
// Statuses applied before the pull won't have an apply(de)?buff event
// Fake buff applications so modules don't need to take it into account
export class PrecastStatus extends Module {
	static handle = 'precastStatus'
	static debug = true

	@dependency private data!: Data

	private trackedStatuses: number[] = []
	private trackedActions: number[] = []
	private buffEventsToSynth: AbilityEvent[] = []
	private castEventsToSynth: CastEvent[] = []
	private startTime = this.parser.fight.start_time

	normalise(events: Event[]) {
		for (const event of events) {
			if (event.ability && event.ability.name === 'Barrage') {
				this.debug(`${event.ability.name} ${event.type} event at ${event.timestamp} on target ${event.targetID}`)
			}
			if (event.type === 'cast') {
				const action = this.data.getAction(event.ability.guid)
				if (action && !this.trackedActions.includes(action.id)) {
					this.markActionAsTracked(action.id)
					continue
				}
			}

			if (isTrackedBuffEvent(event)) {
				const statusInfo = this.data.getStatus(event.ability.guid) as Status
				if (!statusInfo) {
					// No valid status data for this event, skip to next event
					continue
				}

				if (event.targetID) {
					if (this.trackedStatuses.includes(statusInfo.id)) {
						// Status is already tracked and no synth needs to take place
						continue
					}

					this.debug(`Checking ${event.type} of ${event.ability.name} at ${this.parser.formatTimestamp(event.timestamp, 1)}`)

					if (event.type === 'applybuff' && !statusInfo.hasOwnProperty('stacksApplied')) {
						// First event for this status is an apply buff, synthesize the cast event
						this.fabricateCastEvent(event, statusInfo)
					}

					if (event.type === 'applybuffstack' && statusInfo.hasOwnProperty('stacksApplied')) {
						// Synth an event if the first buff stacks seen was fewer than max for this action
						if (statusInfo.stacksApplied && event.stack < statusInfo.stacksApplied) {
							this.fabricateBuffEvent(event, statusInfo)
						}
					}

					if (['removebuff', 'removebuffstack', 'refreshbuff'].includes(event.type)) {
						this.fabricateBuffEvent(event, statusInfo)
					}
				}
			}
		}

		return [...this.castEventsToSynth, ...this.buffEventsToSynth, ...events]
	}

	fabricateBuffEvent(event: AbilityEvent, statusInfo: Status) {
		this.debug(`Fabricating applybuff event for status ${statusInfo.name}`)
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

		this.markStatusAsTracked(statusInfo.id)
		// Determine if this buff comes from a known action, fab a cast event
		this.fabricateCastEvent(event, statusInfo)
	}

	fabricateCastEvent(event: AbilityEvent, statusInfo: Status) {
		this.debug(`Determining if status ${statusInfo.name} was applied by a known action`)
		// Determine if this buff comes from a known action, fab a cast event
		const statusKey = (_.findKey(this.data.statuses, statusInfo) as (undefined | keyof StatusRoot))
		const actionInfo = getDataBy(this.data.actions, 'statusesApplied', statusKey)

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

	markStatusAsTracked(statusId: number) {
		this.trackedStatuses.push(statusId)
	}

	markActionAsTracked(actionId: number) {
		this.trackedActions.push(actionId)
	}
}
