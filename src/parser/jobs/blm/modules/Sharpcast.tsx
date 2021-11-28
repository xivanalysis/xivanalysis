import {Trans, Plural} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'
import {Data} from 'parser/core/modules/Data'
import {SimpleStatistic, Statistics} from 'parser/core/modules/Statistics'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {StatusItem} from 'parser/core/modules/Timeline'
import React from 'react'
import {Gauge} from './Gauge'
import Procs from './Procs'

const SHARPCAST_CONSUMERS: ActionKey[] = [
	'FIRE_I',
	'THUNDER_III',
	'THUNDER_IV',
	'SCATHE',
	'PARADOX',
]

interface SharpcastWindow {
	start: number,
	stop?: number
}

interface SharpcastTracker {
	current?: SharpcastWindow,
	history: SharpcastWindow[]
}

export class Sharpcast extends Analyser {
	static override handle = 'sharpcast'

	@dependency private cooldownDowntime!: CooldownDowntime
	@dependency private data!: Data
	@dependency private procs!: Procs
	@dependency private statistics!: Statistics
	@dependency private suggestions!: Suggestions
	@dependency private gauge!: Gauge

	private buffWindows: SharpcastTracker = {
		history: [],
	}

	private droppedSharpcasts = 0
	private sharpedScathes = 0
	private usedSharpcasts = 0

	private sharpcastConsumerIds = SHARPCAST_CONSUMERS.map(key => this.data.actions[key].id)

	override initialise() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		const sharpcastFilter = playerFilter.status(this.data.statuses.SHARPCAST.id)
		this.addEventHook(sharpcastFilter.type('statusRemove'), this.onRemoveSharpcast)
		this.addEventHook(sharpcastFilter.type('statusApply'), this.onGainSharpcast)
		this.addEventHook(playerFilter.type('action').action(oneOf(this.sharpcastConsumerIds)), this.tryConsumeSharpcast)
		this.addEventHook({
			type: 'death',
			actor: this.parser.actor.id,
		}, this.onDeath)
		this.addEventHook('complete', this.onComplete)
	}

	private onRemoveSharpcast(event: Events['statusRemove']) {
		this.stopAndSave(event.timestamp)
	}

	private onGainSharpcast(event: Events['statusApply']) {
		this.usedSharpcasts++
		this.buffWindows.current = {
			start: event.timestamp,
		}
	}

	// Consolidate old onCast functions into one central function
	private onCast(event: Events['action']) {
		const actionId = event.action

		const action = this.data.getAction(actionId)
		if (action && action.onGcd) {
			this.tryConsumeSharpcast(event)
		}
	}

	private tryConsumeSharpcast(event: Events['action']) {
		const actionId = event.action

		// Paradox doesn't produce a Firestarter proc if not in Astral Fire
		if (actionId === this.data.actions.PARADOX && this.gauge.getGaugeState(event.timestamp).astralFire <= 0) {
			return
		}

		// If this proc is active, consume it
		if (this.buffWindows.current) {
			// Stop the buff window, and ensure it's not marked as a drop
			this.stopAndSave(event.timestamp, false)

			if (actionId === this.data.actions.SCATHE.id) {
				this.sharpedScathes++
			}
		}
	}

	private onDeath(event: Events['death']) {
		this.stopAndSave(event.timestamp)
	}

	private stopAndSave(endTime = this.parser.currentTimestamp, countDrops = true) {
		if (!this.buffWindows.current) {
			return
		}

		this.buffWindows.current.stop = endTime
		if (this.buffWindows.current.stop - this.buffWindows.current.start >= this.data.statuses.SHARPCAST.duration && countDrops) {
			this.droppedSharpcasts++
		}
		this.buffWindows.history.push(this.buffWindows.current)
		this.buffWindows.current = undefined
	}

	private onComplete() {
		// Finalise the buff if it was still active
		if (this.buffWindows.current) {
			this.stopAndSave()
		}

		const row = this.procs.getRowForStatus(this.data.statuses.SHARPCAST)

		const fightStart = this.parser.pull.timestamp

		// Add buff windows to the timeline
		this.buffWindows.history.forEach(window => {
			row.addItem(new StatusItem({
				status: this.data.statuses.SHARPCAST,
				start: window.start - fightStart,
				end: (window.stop ?? window.start) - fightStart,
			}))
		})

		// Gather the data for actual / expected
		const expected = this.cooldownDowntime.calculateMaxUsages({cooldowns: [this.data.actions.SHARPCAST]})
		const actual = this.usedSharpcasts
		let percent = actual / expected * 100
		if (process.env.NODE_ENV === 'production') {
			percent = Math.min(percent, 100)
		}

		// Suggestions to use sharpcasts that wore off.
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.statuses.SHARPCAST.icon,
			content: <Trans id="blm.sharpcast.suggestions.dropped-sharpcasts.content">
				You lost at least one guaranteed <DataLink status="THUNDERCLOUD" /> or <DataLink status="FIRESTARTER" /> proc by allowing <DataLink status="SHARPCAST" /> to fall off.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
			value: this.droppedSharpcasts,
			why: <Trans id="blm.sharpcast.suggestions.dropped-sharpcasts.why">
				<Plural value={this.droppedSharpcasts} one="# Sharpcast" other="# Sharpcasts"/> expired.
			</Trans>,
		}))

		// Suggestion not to overuse sharp-scathe
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.SCATHE.icon,
			content: <Trans id="blm.sharpcast.suggestions.sharpcasted-scathes.content">
				You consumed at least one <DataLink status="SHARPCAST" /> by using <DataLink action="SCATHE" />. While it's better than letting the buff expire, you should try to avoid doing so.
			</Trans>,
			tiers: { // Giving one extra usage before we start dinging med/major since there's kind of a reasonable use-case
				1: SEVERITY.MINOR,
				4: SEVERITY.MEDIUM,
				6: SEVERITY.MAJOR,
			},
			value: this.sharpedScathes,
			why: <Trans id="blm.sharpcast.suggestions.sharpcasted-scathes.why">
				<Plural value={this.sharpedScathes} one="# Sharpcast was" other="# Sharpcasts were"/> consumed by <DataLink action="SCATHE" />.
			</Trans>,
		}))

		//add a statistic for used sharps
		this.statistics.add(new SimpleStatistic({
			title: <Trans id="blm.sharpcast.statistic.title">Used Sharpcasts</Trans>,
			icon: this.data.actions.SHARPCAST.icon,
			value: `${actual}/${expected} (${percent.toFixed(1)}%)`,
			info: (
				<Trans id="blm.sharpcast.statistic.info">
					The number of Sharpcasts used versus the number of possible Sharpcast uses. Less than 100% is generally expected, but especially low usage could indicate misuse of the cooldown.
				</Trans>
			),
		}))
	}
}
