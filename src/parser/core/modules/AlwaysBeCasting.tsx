import {Trans} from '@lingui/react'
import Module, {dependency} from 'parser/core/Module'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import Downtime from 'parser/core/modules/Downtime'
import GlobalCooldown from 'parser/core/modules/GlobalCooldown'
import React from 'react'

export default class AlwaysBeCasting extends Module {
	static override handle = 'abc'

	@dependency private checklist!: Checklist
	@dependency protected downtime!: Downtime
	@dependency protected gcd!: GlobalCooldown

	protected override init() {
		this.addEventHook('complete', this.onComplete)
	}

	protected getUptimePercent(): number {
		const fightDuration = this.parser.currentDuration - this.downtime.getDowntime()
		return this.gcd.getUptime() / fightDuration * 100
	}

	// Just using this for the suggestion for now
	protected onComplete() {
		if (!this.gcd.gcds.length) {
			return
		}

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
					percent: this.getUptimePercent(),
				}),
			],
		}))
	}
}
