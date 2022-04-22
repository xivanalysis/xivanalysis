import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Action, ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {EventHook} from 'parser/core/Dispatcher'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

// Default case
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

	@dependency checklist!: Checklist
	@dependency data!: Data
	@dependency suggestions!: Suggestions

	private readonly stacksApplied = this.data.statuses.INNER_RELEASE.stacksApplied ?? IR_STACKS_APPLIED

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

			// If we're 6.1+, we only want FC+Decimate since nothing else eats stacks
			const playerFilter = filter<Event>().source(this.parser.actor.id)
			this.innerHook = this.parser.patch.before('6.1')
				? this.addEventHook(playerFilter.type('action'), this.onCast)
				: this.addEventHook(
					playerFilter
						.type('action')
						.action(this.data.matchActionId(GOOD_GCDS)),
					this.onCast)
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

		// Collect the guaranteed IR windows
		const nonRushedReleases = this.history.filter(release => !release.rushing)

		// Extract our suggestion metrics from history
		// We ignore rushed windows for missed GCDs since users tend to optmise this on a case-by-case basis
		const missedGcds = nonRushedReleases.reduce((total, current) => total + Math.max(0, (this.stacksApplied - current.casts.filter(id => id !== this.data.actions.PRIMAL_REND.id).length)), 0)
		const totalStacks = nonRushedReleases.length * this.stacksApplied
		const percentUsed = this.getPercentUsed(totalStacks, missedGcds)

		this.checklist.add(new Rule({
			name: <Trans id="war.ir.checklist.missedgcd.name">
				Use All Inner Release Stacks
			</Trans>,
			description: <Trans id="war.ir.checklist.missedgcd.description">
				<DataLink action="INNER_RELEASE"/> grants {this.stacksApplied} stacks to use on <DataLink action="FELL_CLEAVE"/> (or <DataLink action="DECIMATE"/> for 3 or more targets).
				Try to consume all stacks generated.
			</Trans>,
			target: 100,
			requirements: [
				new Requirement({
					name: <Trans id="war.ir.checklist.missedgcd.requirement.name">
						<DataLink action="INNER_RELEASE"/> stacks used
					</Trans>,
					overrideDisplay: `${totalStacks - missedGcds} / ${totalStacks} (${percentUsed}%)`,
					percent: percentUsed,
				}),
			],
		}))

		if (this.parser.patch.before('6.1')) {
			// Build our GCD filters
			const chaosGcds = CHAOS_GCDS.map(actionKey => this.data.actions[actionKey].id)
			const goodGcds = GOOD_GCDS.map(actionKey => this.data.actions[actionKey].id)

			// We ignore rushed windows for IC as a user might push for higher potency at end of fight
			const badGcds = this.history.reduce((total, current) => total + (this.stacksApplied - this.accountGcds(current, goodGcds)), 0)
			const veryBadGcds = nonRushedReleases.reduce((total, current) => total + this.accountGcds(current, chaosGcds), 0)

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
	}

	private accountGcds(window: ReleaseWindow, targetGcds: Array<Action['id']>): number {
		let count = 0
		let hits = 0

		// Skip PR since it doesn't eat stacks
		for (const id of window.casts) {
			if (id === this.data.actions.PRIMAL_REND.id) { continue }
			if (targetGcds.includes(id)) { hits++ }
			count++

			if (count >= this.stacksApplied) { break }
		}

		// Ensure we're capped at max stacks, it shouldn't be possible to go over but better safe than sorry
		return Math.min(this.stacksApplied, hits)
	}

	getPercentUsed(target: number, missed: number): string {
		const used = target - missed

		return ((used / target) * 100).toFixed(2)
	}
}
