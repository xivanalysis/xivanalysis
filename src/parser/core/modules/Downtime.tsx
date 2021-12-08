import React from 'react'
import {Analyser} from '../Analyser'
import {dependency} from '../Injectable'
import {Invulnerability} from './Invulnerability'
import {Timeline, SimpleItem} from './Timeline'
import {UnableToAct} from './UnableToAct'

interface DowntimeWindow {
	start: number,
	end: number
}

export default class Downtime extends Analyser {
	static override handle = 'downtime'

	@dependency private readonly unableToAct!: UnableToAct
	@dependency private readonly invulnerability!: Invulnerability
	@dependency private readonly timeline!: Timeline

	override initialise() {
		this.addEventHook('complete', this.onComplete)
	}

	private internalDowntime(start = this.parser.pull.timestamp, end = this.parser.currentEpochTimestamp) {
		// Get all the downtime from both unableToAct and invuln, and sort it
		const downtimePeriods: DowntimeWindow[] = [
			...this.unableToAct.getWindows({
				start,
				end,
			}),
			...this.invulnerability.getWindows({
				start,
				end,
				types: ['untargetable'],
			}),
		].sort((a, b) => a.start - b.start)

		// If there's nothing, just stop now
		const firstElement = downtimePeriods.shift()
		if (firstElement == null) {
			return []
		}

		const finalDowntimes = [firstElement]
		downtimePeriods.forEach(downtime => {
			const last = finalDowntimes[finalDowntimes.length - 1]
			if (downtime.start <= last.end) {
				if (downtime.end > last.end) {
					last.end = downtime.end
				}
			} else {
				finalDowntimes.push(downtime)
			}
		})

		return finalDowntimes
	}

	isDowntime(when = this.parser.currentEpochTimestamp) {
		return this.internalDowntime(when, when).length > 0
	}

	getDowntime(start = this.parser.pull.timestamp, end = this.parser.currentEpochTimestamp) {
		return this.internalDowntime(start, end).reduce(
			(uptime, invuln) => uptime + Math.min(invuln.end, end) - Math.max(invuln.start, start),
			0,
		)
	}

	getDowntimeWindows = (start = this.parser.pull.timestamp, end = this.parser.currentEpochTimestamp) =>
		this.internalDowntime(start, end).reduce<DowntimeWindow[]>(
			(windows, invuln) => {
				windows.push({
					start: Math.max(invuln.start, start),
					end: Math.min(invuln.end, end),
				})
				return windows
			},
			[],
		)

	private onComplete() {
		const startTime = this.parser.pull.timestamp
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
