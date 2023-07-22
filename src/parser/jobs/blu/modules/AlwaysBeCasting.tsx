import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {EventHook} from 'parser/core/Dispatcher'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {History} from 'parser/core/modules/ActionWindow/History'
import {Actors} from 'parser/core/modules/Actors'
import {AlwaysBeCasting as CoreAlwaysBeCasting} from 'parser/core/modules/AlwaysBeCasting'
import {SimpleStatistic, Statistics} from 'parser/core/modules/Statistics'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

const PHANTOM_FLURRY_CHANNEL_DURATION_MAX_MS = 5000
const PHANTOM_FLURRY_CHANNEL_WITH_KICK_DURATION_MS = 4000

const SURPANAKHA_ANIMATION_LOCK_MS = 1000

// Essentially a carbon copy of the MCH extension to ABC -- we want to treat
// Phantom Flurry as a Flamethrower-like.

// This also removes the time under Waning Nocturne (the second half of Moon Flute)
// from the ABC report. Can't cast, am waning.

interface PhantomFlurryWindow {
	manualKick: boolean
	inMoonFlute: boolean
}

export class AlwaysBeCasting extends CoreAlwaysBeCasting {
	private diamondBackHistory: History<boolean> = new History<boolean>(() => (true))
	private phantomFlurryHistory: History<PhantomFlurryWindow> = new History<PhantomFlurryWindow>(() => ({
		manualKick: false,
		inMoonFlute: false,
	}))
	private surpanakhas: number = 0

	override gcdUptimeSuggestionContent: JSX.Element = <Trans id="blu.always-cast.description">
		Make sure you're always doing something. It's often better to make small
		mistakes while keeping the GCD rolling than it is to perform the correct
		rotation slowly.
		<br />
		For BLU, we count the following as GCD uptime:
		<ul>
			<li>Time spent under <DataLink action="DIAMONDBACK" /></li>
			<li><DataLink status="WANING_NOCTURNE" />, the forced downtime following a <DataLink action="MOON_FLUTE" /></li>
			<li>The <DataLink action="PHANTOM_FLURRY" /> channel</li>
			<li>The <DataLink action="SURPANAKHA" /> oGCD spam</li>
		</ul>
	</Trans>

	@dependency private suggestions!: Suggestions
	@dependency private actors!: Actors
	@dependency private statistics!: Statistics

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		const phantomFlurryCastFilter = playerFilter
			.action(this.data.actions.PHANTOM_FLURRY.id)
			.type('action')
		const phantomFlurryStatusFilter = playerFilter
			.status(this.data.statuses.PHANTOM_FLURRY.id)
			.type('statusRemove')
		const phantomFlurryKick = playerFilter
			.action(this.data.actions.PHANTOM_FLURRY_KICK.id)
			.type('action')

		const diamondBackFilter = playerFilter.status(this.data.statuses.DIAMONDBACK.id)

		const surpanakhaCastFilter = playerFilter
			.action(this.data.actions.SURPANAKHA.id)
			.type('action')

		this.addEventHook(phantomFlurryCastFilter, this.onApplyPhantomFlurry)
		this.addEventHook(phantomFlurryStatusFilter, this.onRemovePhantomFlurry)
		this.addEventHook(phantomFlurryKick, this.onPhantomFlurryFinalKick)
		this.addEventHook(surpanakhaCastFilter, this.onCastSurpanakha)
		this.addEventHook(diamondBackFilter.type('statusApply'), this.onDiamondBackApply)
		this.addEventHook(diamondBackFilter.type('statusRemove'), this.onDiamondBackRemove)
	}

	private onDiamondBackApply(event: Events['statusApply']) {
		this.diamondBackHistory.openNew(event.timestamp)
	}
	private onDiamondBackRemove(event: Events['statusRemove']) {
		this.diamondBackHistory.closeCurrent(event.timestamp)
	}

	private onCastSurpanakha() {
		this.surpanakhas++
	}

	private onPhantomFlurryFinalKick() {
		// We go in here when someone uses Phantom Flurry and, instead of channeling
		// the entire effect, instead presses the button a second time.
		// For DPSes this is always bad, since you want Phantom Flurry to finish
		// off your Moon Flute. For tank/healer, pressing this button at the last
		// possible moment is a DPS gain.
		//
		// So let's just use a very simple heuristic. We'll say that we expect
		// the full 5000ms channel, BUT, if they used the kick, then they should
		// have waited at least 4000ms for most of the channel to have happened.

		const allPhantomFlurries = this.phantomFlurryHistory.entries
		if (allPhantomFlurries.length === 0) { return }
		const currentFlurry = allPhantomFlurries[allPhantomFlurries.length - 1]
		if (currentFlurry === null) { return }
		currentFlurry.data.manualKick = true
	}

	private onApplyPhantomFlurry(event: Events['action']) {
		const newFlurry = this.phantomFlurryHistory.openNew(event.timestamp)
		newFlurry.data.inMoonFlute = this.actors.current.hasStatus(this.data.statuses.WAXING_NOCTURNE.id)
	}

	private onRemovePhantomFlurry(event: Events['statusRemove']) {
		this.phantomFlurryHistory.closeCurrent(event.timestamp)
	}

	override considerCast(action: Action, castStart: number): boolean {
		if (action === this.data.actions.PHANTOM_FLURRY) {
			this.debug(`Phantom Flurry began channeling at ${this.parser.formatEpochTimestamp(castStart)}`)
			return false
		}

		return super.considerCast(action, castStart)
	}

	override getUptimePercent(): number {
		const fightDuration = this.parser.currentDuration - this.downtime.getDowntime()
		const maxFlurryUptime = this.parser.pull.timestamp + this.parser.pull.duration
		const flurryDuration = this.phantomFlurryHistory.entries.reduce((acc, flurry) => {
			const downtime = this.downtime.getDowntime(
				flurry.start,
				flurry.end ?? maxFlurryUptime,
			)
			const phantomFlurryDurationOrGCD = Math.max((flurry.end ?? maxFlurryUptime) - flurry.start, this.globalCooldown.getDuration())
			return acc + phantomFlurryDurationOrGCD - downtime
		}, 0)
		const surpanakhaDuration = this.surpanakhas * SURPANAKHA_ANIMATION_LOCK_MS
		const uptime = (this.gcdUptime + flurryDuration + surpanakhaDuration) / (fightDuration) * 100

		return uptime
	}

	override onComplete() {
		super.onComplete()

		const endOfPullTimestamp = this.parser.pull.timestamp + this.parser.pull.duration
		this.phantomFlurryHistory.closeCurrent(endOfPullTimestamp)
		this.diamondBackHistory.closeCurrent(endOfPullTimestamp)

		const diamondBackTimeMs = this.diamondBackHistory.entries.reduce((acc, e) => {
			return acc + ((e.end ?? e.start) - e.start)
		}, 0)
		this.statistics.add(new SimpleStatistic({
			title: <Trans id="blue.diamondback.statistic.time">Time in Diamondback</Trans>,
			icon: this.data.actions.DIAMONDBACK.icon,
			value: this.parser.formatDuration(diamondBackTimeMs),
			info: <Trans id="blu.diamondback.statistic.info">
				The ABC report will count time spent under <DataLink action="DIAMONDBACK" /> as GCD uptime, but you should still aim to minimize this, since it means dropping damaging GCDs.
			</Trans>,
		}))

		// Since we were already tracking Phantom Flurry, go ahead and take
		// the chance to track if they dropped any damage ticks.
		const missingFlurryTicks = this.phantomFlurryHistory.entries
			.reduce((acc, flurry) => {
				const flurryChannelMs = (flurry.end ?? endOfPullTimestamp) - flurry.start
				const expectedFlurryChannel = (flurry.data.manualKick ? PHANTOM_FLURRY_CHANNEL_WITH_KICK_DURATION_MS : PHANTOM_FLURRY_CHANNEL_DURATION_MAX_MS)
				const missingFlurryChannelMs = expectedFlurryChannel - flurryChannelMs
				if (missingFlurryChannelMs <= 0) { return acc }

				const missingTicks = Math.ceil(missingFlurryChannelMs / 1000)
				return acc + missingTicks
			}, 0)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.PHANTOM_FLURRY.icon,
			content: <Trans id="blu.phantom_flurry.dropped_ticks.content">
				Dropping out of <DataLink action="PHANTOM_FLURRY" /> too early will lose damage ticks. If you are in a <DataLink action="MOON_FLUTE" /> window you want to wait out the entire channel. If you are using it outside of a window and activating the final kick, wait until the last second the <DataLink status="PHANTOM_FLURRY" showIcon={false} /> effect is active.
			</Trans>,
			why: <Trans id="blu.phantom_flurry.dropped_ticks.why">
				<Plural value={missingFlurryTicks} one="# Phantom Flurry tick was" other="# Phantom Flurry ticks were" /> dropped due to cancelling the channel too early.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,  // 200/300 potency
				2: SEVERITY.MEDIUM, // 400/600 potency
				3: SEVERITY.MAJOR,  // 600/900 potency
			},
			value: missingFlurryTicks,
		}))

		// If they weren't in a Moon Flute, then they should have kicked!
		const missingFlurryKicks = this.phantomFlurryHistory.entries
			.filter(flurry => !flurry.data.inMoonFlute && !flurry.data.manualKick)
			.length

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.PHANTOM_FLURRY_KICK.icon,
			content: <Trans id="blu.phantom_flurry.dropped_kicks.content">
				While the channel from <DataLink action="PHANTOM_FLURRY" /> is active, it becomes <DataLink action="PHANTOM_FLURRY_KICK" />, a 600 potency button. If you are using <DataLink action="PHANTOM_FLURRY" showIcon={false} /> outside of a <DataLink action="MOON_FLUTE" showIcon={false} /> window, then you should use the 600 potency button before the channel runs out. Use this even if it means dropping the last tick of the channel.
			</Trans>,
			why: <Trans id="blu.phantom_flurry.dropped_kicks.why">
				<Plural value={missingFlurryKicks} one="# Phantom Flurry big kick was" other="# Phantom Flurry big kicks were" /> dropped by not pressing the button again before the effect ran out.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM, // 390 potency
				2: SEVERITY.MAJOR, // 780 potency
			},
			value: missingFlurryKicks,
		}))

	}
}
