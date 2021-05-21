import {getActions, getStatuses} from 'data/layer'
import {Event, Events} from 'event'
import {FflogsEvent} from 'fflogs'
import _ from 'lodash'
import {Actor, Team} from 'report'
import {AdapterStep} from './base'

interface SpeedmodWindow {
	start: number,
	end?: number,
}

class GCD {
	prepare: Events['prepare'] | undefined
	action: Events['action'] | undefined

	get isInterrupted(): boolean { return this.prepare != null && this.action == null }

	get start(): number {
		if (this.prepare != null) { return this.prepare.timestamp }
		if (this.action != null) { return this.action.timestamp } // Instant cast action - no prepare event
		throw new Error('Unexpected GCD with no prepare or action event')
	}
}

export class SpeedStatsAdapterStep extends AdapterStep {
	private actorActions = new Map<Actor['id'], GCD[]>()
	private actorSpeedmodWindows = new Map<Actor['id'], Map<number, SpeedmodWindow[]>>()

	static debug = true

	adapt(baseEvent: FflogsEvent, adaptedEvents: Event[]): Event[] {
		adaptedEvents.forEach(e => {
			switch (e.type) {
			case 'prepare':
			case 'action':
				this.trackAction(e)
				break
			case 'statusApply':
				this.startSpeedmodWindow(e)
				break
			case 'statusRemove':
				this.endSpeedmodWindow(e)
				break
			}
		})
		return adaptedEvents
	}

	postprocess(adaptedEvents: Event[]): Event[] {
		this.actorActions.forEach(this.estimateActorSpeedStat, this)

		this.actorSpeedmodWindows.forEach((windows, actor) => {
			console.log(`Actor ID: ${actor} - Speedmod Windows ${JSON.stringify(windows, this.replacer, 4)}`)
		})

		return adaptedEvents
	}

	private trackAction(event: Events['prepare'] | Events['action']) {
		if (this.actorIsNotFriendly(event)) { return }

		const action = _.find(getActions(this.report), a => a.id === event.action)
		if (!action?.onGcd) {
			return
		}

		let gcds = this.actorActions.get(event.source)
		if (gcds == null) {
			gcds = new Array<GCD>()
			this.actorActions.set(event.source, gcds)
		}

		if (event.type === 'action') {
			if (gcds.length > 0) {
				const lastInterval = gcds[gcds.length - 1]
				if (lastInterval.action == null && lastInterval.prepare != null && lastInterval.prepare.action === event.action) {
					lastInterval.action = event
					return
				}
			}

			const gcd = new GCD()
			gcd.action = event
			gcds.push(gcd)
		} else {
			const gcd = new GCD()
			gcd.prepare = event
			gcds.push(gcd)
		}
	}

	private startSpeedmodWindow(event: Events['statusApply']) {
		if (this.actorIsNotFriendly(event)) { return }

		const status = _.find(getStatuses(this.report), s => s.id === event.status)
		if (status?.speedModifier == null) {
			return
		}

		let windows = this.actorSpeedmodWindows.get(event.source)
		if (windows == null) {
			windows = new Map<number, SpeedmodWindow[]>()
			this.actorSpeedmodWindows.set(event.source, windows)
		}
		let windowMap = windows.get(status.id)
		if (windowMap == null) {
			windowMap = new Array<SpeedmodWindow>()
			windows.set(status.id, windowMap)
		}
		windowMap.push({start: event.timestamp})
	}

	private endSpeedmodWindow(event: Events['statusRemove']) {
		if (this.actorIsNotFriendly(event)) { return }

		const status = _.find(getStatuses(this.report), s => s.id === event.status)
		if (status?.speedModifier == null) {
			return
		}

		const windows = this.actorSpeedmodWindows.get(event.source)
		if (windows == null) {
			throw new Error('Received statusRemove event for an actor with no open speedmod windows')
		}
		const windowMap = windows.get(status.id)
		if (windowMap == null || windowMap[windowMap.length-1].end != null) {
			throw new Error('Received statusRemove event for a status with no open speedmod windows')
		}
		windowMap[windowMap.length-1].end = event.timestamp
	}

	private actorIsNotFriendly(event: Events['prepare' | 'action' | 'statusApply' | 'statusRemove']): boolean {
		const actor = this.pull.actors.find(a => a.id === event.source)
		return actor?.team !== Team.FRIEND
	}

	private estimateActorSpeedStat(gcds: GCD[], actorId: string) {
		const intervalGroups = new Map<number, number>()

		gcds.forEach((gcd, idx) => {
			const previous = gcds[idx - 1]
			if (previous == null || previous.isInterrupted) { return }

			const intervalSeconds = _.round((gcd.start - previous.start) / 1000, 2)

			const count = intervalGroups.get(intervalSeconds) ?? 0
			intervalGroups.set(intervalSeconds, count + 1)
		})

		this.debug(`Actor ID: ${actorId} - Event Intervals ${JSON.stringify(Array.from(intervalGroups.entries()).sort((a, b) => b[1] - a[1]))}`)
	}

	private replacer(key, value) {
		if (value instanceof Map) {
			return {
				dataType: 'Map',
				value: Array.from(value.entries()),
			}
		}
		return value
	}
}
