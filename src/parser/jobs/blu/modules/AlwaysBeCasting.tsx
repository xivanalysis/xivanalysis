import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {EventHook} from 'parser/core/Dispatcher'
import {filter, noneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {AlwaysBeCasting as CoreAlwaysBeCasting} from 'parser/core/modules/AlwaysBeCasting'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

const PHANTOM_FLURRY_CHANNEL_DURATION_MAX_MS = 5000
const PHANTOM_FLURRY_CHANNEL_WITH_KICK_DURATION_MS = 4000

const SURPANAKHA_ANIMATION_LOCK_MS = 1000

// Essentially a carbon copy of the MCH extension to ABC -- we want to treat
// Phantom Flurry as a Flamethrower-like.

// This also removes the time under Waning Nocturne (the second half of Moon Flute)
// from the ABC report.  Can't cast, am waning.

interface PhantomFlurryWindow {
	start: number
	end: number
	manualKick: boolean
	inMoonFlute: boolean
}

export class AlwaysBeCasting extends CoreAlwaysBeCasting {
	private phantomFlurryHistory: PhantomFlurryWindow[] = []
	private currentPhantomFlurry: PhantomFlurryWindow | undefined = undefined
	private phantomFlurryInterruptingActionHook?: EventHook<Events['action']>
	private surpanakhas: number = 0

	@dependency protected data!: Data
	@dependency private suggestions!: Suggestions
	@dependency private actors!: Actors

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

		const surpanakhaCastFilter = playerFilter
			.action(this.data.actions.SURPANAKHA.id)
			.type('action')

		this.addEventHook(phantomFlurryCastFilter, this.onApplyPhantomFlurry)
		this.addEventHook(phantomFlurryStatusFilter, this.onRemovePhantomFlurry)
		this.addEventHook(phantomFlurryKick, this.onPhantomFlurryFinalKick)
		this.addEventHook(surpanakhaCastFilter, this.onCastSurpanakha)
	}

	private onCastSurpanakha() {
		this.surpanakhas++
	}

	private onPhantomFlurryFinalKick() {
		// We go in here when someone uses Phantom Flurry and, instead of channeling
		// the entire effect, instead presses the button a second time.
		// For DPSes this is always bad, since you want Phantom Flurry to finish
		// off your Moon Flute.  For tank/healer, pressing this button at the last
		// possible moment is a DPS gain.
		//
		// So let's just use a very simple heuristic.  We'll say that we expect
		// the full 5000ms channel, BUT, if they used the kick, then they should
		// have waited at least 4000ms for most of the channel to have happened.

		const currentFlurry = this.currentPhantomFlurry ?? this.phantomFlurryHistory.at(-1)
		if (currentFlurry === null) { return }
		currentFlurry.manualKick = true
	}

	private onApplyPhantomFlurry(event: Events['action']) {
		if (this.currentPhantomFlurry != null) { return }

		this.currentPhantomFlurry = {
			start: event.timestamp,
			end: event.timestamp + this.data.statuses.PHANTOM_FLURRY.duration,
			manualKick: false,
			inMoonFlute: this.actors.current.hasStatus(this.data.statuses.WAXING_NOCTURNE.id),
		}
		const anyActionFilter = filter<Event>()
			.source(this.parser.actor.id)
			.action(noneOf([this.data.actions.PHANTOM_FLURRY.id]))
			.type('action')
		this.phantomFlurryInterruptingActionHook = this.addEventHook(anyActionFilter, this.onRemovePhantomFlurry)

		this.phantomFlurryHistory.push(this.currentPhantomFlurry)
	}

	private onRemovePhantomFlurry(event: Events['statusRemove'] | Events['action']) {
		if (this.currentPhantomFlurry == null) {
			return
		}
		if (this.phantomFlurryInterruptingActionHook == null) {
			return
		}

		this.currentPhantomFlurry.end = event.timestamp
		this.removeEventHook(this.phantomFlurryInterruptingActionHook)

		this.currentPhantomFlurry = undefined
		this.phantomFlurryInterruptingActionHook = undefined

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
		const flurryDuration = this.phantomFlurryHistory.reduce((acc, flurry) => {
			const downtime = this.downtime.getDowntime(
				flurry.start,
				flurry.end,
			)
			const phantomFlurryDurationOrGCD = Math.max(flurry.end - flurry.start, this.globalCooldown.getDuration())
			return acc + phantomFlurryDurationOrGCD - downtime
		}, 0)
		const surpanakhaDuration = this.surpanakhas * SURPANAKHA_ANIMATION_LOCK_MS
		const uptime = (this.gcdUptime + flurryDuration + surpanakhaDuration) / (fightDuration) * 100

		return uptime
	}

	override onComplete() {
		super.onComplete()

		// Since we were already tracking Phantom Flurry, go ahead and take
		// the chance to track if they dropped any damage ticks.
		const missingFlurryTicks = this.phantomFlurryHistory
			.reduce((acc, flurry) => {
				const flurryChannelMs = flurry.end - flurry.start
				const expectedFlurryChannel = (flurry.manualKick ? PHANTOM_FLURRY_CHANNEL_WITH_KICK_DURATION_MS : PHANTOM_FLURRY_CHANNEL_DURATION_MAX_MS)
				const missingFlurryChannelMs = expectedFlurryChannel - flurryChannelMs
				if (missingFlurryChannelMs <= 0) { return acc }

				const missingTicks = Math.ceil(missingFlurryChannelMs / 1000)
				return acc + missingTicks
			}, 0)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.PHANTOM_FLURRY.icon,
			content: <Trans id="blu.phantom_flurry.dropped_ticks.content">
				Dropping out of <DataLink action="PHANTOM_FLURRY" /> too early will lose damage ticks.  If you are in a <DataLink action="MOON_FLUTE" /> window you want to wait out the entire channel; if you are using it outside of a window and activating the final kick, wait until the last second the <DataLink status="PHANTOM_FLURRY" /> effect is active.
			</Trans>,
			why: <Trans id="blu.phantom_flurry.dropped_ticks.why">
				<Plural value={missingFlurryTicks ?? 0} one="# Phantom Flurry tick was" other="# Phantom Flurry ticks were" /> dropped due to cancelling the channel too early.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,  // 200/300 potency
				2: SEVERITY.MEDIUM, // 400/600 potency
				3: SEVERITY.MAJOR,  // 600/900 potency
			},
			value: missingFlurryTicks,
		}))

		// If they weren't in a Moon Flute, then they should have kicked!
		const missingFlurryKicks = this.phantomFlurryHistory
			.filter(flurry => !flurry.inMoonFlute && !flurry.manualKick)
			.length

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.PHANTOM_FLURRY_KICK.icon,
			content: <Trans id="blu.phantom_flurry.dropped_kicks.content">
				While the channel from <DataLink action="PHANTOM_FLURRY" /> is active, it becomes <DataLink action="PHANTOM_FLURRY_KICK" />, a 600 potency button.  If you are using <DataLink action="PHANTOM_FLURRY" /> outside of a <DataLink action="MOON_FLUTE" showIcon={false} /> window, then you should use the 600 potency button before the channel runs out.  Use this even if it means dropping the last tick of the channel.
			</Trans>,
			why: <Trans id="blu.phantom_flurry.dropped_kicks.why">
				<Plural value={missingFlurryKicks ?? 0} one="# Phantom Flurry big kick was" other="# Phantom Flurry big kicks were" /> dropped by not pressing the button again before the effect ran out.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM, // 390 potency
				2: SEVERITY.MAJOR, // 780 potency
			},
			value: missingFlurryKicks,
		}))

	}
}
