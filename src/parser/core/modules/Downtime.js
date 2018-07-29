import Module from 'parser/core/Module'

export default class Downtime extends Module {
	static handle = 'downtime'
	static dependencies = [
		'invuln',
		'unableToAct',
	]

	_internalDowntime(start = 0, end = this.parser.currentTimestamp) {
		// Get all the downtime from both unableToAct and invuln, and sort it
		const downtimePeriods = [
			...this.unableToAct.getDowntimes(start, end),
			...this.invuln.getInvulns('all', start, end, 'untargetable'),
		].sort((a, b) => a.start - b.start)

		// If there's nothing, just stop now
		if (!downtimePeriods.length) {
			return undefined
		}

		// Merge the downtimes that overlap
		const finalDowntimes = [downtimePeriods.shift()]
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

	getDowntime(start = 0, end = this.parser.currentTimeStamp) {
		const res = this._internalDowntime(start, end)
		if (res === undefined) {
			return 0
		}
		// Return the final number
		return res.reduce((uptime, invuln) => uptime + Math.min(invuln.end, end) - Math.max(invuln.start, start), 0)
	}

	getDowntimes(start = 0, end = this.parser.currentTimeStamp, minimumDowntimeLength = -1) {
		const res = this._internalDowntime(start, end)
		if (res === undefined) {
			return []
		}
		return res.reduce((aggregator, invuln) => {
			if (Math.min(invuln.end, end) - Math.max(invuln.start, start) > Math.min(minimumDowntimeLength, 0)) {
				aggregator.push(Math.min(invuln.end, end) - Math.max(invuln.start, start))
			}
			return aggregator
		}, [])
	}

	getDowntimeWindows(start = 0, end = this.parser.currentTimestamp, minimumWindowSize = -1) {
		const res = this._internalDowntime(start, end)
		if (res === undefined) {
			return []
		}
		return res.reduce((aggregator, invuln) => {
			if (Math.min(invuln.end, end) - Math.max(invuln.start, start) > Math.min(minimumWindowSize, 0)) {
				aggregator.push({start: Math.max(invuln.start, start), end: Math.min(invuln.end, end)})
			}
			return aggregator
		}, [])
	}
}
