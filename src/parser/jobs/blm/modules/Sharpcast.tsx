import {Trans, Plural} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
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

	@dependency private data!: Data
	@dependency private procs!: Procs
	@dependency private suggestions!: Suggestions
	@dependency private gauge!: Gauge

	private buffWindows: SharpcastTracker = {
		history: [],
	}

	private droppedSharpcasts = 0
	private overwrittenSharpcasts = 0
	private sharpedScathes = 0

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
		if (this.buffWindows.current != null) {
			this.overwrittenSharpcasts++
		}
		this.buffWindows.current = {
			start: event.timestamp,
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

	private stopAndSave(endTime = this.parser.currentEpochTimestamp, countDrops = true) {
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

		// Suggestion not to overwrite Sharpcast
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.SHARPCAST.icon,
			content: <Trans id="blm.sharpcast.suggestions.overwrote-sharpcasts.content">
				You lost at least one guaranteed <DataLink status="THUNDERCLOUD" /> or <DataLink status="FIRESTARTER" /> proc by using <DataLink action="SHARPCAST" /> while the status was already active.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
			value: this.overwrittenSharpcasts,
			why: <Trans id="blm.sharpcast.suggestions.overwrote-sharpcasts.why">
				You overwrote <DataLink showIcon={false} status="SHARPCAST" /> <Plural value={this.overwrittenSharpcasts} one="# time" other="# times" />.
			</Trans>,
		}))
	}
}
