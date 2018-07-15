import Module from 'parser/core/Module'

export default class Downtime extends Module {
	static handle = 'downtime'
	static dependencies = [
		'invuln',
	]

	getDowntime(start = 0, end = this.parser.currentTimestamp) {
		// TODO: Just reproducing invuln for now, this will be modified to include other downtimes
		return this.invuln.getInvulns('all', start, end, 'untargetable')
			.reduce((uptime, invuln) => uptime + Math.min(invuln.end, end) - Math.max(invuln.start, start), 0)
	}
}
