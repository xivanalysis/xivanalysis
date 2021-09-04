import {Trans} from '@lingui/react'
import {Action} from 'data/ACTIONS'
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
	static override debug = true

	@dependency private checklist!: Checklist
	@dependency protected downtime!: Downtime
	@dependency private castTime!: CastTime
	@dependency private data!: Data

	protected gcdUptime: number = 0
	protected gcdsCounted: number = 0

	private lastBeginCast: Events['prepare'] | null = null

	override initialise() {
		this.addEventHook(filter<Event>()
			.source(this.parser.actor.id)
			.type('prepare'), this.onBeginCast)
		this.addEventHook(filter<Event>()
			.source(this.parser.actor.id)
			.type('action'), this.onCast)
		this.addEventHook('complete', this.onComplete)
	}

	private onBeginCast(event: Events['prepare']) {
		this.lastBeginCast = event
	}

	private onCast(event: Events['action']) {
		const action = this.data.getAction(event.action)

		if (action == null || action.onGcd == null || !action.onGcd) {
			return
		}

		const castTime = this.castTime.forEvent(event) ?? 0
		const recastTime = this.castTime.recastForEvent(event) ?? 0

		const castStart = (this.lastBeginCast != null && this.lastBeginCast.action === event.action) ? this.lastBeginCast.timestamp : event.timestamp
		if (this.considerCast(action, castStart)) {
			this.debug(`GCD Uptime for ${action.name} at ${this.parser.formatEpochTimestamp(event.timestamp, 1)} - Cast time: ${castTime} | Recast time: ${recastTime}`)
			this.gcdUptime += Math.max(castTime, recastTime)
			this.gcdsCounted += 1
		} else {
			this.debug(`Excluding cast of ${action.name} at ${this.parser.formatEpochTimestamp(event.timestamp, 1)}`)
		}
		this.lastBeginCast = null
	}

	/**
	 * Implementing modules MAY override this to return false and exclude certain events from GCD uptime calculations.
	 * By default, returns true if the cast did not start during downtime
	 * @param action Action being considered for GCD uptime
	 * @param timestamp Timestamp the action occurred at
	 * @param castTime Calculated cast time of the action (adjusted by speed modifiers, if any active)
	 */
	protected considerCast(_action: Action, castStart: number) {
		return !this.downtime.isDowntime(castStart)
	}

	protected getUptimePercent(): number {
		this.debug(`Observed ${this.gcdsCounted} GCDs for a total of ${this.gcdUptime} ms of uptime`)
		const fightDuration = this.parser.currentDuration - this.downtime.getDowntime()
		const uptime = this.gcdUptime / fightDuration * 100
		this.debug(`Total fight duration: ${this.parser.currentDuration} - Downtime: ${this.downtime.getDowntime()} - Uptime percentage ${uptime}`)
		return uptime
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
