import {BuffEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import {FFLogsEventNormaliser} from './FFLogsEventNormaliser'
import Invulnerability from './Invulnerability'

const APPLY = 'apply'
const REMOVE = 'remove'

interface BuffTrackingEvent extends BuffEvent {
	start: number,
	end: number | null,
	stacks: number,
	stackHistory: StackHistoryEvent[],
	isDebuff: boolean,
}

interface StackHistoryEvent {
	stacks: number,
	timestamp: number,
	invuln: boolean,
}

interface StatusRangeEndpoint {
	timestamp: number,
	type: 'apply' | 'remove',
	stackHistory: StackHistoryEvent[],
}

export class EntityStatuses extends Module {
	static handle = 'entityStatuses'
	static debug = false

	@dependency private invuln!: Invulnerability
	@dependency private fflogsEvents!: FFLogsEventNormaliser

	// -----
	// API
	// -----
	// TODO: This implementation which I've shamelessly stolen seems to only track overall
	//       uptime, ignoring potential gains from multidotting, etc. Should that be in here,
	//       or is that a somewhere-else sort of thing...
	getStatusUptime(statusId: number, onTargets: TODO, sourceId = this.parser.player.id) {
		// Search for status maps on valid targets
		const statusEvents: BuffTrackingEvent[] = Object.values(onTargets)
			.reduce((statusEvents: BuffTrackingEvent[], target: TODO) => {
				const appliedStatuses = target.buffs?.filter((statusEvent: BuffTrackingEvent) => {
					return statusEvent.ability.guid === statusId && (statusEvent.sourceID === null || statusEvent.sourceID === sourceId)
				})
				return statusEvents.concat(appliedStatuses)
			}, [])

		let active = 0
		let start: number | null = null
		return statusEvents
			.reduce((statusRanges: StatusRangeEndpoint[], statusEvent) => {
				return statusRanges.concat(this.getStatusRangesForEvent(statusEvent))
			}, [])
			.sort((a, b) => a.timestamp - b.timestamp)
			.reduce((uptime, rangeEndpoint) => {
				this.debug(`Status change ${rangeEndpoint.type} at time ${this.parser.formatTimestamp(rangeEndpoint.timestamp, 1)}`)
				if (rangeEndpoint.type === APPLY) {
					if (active === 0) {
						this.debug('Status not currently active on any targets, starting new window')
						start = rangeEndpoint.timestamp
					}
					active++
				}
				if (rangeEndpoint.type === REMOVE) {
					active--
					if (active === 0) {
						uptime += rangeEndpoint.timestamp - (start ?? rangeEndpoint.timestamp)
						this.debug(`Status ended on all targets.  Total uptime now ${this.parser.formatDuration(uptime, 1)}`)
					}
				}
				return uptime
			}, 0)
	}

	getStatusRangesForEvent(statusEvent: BuffTrackingEvent) {
		this.debug(`Determining active time range for status ${statusEvent.ability.name} - started at: ${this.parser.formatTimestamp(statusEvent.start, 1)} - ended at: ${(statusEvent.end)? this.parser.formatTimestamp(statusEvent.end, 1) : ''}`)
		return this.splitStatusEventForInvulns(statusEvent).reduce((statusRanges: StatusRangeEndpoint[], statusEvent) => {
			statusRanges.push({timestamp: statusEvent.start, type: APPLY, stackHistory: statusEvent.stackHistory})
			statusRanges.push({timestamp: statusEvent.end ?? this.parser.currentTimestamp, type: REMOVE, stackHistory: statusEvent.stackHistory})
			return statusRanges
		}, [])
	}

	splitStatusEventForInvulns(statusEvent: BuffTrackingEvent) {
		const eventToAdjust = {...statusEvent}
		const adjustedEvents = [eventToAdjust]
		if (!statusEvent.end) {
			console.error(`Unexpected error: Attempting to check invuln events for an incomplete status event.  Event timestamp: ${statusEvent.timestamp} | Ability name: ${statusEvent.ability.name}`)
			return adjustedEvents
		}
		const target = String(statusEvent.targetID)
		const invulns = this.invuln.getInvulns(target, statusEvent.start, statusEvent.end, 'invulnerable')

		invulns.forEach((invuln: TODO) => {
			this.debug(`Target was detected as invulnerable during duration of status.  Invulnerable from ${this.parser.formatTimestamp(invuln.start, 1)} to ${this.parser.formatTimestamp(invuln.end, 1)}`)
			if (invuln.start < statusEvent.start && invuln.end >= statusEvent.start) {
				this.debug('Invuln clipped the start of the range - changing beginning of event')
				eventToAdjust.start = invuln.end
			} else {
				this.debug('Invuln clipped the end of the range or split the range - changing end of event')
				eventToAdjust.end = invuln.start
				eventToAdjust.stackHistory.splice(-1, 1, {stacks: 0, timestamp: invuln.start, invuln: true})

				if (invuln.end < eventToAdjust.end!) {
					this.debug('Invuln split the range - synthesizing second event for status time after invuln')
					// Invuln ended before the status ended - create a second status for the time after the invuln ended
					const newStackHistory = statusEvent.stackHistory.slice(0, -1)
					const stacksBeforeInvuln = newStackHistory[newStackHistory.length - 1].stacks
					newStackHistory.splice(-1, 1,
						{stacks: 0, timestamp: invuln.start, invuln: true},
						{stacks: stacksBeforeInvuln, timestamp: invuln.end, invuln: false},
						{stacks: 0, timestamp: statusEvent.end!, invuln: false})

					adjustedEvents.push({
						...statusEvent,
						start: invuln.end,
						end: statusEvent.end,
						stackHistory: newStackHistory,
					})
				}
			}
		})

		adjustedEvents.forEach(event => this.debug(`Active time after adjusting for invulns - start at: ${this.parser.formatTimestamp(event.start)} - end at: ${this.parser.formatTimestamp(event.end!)}`))
		return adjustedEvents
	}
}
