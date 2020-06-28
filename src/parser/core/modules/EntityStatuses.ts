import {BuffEvent} from 'fflogs'
import _ from 'lodash'
import Module, {dependency} from 'parser/core/Module'
import {Data} from 'parser/core/modules/Data'
import {Invulnerability} from 'parser/core/modules/Invulnerability'

const APPLY = 'apply'
const REMOVE = 'remove'

interface BuffTrackingEvent extends BuffEvent {
	start: number,
	lastRefreshed: number,
	end: number | undefined,
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

interface StatusInfoTracking {
	uptime: number,
	activeOn: number,
	activeWindowStart: number,
}

export class EntityStatuses extends Module {
	static handle = 'entityStatuses'
	static debug = false

	@dependency private invuln!: Invulnerability
	@dependency private data!: Data

	// -----
	// API
	// -----
	// TODO: This implementation which I've shamelessly stolen seems to only track overall
	//       uptime, ignoring potential gains from multidotting, etc. Should that be in here,
	//       or is that a somewhere-else sort of thing...
	// TODO: Export an interface that defines an Entity (target)... the expectation is that onTargets will generally be
	//       parser.enemies or parser.combatants, as those were mostly the classes where getStatusUptime was previously being used.
	//       Probably add a method to parser.entities to return an array of the specified entity type (e.g. this.parser.enemies.getArray())
	getStatusUptime(statusId: number, onTargets: TODO, sourceId = this.parser.player.id) {
		// Search for status maps on valid targets
		const statusEvents: BuffTrackingEvent[] = Object.values(onTargets)
			.reduce((statusEvents: BuffTrackingEvent[], target: TODO) => {
				if (!(target.buffs instanceof Array)) {
					return statusEvents
				}

				return statusEvents.concat(this.getSelectedStatusEvents(statusId, sourceId, target.buffs))
			}, [])

		return this.getUptime(statusEvents)
	}

	getSelectedStatusEvents = (statusId: number, sourceId: number, targetBuffs: BuffTrackingEvent[]) => {
		return targetBuffs.filter((statusEvent: BuffTrackingEvent) => {
			return statusEvent.ability.guid === statusId && (statusEvent.sourceID === null || statusEvent.sourceID === sourceId)
		})
	}

	getUptime = (statusEvents: BuffTrackingEvent[]) => {
		const statusRanges = statusEvents.reduce((statusRanges: StatusRangeEndpoint[], statusEvent) => {
				return statusRanges.concat(this.getStatusRangesForEvent(statusEvent))
			}, [])

		const statusInfo = statusRanges.sort((a, b) => a.timestamp - b.timestamp)
			.reduce(this.totalStatusUptime, {uptime: 0, activeOn: 0, activeWindowStart: 0})

		return statusInfo.uptime
	}

	getStatusRangesForEvent = (statusEvent: BuffTrackingEvent) => {
		this.debug(`Determining active time range for status ${statusEvent.ability.name} - started at: ${this.parser.formatTimestamp(statusEvent.start, 1)} - ended at: ${(statusEvent.end)? this.parser.formatTimestamp(statusEvent.end, 1) : ''}`)
		return this.splitStatusEventForInvulns(statusEvent).reduce((statusRanges: StatusRangeEndpoint[], statusEvent) => {
			statusRanges.push({timestamp: statusEvent.start, type: APPLY, stackHistory: statusEvent.stackHistory})
			statusRanges.push({timestamp: statusEvent.end ?? this.parser.currentTimestamp, type: REMOVE, stackHistory: statusEvent.stackHistory})
			return statusRanges
		}, [])
	}

	totalStatusUptime = (statusTracking: StatusInfoTracking, rangeEndpoint: StatusRangeEndpoint) => {
		this.debug(`Status change ${rangeEndpoint.type} at time ${this.parser.formatTimestamp(rangeEndpoint.timestamp, 1)}`)
		if (rangeEndpoint.type === APPLY) {
			if (statusTracking.activeOn === 0) {
				this.debug('Status not currently active on any targets, starting new window')
				statusTracking.activeWindowStart = rangeEndpoint.timestamp
			}
			statusTracking.activeOn++
		}
		if (rangeEndpoint.type === REMOVE) {
			statusTracking.activeOn--
			if (statusTracking.activeOn === 0) {
				statusTracking.uptime += rangeEndpoint.timestamp - (statusTracking.activeWindowStart ?? rangeEndpoint.timestamp)
				this.debug(`Status ended on all targets.  Total uptime now ${this.parser.formatDuration(statusTracking.uptime, 1)}`)
			}
		}
		return statusTracking
	}

	splitStatusEventForInvulns = (statusEvent: BuffTrackingEvent) => {
		this.setEndTimeIfUnfinished(statusEvent)

		const eventToAdjust = _.cloneDeep(statusEvent)
		const adjustedEvents = [eventToAdjust]

		const target = statusEvent.targetID
		this.debug(`Searching for invulns against target ID ${target} from ${this.parser.formatTimestamp(statusEvent.start, 1)} to ${this.parser.formatTimestamp(statusEvent.end!, 1)}`)
		const invulns = this.invuln.getInvulns(target, statusEvent.start, statusEvent.end, 'invulnerable')

		// TODO: Export an interface for invulnerable events from Invulnerability.js
		invulns.forEach((invuln: TODO) => {
			this.debug(`Target was detected as invulnerable during duration of status.  Invulnerable from ${this.parser.formatTimestamp(invuln.start, 1)} to ${this.parser.formatTimestamp(invuln.end, 1)}`)
			if (invuln.start < statusEvent.start && invuln.end >= statusEvent.start) {
				this.debug('Invuln clipped the start of the range - changing beginning of event')
				eventToAdjust.start = invuln.end
			} else {
				this.debug('Invuln clipped the end of the range or split the range - changing end of event')
				eventToAdjust.end = invuln.start
				eventToAdjust.stackHistory.splice(-1, 1, {stacks: 0, timestamp: invuln.start, invuln: true})

				if (invuln.end < statusEvent.end!) {
					this.debug('Invuln split the range - synthesizing second event for status time after invuln')
					// Invuln ended before the status ended - create a second status for the time after the invuln ended
					// If the status overlaps the end of the fight or the disappearance of the boss, there may not be a stackHistory event for the end of the debuff - splice on to the end of the array as-is
					const newStackHistory = statusEvent.stackHistory.some(history => history.stacks === 0) ? statusEvent.stackHistory.slice(0, -1) : statusEvent.stackHistory
					const stacksBeforeInvuln = newStackHistory[newStackHistory.length - 1].stacks
					newStackHistory.splice(-1, 1,
						{stacks: 0, timestamp: invuln.start, invuln: true},
						{stacks: stacksBeforeInvuln, timestamp: invuln.end, invuln: false},
						{stacks: 0, timestamp: statusEvent.end!, invuln: false})

					adjustedEvents.push({
						...statusEvent,
						start: invuln.end,
						lastRefreshed: invuln.end,
						end: statusEvent.end,
						stackHistory: newStackHistory,
					})
				}
			}
		})

		adjustedEvents.forEach(event => this.debug(`Active time after adjusting for invulns - start at: ${this.parser.formatTimestamp(event.start)} - end at: ${this.parser.formatTimestamp(event.end!)}`))
		return adjustedEvents
	}

	private setEndTimeIfUnfinished = (statusEvent: BuffTrackingEvent) => {
		if (!statusEvent.end) {
			this.debug('Unfinished status event detected.  Applying ability duration after last refresh event.')
			const statusInfo = this.data.getStatus(statusEvent.ability.guid)
			if (statusInfo?.duration) {
				statusEvent.end = statusEvent.lastRefreshed + statusInfo.duration * 1000
				this.debug(`Updating status event for status ${statusInfo.name}.  Adding ${statusInfo.duration} seconds, effective end time set to ${this.parser.formatTimestamp(statusEvent.end, 1)}`)
			} else {
				this.debug(`No matching status duration information found for status ${statusEvent.ability.guid}, setting to end of fight so invuln detection can clip the end to when the target went untargetable`)
				statusEvent.end = this.parser.pull.duration + this.parser.eventTimeOffset
			}
		}
	}
}
