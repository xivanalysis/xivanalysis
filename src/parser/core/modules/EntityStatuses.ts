import {BuffEvent, BuffStackEvent, Event} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import {FFLogsEventNormaliser} from './FFLogsEventNormaliser'
import Invulnerability from './Invulnerability'

const APPLY = 'apply'
const REMOVE = 'remove'

interface StatusTrackingEvent extends BuffEvent {
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

	@dependency private invuln!: Invulnerability
	@dependency private fflogsEvents!: FFLogsEventNormaliser

	private statuses = new Map<number, StatusTrackingEvent[]>()
	// -----
	// Event handlers
	// -----
	protected init() {
		// Buffs
		this.addEventHook(['applybuff', 'applydebuff'], this.applyStatus)
		this.addEventHook(['applybuffstack', 'applydebuffstack', 'removebuffstack', 'removedebuffstack'], this.updateStatusStack)
		this.addEventHook(['removebuff', 'removedebuff'], this.removeStatus)
	}

	// -----
	// API
	// -----
	// TODO: This implementation which I've shamelessly stolen seems to only track overall
	//       uptime, ignoring potential gains from multidotting, etc. Should that be in here,
	//       or is that a somewhere-else sort of thing...
	getStatusUptime(statusId: number, onTargets: TODO, sourceId = this.parser.player.id) {
		// Search for status maps on valid targets
		const statusEvents: StatusTrackingEvent[] = []
		Object.keys(onTargets).forEach((target: TODO) => {
			const appliedStatuses = this.getEntityStatuses(Number(target)).filter((statusEvent) => {
				return statusEvent.ability.guid === statusId && (statusEvent.sourceID === null || statusEvent.sourceID === sourceId)
			})
			statusEvents.push.apply(statusEvents, appliedStatuses)
		})

		const statusRanges: StatusRangeEndpoint[] = []
		statusEvents.forEach(statusEvent => {
			statusRanges.push(
				{timestamp: statusEvent.start, type: APPLY, stackHistory: statusEvent.stackHistory},
				{timestamp: statusEvent.end || this.parser.currentTimestamp, type: REMOVE, stackHistory: statusEvent.stackHistory},
			)
		})

		let active = 0
		let start: number | null = null
		return statusRanges
			.sort((a, b) => a.timestamp - b.timestamp)
			.reduce((uptime, rangeEndpoint) => {
				if (rangeEndpoint.type === APPLY) {
					if (active === 0) { start = rangeEndpoint.timestamp }
					active++
				}
				if (rangeEndpoint.type === REMOVE) {
					active--
					if (active === 0) { uptime += rangeEndpoint.timestamp - (start ?? rangeEndpoint.timestamp)}
				}
				return uptime
			}, 0)
	}

	// Buff handlers
	getBuffTarget(event: Event) {
		// Ignore events that are not relevant to the player
		if (!this.parser.byPlayer(event) && this.parser.toPlayer(event)) {
			return null
		}

		return event.targetID
	}

	getEntityStatuses(entity: number) {
		if (!this.statuses.has(entity)) {
			// No map entry for this entity yet, create a new entry
			this.statuses.set(entity, [])
		}

		return this.statuses.get(entity) || []
	}
	applyStatus(event: BuffEvent) {
		const isDebuff = event.type.includes('debuff')
		const target = this.getBuffTarget(event)
		if (!target) {
			// No valid target or not relevant to the player, skip
			return
		}

		this.getEntityStatuses(target).push({
			...event,
			start: event.timestamp,
			end: null,
			stacks: 1,
			stackHistory: [{stacks: 1, timestamp: event.timestamp, invuln: false}],
			isDebuff,
		})
	}

	updateStatusStack(event: BuffStackEvent) {
		const target = this.getBuffTarget(event)
		if (!target) {
			return
		}

		const statusEvent = this.getEntityStatuses(target).find(statusEvent =>
			statusEvent.ability.guid === event.ability.guid &&
			statusEvent.end === null,
		)

		if (!statusEvent) {
			// yoink lmao
			console.error('Buff stack updated while active buff wasn\'t known. Was this buff applied pre-combat? Maybe we should register the buff with start time as fight start when this happens, but it might also be a basic case of erroneous combatlog ordering.')
			return
		}

		statusEvent.stacks = event.stack
		statusEvent.stackHistory.push({stacks: event.stack, timestamp: event.timestamp, invuln: false})
	}

	removeStatus(event: BuffEvent) {
		const isDebuff = event.type.includes('debuff')
		const target = this.getBuffTarget(event)
		if (!target) {
			return
		}

		const targetStatuses = this.getEntityStatuses(target)
		let statusEvent = targetStatuses.find(statusEvent =>
			statusEvent.ability.guid === event.ability.guid &&
			statusEvent.end === null,
		)

		// If there's no existing buff, fake one from the start of the fight
		if (!statusEvent) {
			const startTime = this.parser.fight.start_time
			statusEvent = {
				...event,
				start: startTime,
				end: null,
				stacks: 1,
				stackHistory: [{stacks: 1, timestamp: startTime, invuln: false}],
				isDebuff,
			}
			targetStatuses.push(statusEvent)
		}

		// End the buff and trigger a final stack change
		statusEvent.stacks = 0
		statusEvent.end = event.timestamp
		statusEvent.stackHistory.push({stacks: 0, timestamp: event.timestamp, invuln: false})

		this.splitStatusRangeForInvulnEvents(statusEvent, target)
	}

	splitStatusRangeForInvulnEvents(statusEvent: StatusTrackingEvent, target: number) {
		if (!statusEvent.end) {
			console.error(`Unexpected error: Attempting to check invuln events for an incomplete status event.  Event timestamp: ${statusEvent.timestamp} | Ability name: ${statusEvent.ability.name}`)
			return
		}
		const statusEnd = statusEvent.end!
		const invulns = this.invuln.getInvulns(String(target), statusEvent.start, statusEvent.end, 'invulnerable')

		invulns.forEach((invuln: TODO) => {
			if (invuln.end < statusEnd) {
				// Invuln ended before the status ended - create a second status for the time after the invuln ended
				const newStackHistory = statusEvent.stackHistory.slice(0, -1)
				const stacksBeforeInvuln = newStackHistory[newStackHistory.length - 1].stacks
				newStackHistory.splice(-1, 1,
					{stacks: 0, timestamp: invuln.start, invuln: true},
					{stacks: stacksBeforeInvuln, timestamp: invuln.end, invuln: false},
					{stacks: 0, timestamp: statusEnd, invuln: false})

				this.getEntityStatuses(target).push({
					...statusEvent,
					start: invuln.end,
					end: statusEvent.end,
					stackHistory: newStackHistory,
				})

			}

			// Clip end of original status to beginning of invuln
			statusEvent.end = invuln.start
			statusEvent.stackHistory.splice(-1, 1, {stacks: 0, timestamp: invuln.start, invuln: true})
		})
	}
}
