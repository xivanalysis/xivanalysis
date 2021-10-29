import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {EventHook} from 'parser/core/Dispatcher'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {Statuses} from 'parser/core/modules/Statuses'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'
import {fillActions} from './utilities'

// Expected maximum time left to refresh TS
const TWIN_SNAKES_BUFFER = 6000

const TWIN_IGNORED_GCDS: ActionKey[] = [
	'FORM_SHIFT',
	'MEDITATION',
]

interface TwinState {
	casts: Array<Events['action']>
	start: number
	end?: number
}

export class TwinSnakes extends Analyser {
	static override handle = 'twinsnakes'

	@dependency private actors!: Actors
	@dependency private checklist!: Checklist
	@dependency private data!: Data
	@dependency private invulnerability!: Invulnerability
	@dependency private statuses!: Statuses
	@dependency private suggestions!: Suggestions

	private history: TwinState[] = []
	private ignoredGcds: number[] = []
	private twinSnake?: TwinState
	private lastRefresh: number = this.parser.pull.timestamp

	// Clipping the duration
	private earlySnakes: number = 0

	// Fury used without TS active
	private failedFury: number = 0

	// Antman used without TS active
	private failedAnts: number = 0

	private twinHook?: EventHook<Events['action']>

	override initialise() {
		this.ignoredGcds = fillActions(TWIN_IGNORED_GCDS, this.data)

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.TWIN_SNAKES.id), this.onGain)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.TWIN_SNAKES.id), this.onDrop)

		this.addEventHook('complete', this.onComplete)
	}

	private onCast(event: Events['action']): void {
		const action = this.data.getAction(event.action)

		// Only include GCDs
		if (!action?.onGcd) {
			return
		}

		// Ignore FS and Meditation
		if (this.ignoredGcds.includes(action.id)) { return }

		// Check for actions used without TS up. In the case of TS, the window will be opened
		// by the gain hook, so this GCD won't count anyway. For anything else, there's no
		// window so no need to count them.
		if (this.twinSnake == null) {
			// Did Anatman refresh TS?
			if (action.id === this.data.actions.ANATMAN.id) {
				this.failedAnts++
			}

			// Did FPF refresh TS?
			if (action.id === this.data.actions.FOUR_POINT_FURY.id) {
				this.failedFury++
			}

			// Since TS isn't active, we always return early
			return
		}

		// Verify the window isn't closed, and count the GCDs:
		if (this.twinSnake?.end != null) {
			// We still count TS in the GCD list of the window, just flag if it's early
			if (action.id === this.data.actions.TWIN_SNAKES.id) {
				const expected = this.data.statuses.TWIN_SNAKES.duration - TWIN_SNAKES_BUFFER
				if (event.timestamp - this.lastRefresh < expected) { this.earlySnakes++ }
			}

			this.twinSnake.casts.push(event)
		}
	}

	// // Can be TS, FPF, or Antman - new window for TS as needed, otherwise just reset the GCD count
	// This might be better checking if the GCD before it was buffed but ehh
	private onGain(event: Events['statusApply']): void {
		// Check if existing window or not
		if (this.twinSnake == null) {
			this.twinSnake = {start: event.timestamp, casts: []}

			// Hook all GCDs so we can count GCDs in buff windows
			this.twinHook = this.addEventHook(
				filter<Event>()
					.source(this.parser.actor.id)
					.type('action'),
				this.onCast,
			)
		}

		this.lastRefresh = event.timestamp
	}

	private onDrop(event: Events['statusRemove']): void {
		this.stopAndSave(event.timestamp)
	}

	private stopAndSave(endTime: number = this.parser.currentEpochTimestamp): void {
		if (this.twinSnake != null) {
			this.twinSnake.end = endTime

			this.history.push(this.twinSnake)

			if (this.twinHook != null) {
				this.removeEventHook(this.twinHook)
				this.twinHook = undefined
			}
		}

		this.twinSnake = undefined
	}

	private onComplete() {
		// Close off the last window
		this.stopAndSave(this.parser.pull.timestamp + this.parser.pull.duration)

		// Calculate derped potency to early refreshes
		const lostTruePotency = this.earlySnakes * (this.data.actions.TRUE_STRIKE.potency - this.data.actions.TWIN_SNAKES.potency)

		this.checklist.add(new Rule({
			name: <Trans id="mnk.twinsnakes.checklist.name">Keep Twin Snakes up</Trans>,
			description: <Trans id="mnk.twinsnakes.checklist.description">Twin Snakes is an easy 10% buff to your DPS.</Trans>,
			displayOrder: DISPLAY_ORDER.TWIN_SNAKES,
			requirements: [
				new Requirement({
					name: <Trans id="mnk.twinsnakes.checklist.requirement.name"><DataLink action="TWIN_SNAKES"/> uptime</Trans>,
					percent: () => this.getBuffUptimePercent(this.data.statuses.TWIN_SNAKES.id),
				}),
			],
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.TWIN_SNAKES.icon,
			content: <Trans id="mnk.twinsnakes.suggestions.early.content">
				Avoid refreshing <DataLink action="TWIN_SNAKES"/> signficantly before its expiration as you're losing uses of the higher potency <DataLink action="TRUE_STRIKE"/>.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				4: SEVERITY.MAJOR,
			},
			value: this.earlySnakes,
			why: <Trans id="mnk.twinsnakes.suggestions.early.why">
				{lostTruePotency} potency lost to <Plural value={this.earlySnakes} one="# early refresh" other="# early refreshes" />.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.FOUR_POINT_FURY.icon,
			content: <Trans id="mnk.twinsnakes.suggestions.toocalm.content">
				Try to get <DataLink status="TWIN_SNAKES"/> up before using <DataLink action="FOUR_POINT_FURY"/> to take advantage of its free refresh.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
			},
			value: this.failedFury,
			why: <Trans id="mnk.twinsnakes.suggestions.toocalm.why">
				<Plural value={this.failedFury} one="# use" other="# uses" /> of <DataLink action="FOUR_POINT_FURY"/> failed to refresh <DataLink status="TWIN_SNAKES"/>.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.ANATMAN.icon,
			content: <Trans id="mnk.twinsnakes.suggestions.antman.content">
				Try to get <DataLink status="TWIN_SNAKES"/> up before using <DataLink action="ANATMAN"/> to take advantage of its free refresh.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
			},
			value: this.failedAnts,
			why: <Trans id="mnk.twinsnakes.suggestions.antman.why">
				<Plural value={this.failedAnts} one="# use" other="# uses" /> of <DataLink action="ANATMAN"/> failed to refresh <DataLink status="TWIN_SNAKES"/>.
			</Trans>,
		}))
	}

	private getBuffUptimePercent(statusId: number): number {
		const status = this.data.getStatus(statusId)
		if (status == null) { return 0 }

		const statusUptime = this.statuses.getUptime(status, this.actors.current)
		const fightUptime = this.parser.currentDuration - this.invulnerability.getDuration({types: ['invulnerable']})

		return (statusUptime / fightUptime) * 100
	}
}
