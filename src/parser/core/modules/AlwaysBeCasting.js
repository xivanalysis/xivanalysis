import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {i18nMark} from '@lingui/react'

export default class AlwaysBeCasting extends Module {
	static handle = 'abc'
	static dependencies = [
		'checklist',
		'downtime',
		'gcd',
	]

	constructor(...args) {
		super(...args)
		this.addHook('complete', this._onComplete)
	}

	// Just using this for the suggestion for now
	_onComplete() {
		const numGcds = this.gcd.gcds.length
		if (!numGcds) {
			return
		}

		const fightDuration = this.parser.fightDuration - this.downtime.getDowntime()

		this.checklist.add(new Rule({
			i18n_id: i18nMark('core.always-cast.title'),
			name: 'Always be casting',
			i18n_description: i18nMark('core.always-cast.description'),
			description: 'Make sure you\'re always doing something. It\'s often better to make small mistakes while keeping the GCD rolling than it is to perform the correct rotation slowly.',
			requirements: [
				new Requirement({
					i18n_id: i18nMark('core.always-cast.gcd-uptime'),
					name: 'GCD uptime',
					percent: this.gcd.getUptime() / fightDuration * 100,
				}),
			],
		}))
	}
}
