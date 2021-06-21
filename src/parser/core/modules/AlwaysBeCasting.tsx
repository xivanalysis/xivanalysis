import {Trans} from '@lingui/react'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Module'
import CastTime from 'parser/core/modules/CastTime'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import Downtime from 'parser/core/modules/Downtime'
import React from 'react'

export class AlwaysBeCasting extends Analyser {
	static override handle = 'abc'

	@dependency private checklist!: Checklist
	@dependency protected downtime!: Downtime
	@dependency private castTime!: CastTime
	@dependency private data!: Data

	protected gcdUptime: number = 0

	override initialise() {
		this.addEventHook(filter<Event>()
			.source(this.parser.actor.id)
			.type('action'), this.onCast)
		this.addEventHook('complete', this.onComplete)
	}

	private onCast(event: Events['action']) {
		if (!this.considerCast(event)) {
			return
		}

		const action = this.data.getAction(event.action)

		if (action == null || action.onGcd == null || !action.onGcd) {
			return
		}

		const castTime = this.castTime.forEvent(event) ?? 0
		const recastTime = this.castTime.recastForEvent(event) ?? 0
		this.gcdUptime += Math.max(castTime, recastTime)
	}

	/**
	 * Implementing modules MAY override this to return false and exclude certain events from GCD uptime calculations
	 * @param event Action being considered for GCD uptime
	 */
	protected considerCast(_event: Events['action']) {
		return true
	}

	protected getUptimePercent(): number {
		const fightDuration = this.parser.currentDuration - this.downtime.getDowntime()
		return this.gcdUptime / fightDuration * 100
	}

	protected onComplete() {
		if (this.gcdUptime === 0) {
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
