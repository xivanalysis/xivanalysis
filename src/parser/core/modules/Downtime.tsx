import Module, {dependency} from 'parser/core/Module'
import UnableToAct from './UnableToAct'
import {Invulnerability} from './Invulnerability'
import {Timeline, SimpleItem} from './Timeline'
import React from 'react'

interface DowntimeWindow {
	start: number,
	end: number
}

export default class Downtime extends Module {
	static handle = 'downtime'

	@dependency private readonly unableToAct!: UnableToAct
	@dependency private readonly invuln!: Invulnerability
	@dependency private readonly timeline!: Timeline

	protected init() {
		this.addEventHook('complete', this.onComplete)
	}

	private internalDowntime(start = 0, end = this.parser.currentTimestamp) {
		// Get all the downtime from both unableToAct and invuln, and sort it
		const downtimePeriods = [
			...this.unableToAct.getDowntimes(start, end),
			...this.invuln.getInvulns('all', start, end, 'untargetable'),
		].sort((a, b) => a.start - b.start)

		// If there's nothing, just stop now
		if (downtimePeriods.length === 0) {
			return []
		}

		// Merge the downtimes that overlap
		const finalDowntimes = [downtimePeriods.shift()!]
		downtimePeriods.forEach(dt => {
			const last = finalDowntimes[finalDowntimes.length - 1]
			if (dt.start <= last.end) {
				if (dt.end > last.end) {
					last.end = dt.end
				}
			} else {
				finalDowntimes.push(dt)
			}
		})

		return finalDowntimes
	}

	isDowntime(when = this.parser.currentTimestamp) {
		return this.internalDowntime(when, when).length > 0
	}

	getDowntime(start = 0, end = this.parser.currentTimestamp) {
		// Return the final number
		return this.internalDowntime(start, end).reduce((uptime, invuln) => uptime + Math.min(invuln.end, end) - Math.max(invuln.start, start), 0)
	}

	getDowntimes = (start = 0, end = this.parser.currentTimestamp, minimumDowntimeLength = -1) =>
		this.internalDowntime(start, end).reduce<number[]>(
			(aggregator, invuln) => {
				if (Math.min(invuln.end, end) - Math.max(invuln.start, start) > Math.min(minimumDowntimeLength, 0)) {
					aggregator.push(Math.min(invuln.end, end) - Math.max(invuln.start, start))
				}
				return aggregator
			},
			[],
		)

	getDowntimeWindows = (start = 0, end = this.parser.currentTimestamp, minimumWindowSize = -1) =>
		this.internalDowntime(start, end).reduce<DowntimeWindow[]>(
			(aggregator, invuln) => {
				if (Math.min(invuln.end, end) - Math.max(invuln.start, start) > Math.min(minimumWindowSize, 0)) {
					aggregator.push({start: Math.max(invuln.start, start), end: Math.min(invuln.end, end)})
				}
				return aggregator
			},
			[],
		)

	private onComplete() {
		const startTime = this.parser.eventTimeOffset
		const windows = this.getDowntimeWindows()

		windows.forEach(window => {
			this.timeline.addItem(new SimpleItem({
				start: window.start - startTime,
				end: window.end - startTime,
				// TODO: This but better?
				content: <div style={{width: '100%', height: '100%', backgroundColor: '#d5ddf666'}}/>,
			}))
		})
	}
}
