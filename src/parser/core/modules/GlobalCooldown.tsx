import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {Event} from 'events'
import {Action} from 'data/ACTIONS'
import {isCastEvent, CastEvent} from 'fflogs'
import _ from 'lodash'
import Module, {dependency} from 'parser/core/Module'
import {Data} from 'parser/core/modules/Data'
import Downtime from 'parser/core/modules/Downtime'
import {ActionItem, ContainerRow, Timeline} from 'parser/core/modules/Timeline'
import {SimpleStatistic, Statistics} from 'parser/core/modules/Statistics'
import React from 'react'

/**
 * NOTE: Caster tax refers to spells taking 0.1s longer than their tooltip claims if their cast time is at least as long as their recast time.
 * See https://www.reddit.com/r/ffxiv/comments/8s05rn/the_recast_time_on_your_tooltip_can_be_up_to_85/, specifically:
 *    There is also another issue that influences how long recast times actually take that isn’t as heavily influenced by fps but is still affected,
 *    which is animation delay that happen between casts, this means that if you have a spell with a cast time that is equal to or
 *    greater than the recast time you will end up taking longer between casts than the (re)cast time. The delay is around 100 ms at 100+ fps
 */
const CASTER_TAX_MILLIS = 100
const BASE_GCD = 2.5
const BASE_GCD_MILLIS = 2500
const MIN_GCD_MILLIS = 1500

class GCDAction {
	action: Action
	events:
		| {beginCast?: undefined, cast: CastEvent}
		| {beginCast: CastEvent, cast?: CastEvent}

	constructor(event: CastEvent, action: Action, isBeginCast: boolean) {
		this.action = action
		if (isBeginCast) {
			this.events = {beginCast: event}
		} else {
			this.events = {cast: event}
		}
	}

	get hasBeginCastEvent(): boolean {
		return this.events.beginCast !== undefined
	}
	get hasCastEvent(): boolean {
		return this.events.cast !== undefined
	}

	get isInterrupted() {
		return this.events.beginCast != null && this.events.cast == null
	}

	get isInstant() {
		return this.events.cast != null && this.events.beginCast == null
	}

	get actionCastTime() {
		return this.isInstant ? 0 : this.action.castTime ?? 0
	}

	get actionBaseCooldown() {
		return this.action.gcdRecast ?? this.action.cooldown ?? BASE_GCD
	}

	get isCasterTaxed() {
		if (this.actionCastTime == null || this.actionBaseCooldown == null) { return false }
		return this.actionCastTime >= this.actionBaseCooldown
	}

	get intervalNormalisationFactor() {
		if (this.actionCastTime == null || this.actionBaseCooldown == null) { return 1 }
		return (this.actionCastTime > this.actionBaseCooldown) ? this.actionCastTime / BASE_GCD : this.actionBaseCooldown / BASE_GCD
	}

	get startTime(): number {
		return this.events.beginCast ? this.events.beginCast.timestamp : this.events.cast.timestamp
	}

	GCDLength(estimatedGCD: number) {
		let gcdLength = Math.max(this.actionCastTime, this.actionBaseCooldown) * 1000

		if (gcdLength > MIN_GCD_MILLIS) {
			const cooldownRatio = estimatedGCD / BASE_GCD_MILLIS
			gcdLength = Math.max(MIN_GCD_MILLIS, gcdLength * cooldownRatio)
		}

		return Math.round(gcdLength + (this.isCasterTaxed ? CASTER_TAX_MILLIS : 0))
	}
}

interface GCDInterval {
	firstAction: GCDAction,
	secondAction: GCDAction,
	interval: number,
	normalisedInterval: number,
}

export class GlobalCooldown extends Module {
	static handle = 'gcd'
	static debug = false
	static title = t('core.gcd.title')`Global Cooldown`

	@dependency private data!: Data
	@dependency private timeline!: Timeline
	@dependency private statistics!: Statistics
	@dependency private downtime!: Downtime

	gcds: GCDAction[] = []
	intervals: GCDInterval[] = []
	timelineRow: ContainerRow = new ContainerRow()

	protected init() {
		this.addEventHook('complete', this.onComplete)
	}

	normalise(events: Event[]): Event[] {
		events.forEach((event, idx) => {
			// Only consider cast or begincast events
			if (!isCastEvent(event)) { return }

			const action = this.data.getAction(event.ability.guid)

			// Skip actions that don't exist in the data file, or actions that are not onGcd
			if (!action || !action.onGcd) { return }

			if (event.type === 'begincast') {
				this.debug(`Started channeling ${action.name} at ${event.timestamp}`)
				this.gcds.push(new GCDAction(event, action, true))
			} else {
				const lastAction = _.last(this.gcds)
				if (lastAction && !lastAction.hasCastEvent && lastAction.action.id === action.id) {
					this.debug(`Completed channeled cast ${action.name} at ${event.timestamp}`)
					// Check if this was completing a begincast event
					lastAction.events.cast = event
				} else {
					// Otherwise this is a new instant cast
					this.debug(`Instant cast ${action.name} at ${event.timestamp}`)
					this.gcds.push(new GCDAction(event, action, false))
				}
			}
		})

		this._buildGCDIntervals()

		return events
	}

	onComplete() {
		const fightStart = this.parser.fight.start_time
		this.timelineRow = this.timeline.addRow(new ContainerRow({
			label: 'GCD',
			order: -98,
			collapse: true,
		}))

		this.gcds.forEach(action => {
			const actionStart = action.startTime - fightStart
			this.timelineRow.addItem(new ActionItem({
				start: actionStart,
				end: actionStart + action.GCDLength(this.estimatedGcd),
				action: action.action,
			}))
		})

		this.statistics.add(new SimpleStatistic({
			title: <Trans id="core.gcd.estimated-gcd">Estimated GCD</Trans>,
			icon: this.data.actions.ATTACK.icon,
			value: this.parser.formatDuration(this.estimatedGcd),
			info: (
				<Trans id="core.gcd.no-statistics">
					Unfortunately, player statistics are not available from FF Logs. As such, the calculated GCD length is an <em>estimate</em>, and may well be incorrect. If it is reporting a GCD length <em>longer</em> than reality, you likely need to focus on keeping your GCD rolling.
				</Trans>
			),
		}))
	}

	private _buildGCDIntervals() {
		for (let idx = 0; idx < this.gcds.length; idx++) {
			const gcd = this.gcds[idx]
			// Omit pre-pull channels because we don't have data on when they started channeling
			if (idx === 0 && !gcd.hasBeginCastEvent && gcd.action.castTime && gcd.action.castTime > 0) { continue }

			const nextGcd = this.gcds[idx+1]

			if (!gcd.isInterrupted && nextGcd) {
				let interval = nextGcd.startTime - gcd.startTime
				if (gcd.isCasterTaxed) {
					interval -= CASTER_TAX_MILLIS
				}

				const normalisedInterval = interval / gcd.intervalNormalisationFactor
				this.intervals.push({firstAction: gcd, secondAction: nextGcd, interval, normalisedInterval})
			}
		}
	}

	get estimatedGcd() {
		return this.getEstimate(true)
	}

	public getEstimate(bound = true) {
		// tslint:disable-next-line:no-magic-numbers
		const normalisedIntervals = this.intervals.map(interval => Math.round(interval.normalisedInterval / 10) * 10)
		const estimatedGcd = normalisedIntervals.length ? this._getMode(normalisedIntervals) : BASE_GCD_MILLIS

		return bound ? Math.max(MIN_GCD_MILLIS, Math.min(estimatedGcd, BASE_GCD_MILLIS)) : estimatedGcd
	}

	private _getMode(normalisedIntervals: number[]): number {
		const intervalFrequency = _.countBy(normalisedIntervals, num => num)
		const highestCount = _.max(Object.values(intervalFrequency))
		const mostFrequentIntervals = Object.keys(intervalFrequency).filter(key => intervalFrequency[key] === highestCount)

		return _.mean(mostFrequentIntervals)
	}

	public getUptime() {
		return this.gcds.reduce((acc, gcd, idx, src) => {
			if (gcd.isInterrupted) {
				// Cast was interrupted - do not count as uptime
				return acc
			}

			let duration = gcd.GCDLength(this.estimatedGcd)
			if (idx === 0 && !gcd.hasBeginCastEvent && gcd.action.castTime && gcd.action.castTime > 0) {
				duration = Math.min(duration, src[idx + 1].startTime - this.parser.fight.start_time)
			}
			const downtime = this.downtime.getDowntime(
				gcd.startTime,
				gcd.startTime + duration,
			)
			return acc + duration - downtime
		}, 0)
	}
}
