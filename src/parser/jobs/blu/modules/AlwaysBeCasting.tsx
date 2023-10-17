import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {History} from 'parser/core/modules/ActionWindow/History'
import {Actors} from 'parser/core/modules/Actors'
import {AlwaysBeCasting as CoreAlwaysBeCasting} from 'parser/core/modules/AlwaysBeCasting'
import {SimpleStatistic, Statistics} from 'parser/core/modules/Statistics'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

const PHANTOM_FLURRY_CHANNEL_DURATION_MAX_MS = 5000
const PHANTOM_FLURRY_CHANNEL_WITH_KICK_DURATION_MS = 4000

const APOKALYPSIS_CHANNEL_DURATION_MAX_MS = 10000

const SURPANAKHA_ANIMATION_LOCK_MS = 1000

// Essentially a carbon copy of the MCH extension to ABC -- we want to treat
// Phantom Flurry as a Flamethrower-like.

// This also removes the time under Waning Nocturne (the second half of Moon Flute)
// from the ABC report. Can't cast, am waning.

interface ChannelWindow {
	manualKick: boolean
	inMoonFlute: boolean
	actionId: number
}

export class AlwaysBeCasting extends CoreAlwaysBeCasting {
	private diamondBackHistory: History<boolean> = new History<boolean>(() => (true))
	private channelHistory: History<ChannelWindow> = new History<ChannelWindow>(() => ({
		manualKick: false,
		inMoonFlute: false,
		actionId: 0,
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
			<li>The <DataLink action="PHANTOM_FLURRY" /> and <DataLink action="APOKALYPSIS" /> channels</li>
			<li>The <DataLink action="SURPANAKHA" /> oGCD spam</li>
		</ul>
	</Trans>

	@dependency private suggestions!: Suggestions
	@dependency private actors!: Actors
	@dependency private statistics!: Statistics

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		const channelCastFilter = playerFilter
			.action(oneOf([this.data.actions.PHANTOM_FLURRY.id, this.data.actions.APOKALYPSIS.id]))
			.type('action')
		const channelStatusFilter = playerFilter
			.status(oneOf([this.data.statuses.PHANTOM_FLURRY.id, this.data.statuses.APOKALYPSIS.id]))
			.type('statusRemove')
		const phantomFlurryKick = playerFilter
			.action(this.data.actions.PHANTOM_FLURRY_KICK.id)
			.type('action')
		this.addEventHook(channelCastFilter, this.onApplyChannel)
		this.addEventHook(channelStatusFilter, this.onRemoveChannel)
		this.addEventHook(phantomFlurryKick, this.onPhantomFlurryFinalKick)

		const surpanakhaCastFilter = playerFilter
			.action(this.data.actions.SURPANAKHA.id)
			.type('action')
		this.addEventHook(surpanakhaCastFilter, this.onCastSurpanakha)

		const diamondBackFilter = playerFilter.status(this.data.statuses.DIAMONDBACK.id)
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

		const allChannels = this.channelHistory.entries
		if (allChannels.length === 0) { return }
		const currentChannel = allChannels[allChannels.length - 1]
		if (currentChannel === null) { return }
		currentChannel.data.manualKick = true
	}

	private onApplyChannel(event: Events['action']) {
		const newChannel = this.channelHistory.openNew(event.timestamp)
		newChannel.data.inMoonFlute = this.actors.current.hasStatus(this.data.statuses.WAXING_NOCTURNE.id)
		newChannel.data.actionId = event.action
	}

	private onRemoveChannel(event: Events['statusRemove']) {
		this.channelHistory.closeCurrent(event.timestamp)
	}

	override considerCast(action: Action, castStart: number): boolean {
		if (action === this.data.actions.PHANTOM_FLURRY || action === this.data.actions.APOKALYPSIS) {
			this.debug(`${action.name} began channeling at ${this.parser.formatEpochTimestamp(castStart)}`)
			return false
		}

		return super.considerCast(action, castStart)
	}

	override getUptimePercent(): number {
		const fightDuration = this.parser.currentDuration - this.downtime.getDowntime()
		const maxChannelUptime = this.parser.pull.timestamp + this.parser.pull.duration
		const channelDuration = this.channelHistory.entries.reduce((acc, channel) => {
			const downtime = this.downtime.getDowntime(
				channel.start,
				channel.end ?? maxChannelUptime,
			)
			const channelDurationOrGCD = Math.max((channel.end ?? maxChannelUptime) - channel.start, this.globalCooldown.getDuration())
			return acc + channelDurationOrGCD - downtime
		}, 0)
		const surpanakhaDuration = this.surpanakhas * SURPANAKHA_ANIMATION_LOCK_MS
		const uptime = (this.gcdUptime + channelDuration + surpanakhaDuration) / (fightDuration) * 100

		return uptime
	}

	override onComplete() {
		super.onComplete()

		const endOfPullTimestamp = this.parser.pull.timestamp + this.parser.pull.duration
		this.channelHistory.closeCurrent(endOfPullTimestamp)
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
		const missingFlurryTicks = this.channelHistory.entries
			.filter(channel => channel.data.actionId === this.data.actions.PHANTOM_FLURRY.id)
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

		// And also report missing ticks for Apokalypsis
		const missingApokalypsisTicks = this.channelHistory.entries
			.filter(channel => channel.data.actionId === this.data.actions.APOKALYPSIS.id)
			.reduce((acc, apoka) => {
				const apokaChannelMs = (apoka.end ?? endOfPullTimestamp) - apoka.start
				const missingChannelMs = APOKALYPSIS_CHANNEL_DURATION_MAX_MS - apokaChannelMs
				if (missingChannelMs <= 0) { return acc }

				const missingTicks = Math.ceil(missingChannelMs / 1000)
				return acc + missingTicks
			}, 0)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.APOKALYPSIS.icon,
			content: <Trans id="blu.apokalypsis.dropped_ticks.content">
				Dropping out of <DataLink action="APOKALYPSIS" /> too early will lose damage ticks.
			</Trans>,
			why: <Trans id="blu.apokalypsis.dropped_ticks.why">
				<Plural value={missingApokalypsisTicks} one="# Apokalypsis tick was" other="# Apokalypsis ticks were" /> dropped due to cancelling the channel too early.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,  // 140 pot
				2: SEVERITY.MEDIUM, // 380 pot
				3: SEVERITY.MAJOR,  // 520 pot
			},
			value: missingApokalypsisTicks,
		}))

		// If they weren't in a Moon Flute, then they should have kicked!
		const missingFlurryKicks = this.channelHistory.entries
			.filter(channel => channel.data.actionId === this.data.actions.PHANTOM_FLURRY.id)
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
