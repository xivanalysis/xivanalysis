import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import React from 'react'
import {Trans} from '@lingui/react'

export default class AlwaysBeCasting extends Module {
	static handle = 'abc'
	static dependencies = [
		'checklist',
		'downtime',
		'gcd',
	]

	constructor(...args) {
		super(...args)
		this.addEventHook('complete', this._onComplete)
	}

	// Just using this for the suggestion for now
	_onComplete() {
		const numGcds = this.gcd.gcds.length
		if (!numGcds) {
			return
		}

		const fightDuration = this.parser.currentDuration - this.downtime.getDowntime()

		this.checklist.add(new Rule({
			name: <Trans id="core.always-cast.title">Always be casting</Trans>,
			description: <Trans id="core.always-cast.description">
				Make sure you're always doing something. It's often better to make small
				mistakes while keeping the GCD rolling than it is to perform the correct
				rotation slowly.
			</Trans>,
			requirements: [
				new Requirement({
					name: <Trans id="core.always-cast.gcd-uptime">GCD Uptime</Trans>,
					percent: this.gcd.getUptime() / fightDuration * 100,
				}),
			],
		}))
	}
}
