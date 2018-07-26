import Module from 'parser/core/Module'

export default class Downtime extends Module {
	static handle = 'downtime'
	static dependencies = [
		'invuln',
		'unableToAct',
	]

	getDowntime(start = 0, end = this.parser.currentTimestamp) {
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
		const finalDowntime = [downtimePeriods.shift()]
		downtimePeriods.forEach(dt => {
			const last = finalDowntime[finalDowntime.length - 1]
			if (dt.start <= last.end) {
				if (dt.end > last.end) {
					last.end = dt.end
				}
			} else {
				finalDowntime.push(dt)
			}
		})

		// Return the final number
		return finalDowntime.reduce((uptime, invuln) => uptime + Math.min(invuln.end, end) - Math.max(invuln.start, start), 0)
	}
}
