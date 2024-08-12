import {Trans} from '@lingui/react'
import {Action} from 'data/ACTIONS'
import {ANIMATION_LOCK} from 'data/CONSTANTS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import CastTime from 'parser/core/modules/CastTime'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import Downtime from 'parser/core/modules/Downtime'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SpeedAdjustments} from 'parser/core/modules/SpeedAdjustments'
import React from 'react'

const UPTIME_TARGET = 98

interface GcdUptimeEvent {
	time: number
	gcdUptime: number
}

export class AlwaysBeCasting extends Analyser {
	static override handle = 'abc'
	static override debug = false

	@dependency protected castTime!: CastTime
	@dependency protected checklist!: Checklist
	@dependency protected data!: Data
	@dependency protected downtime!: Downtime
	@dependency protected globalCooldown!: GlobalCooldown
	@dependency protected speedAdjustments!: SpeedAdjustments

	protected gcdUptimeSuggestionContent: JSX.Element = <Trans id="core.always-cast.description">
		Make sure you're always doing something. It's often better to make small
		mistakes while keeping the GCD rolling than it is to perform the correct
		rotation slowly.
	</Trans>

	protected gcdUptimeEvents: GcdUptimeEvent[] = []
	protected gcdsCounted: number = 0

	private lastBeginCast?: Events['prepare']

	override initialise() {
		this.addEventHook(
			filter<Event>().source(this.parser.actor.id).type('prepare'),
			this.onBeginCast
		)
		this.addEventHook(
			filter<Event>().source(this.parser.actor.id).type('action'),
			this.onCast
		)
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

		let castTime = this.castTime.forEvent(event) ?? 0
		const adjustedBaseGCD = this.globalCooldown.getDuration()
		if (castTime >= adjustedBaseGCD) {
			// Account for "caster tax" - animation lock on spells with cast time equal to or greater than the GCD that prevents starting the next spell until the animation finishes
			castTime += ANIMATION_LOCK
		}
		const recastTime = this.castTime.recastForEvent(event) ?? 0

		const castStart = (this.lastBeginCast != null && this.lastBeginCast.action === event.action) ? this.lastBeginCast.timestamp : event.timestamp
		if (this.considerCast(action, castStart)) {
			const gcdDuration = Math.max(castTime, recastTime)

			const relativeTimestamp = event.timestamp - this.parser.pull.timestamp
			const relativeEndTime = relativeTimestamp + gcdDuration

			if (castTime > relativeTimestamp) {
				const gcdUptime = relativeTimestamp - castTime + gcdDuration
				this.debug(`GCD Uptime for precast ${action.name} at ${this.parser.formatEpochTimestamp(event.timestamp, 1)} - Cast time: ${castTime} | Recast time: ${recastTime} | Time of completion: ${gcdUptime}`)
				this.gcdUptimeEvents.push({
					time: event.timestamp,
					gcdUptime: Math.max(0, gcdUptime),
				})
			} else if (relativeEndTime > this.parser.pull.duration) {
				const gcdUptime = relativeEndTime - this.parser.pull.duration
				this.debug(`GCD Uptime for end-of-fight ${action.name} at ${this.parser.formatEpochTimestamp(event.timestamp, 1)} - Cast time: ${castTime} | Recast time: ${recastTime} | In-combat uptime ${gcdUptime}`)
				this.gcdUptimeEvents.push({
					time: event.timestamp,
					gcdUptime: Math.max(0, gcdUptime),
				})
			} else {
				this.debug(`GCD Uptime for ${action.name} at ${this.parser.formatEpochTimestamp(event.timestamp, 1)} - Cast time: ${castTime} | Recast time: ${recastTime}`)
				this.gcdUptimeEvents.push({
					time: event.timestamp,
					gcdUptime: gcdDuration,
				})
			}
			this.gcdsCounted += 1
		} else {
			this.debug(`Excluding cast of ${action.name} at ${this.parser.formatEpochTimestamp(event.timestamp, 1)}`)
		}
		this.lastBeginCast = undefined
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

	/* Must be accessed after all events have been processed */
	protected get gcdUptime(): number {
		return this.gcdUptimeEvents.reduce((totalUptime: number, event: GcdUptimeEvent) => {
			if (this.downtime.isDowntime(event.time + event.gcdUptime)) {
				// If the GCD ends in a downtime window, we only count the part that occurred in uptime
				this.debug(`GCD ends in downtime at ${this.parser.formatEpochTimestamp(event.time + event.gcdUptime)}`)
				const downtimeWindow = this.downtime.getDowntimeWindows(event.time, event.time + event.gcdUptime)[0]
				return totalUptime + (downtimeWindow?.start ?? event.time + event.gcdUptime) - event.time
			}
			return totalUptime + event.gcdUptime
		}, 0)
	}

	protected getUptimePercent(): number {
		this.debug(`Observed ${this.gcdsCounted} GCDs for a total of ${this.gcdUptime} ms of uptime`)
		const fightDuration = this.parser.currentDuration - this.downtime.getDowntime()
		const uptime = this.gcdUptime / fightDuration * 100
		this.debug(`Total fight duration: ${this.parser.currentDuration} - Downtime: ${this.downtime.getDowntime()} - Uptime percentage ${uptime}`)
		return uptime
	}

	protected onComplete() {
		if (this.gcdUptimeEvents.length === 0) {
			return
		}

		this.checklist.add(new Rule({
			name: <Trans id="core.always-cast.title">Always be casting</Trans>,
			description: this.gcdUptimeSuggestionContent,
			displayOrder: -1,
			requirements: [
				new Requirement({
					name: <Trans id="core.always-cast.gcd-uptime">GCD Uptime</Trans>,
					percent: this.getUptimePercent(),
				}),
			],
			target: UPTIME_TARGET,
		}))
	}
}
