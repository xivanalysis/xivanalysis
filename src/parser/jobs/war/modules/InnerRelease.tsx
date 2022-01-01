import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Action, ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {EventHook} from 'parser/core/Dispatcher'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const IR_STACKS_APPLIED = 3

const CHAOS_GCDS: ActionKey[] = [
	'INNER_CHAOS',
	'CHAOTIC_CYCLONE',
]

const GOOD_GCDS: ActionKey[] = [
	'FELL_CLEAVE',
	'DECIMATE',
]

interface ReleaseWindow {
	start: number
	end?: number
	casts: Array<Action['id']>
	rushing: boolean
}

export class InnerRelease extends Analyser {
	static override handle = 'ir'
	static override title = t('war.ir.title')`Inner Release`

	@dependency private actors!: Actors
	@dependency data!: Data
	@dependency suggestions!: Suggestions

	private current: ReleaseWindow | undefined
	private history: ReleaseWindow[] = []

	private innerHook?: EventHook<Events['action']>

	override initialise() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)

		// Only track IR gain since IR gives PRR anyway and PrimalChaos handles missed PRs
		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.INNER_RELEASE.id), this.onGain)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.INNER_RELEASE.id), this.onDrop)

		this.addEventHook('complete', this.onComplete)
	}

	private onCast(event: Events['action']): void {
		// No window so why are we here?
		if (this.current == null) { return }

		const action = this.data.getAction(event.action)

		// Only include GCDs
		if (action == null || !(action.onGcd ?? false)) { return }

		// Verify the window isn't closed, and count the GCDs
		if (this.current.end == null) {
			this.current.casts.push(action.id)
		}
	}

	private onGain(event: Events['statusApply']): void {
		// Check if existing window or not - mostly since we don't really care about stack count
		if (this.current == null) {
			this.current = {start: event.timestamp, casts: [], rushing: false}

			this.current.rushing = this.data.statuses.INNER_RELEASE.duration >= (this.parser.pull.timestamp + this.parser.pull.duration) - event.timestamp

			this.innerHook = this.addEventHook(
				filter<Event>()
					.source(this.parser.actor.id)
					.type('action'),
				this.onCast,
			)
		}
	}

	private onDrop(event: Events['statusRemove']): void {
		this.stopAndSave(event.timestamp)
	}

	private stopAndSave(endTime: number = this.parser.currentEpochTimestamp): void {
		if (this.current != null) {
			this.current.end = endTime

			this.history.push(this.current)

			if (this.innerHook != null) {
				this.removeEventHook(this.innerHook)
				this.innerHook = undefined
			}
		}

		this.current = undefined
	}

	private onComplete() {
		// Close off the last window
		this.stopAndSave(this.parser.pull.timestamp + this.parser.pull.duration)

		// Build our GCD filters
		const chaosGcds = CHAOS_GCDS.map(actionKey => this.data.actions[actionKey].id)
		const goodGcds = GOOD_GCDS.map(actionKey => this.data.actions[actionKey].id)

		const nonRushedReleases = this.history.filter(release => !release.rushing)

		// Extract our suggestion metrics from history
		// We ignore rushed windows for missed GCDs, also IC as a user might push for higher potency at end of fight
		const missedGcds = nonRushedReleases.reduce((total, current) => total + Math.max(0, (IR_STACKS_APPLIED - current.casts.filter(id => id !== this.data.actions.PRIMAL_REND.id).length)), 0)
		const badGcds = this.history.reduce((total, current) => total + (IR_STACKS_APPLIED - this.accountGcds(current, goodGcds)), 0)
		const veryBadGcds = this.history.reduce((total, current) => total + this.accountGcds(current, chaosGcds), 0)

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.INNER_RELEASE.icon,
			content: <Trans id="war.ir.suggestions.missedgcd.content">
				Try to land {IR_STACKS_APPLIED} GCDs during every <DataLink status="INNER_RELEASE"/> window.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			value: missedGcds,
			why: <Trans id="war.ir.suggestions.missedgcd.why">
				<Plural value={missedGcds} one="# stack" other="# stacks"/> of <DataLink showIcon={false} status="INNER_RELEASE"/> <Plural value={missedGcds} one="wasn't" other="weren't"/> used.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.FELL_CLEAVE.icon,
			content: <Trans id="war.ir.suggestions.badgcd.content">
				GCDs used during <DataLink action="INNER_RELEASE"/> should be limited to <DataLink action="FELL_CLEAVE"/> for optimal damage (or <DataLink action="DECIMATE"/> if three or more targets are present).
			</Trans>,
			tiers: {
				1: SEVERITY.MAJOR,
			},
			value: badGcds,
			why: <Trans id="war.ir.suggestions.badgcd.why">
				<Plural value={badGcds} one="# GCD" other="# GCDs"/> wasted <DataLink showIcon={false} status="INNER_RELEASE"/> stacks.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.INNER_CHAOS.icon,
			content: <Trans id="war.ir.suggestions.verybadgcd.content">
				Avoid using <DataLink action="INNER_CHAOS"/> or <DataLink action="CHAOTIC_CYCLONE"/> inside of <DataLink status="INNER_RELEASE"/> unless pushing downtime. These abilities are guaranteed to be a critical direct hit, and make no use of <DataLink showIcon={false} status="INNER_RELEASE"/>'s benefits.
			</Trans>,
			tiers: {
				1: SEVERITY.MAJOR,
			},
			value: veryBadGcds,
			why: <Trans id="war.ir.suggestions.verybadgcd.why">
				<Plural value={veryBadGcds} one="# stack" other="# stacks"/> of <DataLink status="INNER_RELEASE"/> <Plural value={veryBadGcds} one="was" other="were"/> lost to <DataLink action="INNER_CHAOS"/> or <DataLink action="CHAOTIC_CYCLONE"/>.
			</Trans>,
		}))
	}

	private accountGcds(window: ReleaseWindow, targetGcds: Array<Action['id']>): number {
		let count = 0
		let hits = 0

		// Skip PR since it doesn't eat stacks
		for (const id of window.casts) {
			if (id === this.data.actions.PRIMAL_REND.id) { continue }
			if (targetGcds.includes(id)) { hits++ }
			count++

			if (count >= IR_STACKS_APPLIED) { break }
		}

		// Ensure we're capped at max stacks, it shouldn't be possible to go over but better safe than sorry
		return Math.min(IR_STACKS_APPLIED, hits)
	}
}
