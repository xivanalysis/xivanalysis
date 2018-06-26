import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'

export default class AlwaysBeCasting extends Module {
	static dependencies = [
		'checklist',
		'gcd',
		'invuln',
	]

	// Just using this for the suggestion for now
	on_complete() {
		const numGcds = this.gcd.gcds.length
		if (!numGcds) {
			return
		}

		const fightDuration = this.parser.fightDuration - this.invuln.getUntargetableUptime()
		// TODO: better method for getting gcd count
		const gcdUptime = numGcds * this.gcd.getEstimate()

		this.checklist.add(new Rule({
			name: 'Always be casting',
			description: 'Make sure you\'re always doing something. It\'s often better to make small mistakes while keeping the GCD rolling than it is to perform the correct rotation slowly.',
			requirements: [
				new Requirement({
					name: 'GCD uptime',
					percent: gcdUptime / fightDuration * 100,
				}),
			],
		}))
	}
}
