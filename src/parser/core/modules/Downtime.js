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
			return 0
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

	// -----
	// Style Precedent:
	// accumulator for downtime function must continue to be called "uptime"
	// -----
	getDowntime(start = 0, end = this.parser.currentTimeStamp) {
		// Return the final number
		return this._internalDowntime(start, end).reduce((uptime, invuln) => uptime + Math.min(invuln.end, end) - Math.max(invuln.start, start), 0)
	}

	getDowntimeWindows(start = 0, end = this.parser.currentTimestamp, minimumWindowSize = -1) {
		return this._internalDowntime(start, end).map(invuln =>
			Math.min(invuln.end, end) - Math.max(invuln.start, start) > Math.min(minimumWindowSize, 0)
				? Math.min(invuln.end, end) - Math.max(invuln.start, start)
				: 0
		)
	}
}
