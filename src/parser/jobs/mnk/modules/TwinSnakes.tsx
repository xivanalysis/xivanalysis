import {Plural, Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {BuffEvent, CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import Combatants from 'parser/core/modules/Combatants'
import {Data} from 'parser/core/modules/Data'
import {EntityStatuses} from 'parser/core/modules/EntityStatuses'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

// Expected maximum time left to refresh TS
const TWIN_SNAKES_BUFFER = 6000

const TWIN_IGNORED_GCDS = [
	ACTIONS.FORM_SHIFT.id,
	ACTIONS.MEDITATION.id,
]

class TwinState {
	data: Data
	casts: CastEvent[] = []
	start: number
	end?: number

	constructor(timestamp: number, data: Data) {
		this.data = data
		this.start = timestamp
	}

	// Mainly here in case we care about oGCDs being unbuffed later
	public get gcds(): number {
		return this.casts.filter(event => {
			const action = this.data.getAction(event.ability.guid)
			return action?.onGcd
		}).length
	}
}

export default class TwinSnakes extends Module {
	static override handle = 'twinsnakes'

	@dependency private checklist!: Checklist
	@dependency private combatants!: Combatants
	@dependency private data!: Data
	@dependency private invulnerability!: Invulnerability
	@dependency private suggestions!: Suggestions
	@dependency private entityStatuses!: EntityStatuses

	private history: TwinState[] = []
	private twinSnake?: TwinState
	private lastRefresh: number = this.parser.fight.start_time

	// Clipping the duration
	private earlySnakes: number = 0

	// Fury used without TS active
	private failedFury: number = 0

	// Antman used without TS active
	private failedAnts: number = 0

	protected override init() {
		// Hook all GCDs so we can count GCDs in buff windows
		this.addEventHook('cast', {by: 'player'}, this.onCast)

		// This gets weird because, we don't wanna penalise if it was from FPF...
		this.addEventHook('applybuff', {to: 'player', abilityId: this.data.statuses.TWIN_SNAKES.id}, this.onGain)
		this.addEventHook('refreshbuff', {to: 'player', abilityId: this.data.statuses.TWIN_SNAKES.id}, this.onRefresh)
		this.addEventHook('removebuff', {to: 'player', abilityId: this.data.statuses.TWIN_SNAKES.id}, this.onDrop)

		this.addEventHook('complete', this.onComplete)
	}

	private onCast(event: CastEvent): void {
		const action = this.data.getAction(event.ability.guid)

		// Only include GCDs
		if (!action?.onGcd) {
			return
		}

		// Ignore FS and Meditation
		if (TWIN_IGNORED_GCDS.includes(action.id)) { return }

		// Check for actions used without TS up. In the case of TS, the window will be opened
		// by the gain hook, so this GCD won't count anyway. For anything else, there's no
		// window so no need to count them. We check on status rather than window being active
		// to make sure we don't get caught by any event ordering issues.
		if (!this.combatants.selected.hasStatus(this.data.statuses.TWIN_SNAKES.id)) {
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
		if (this.twinSnake && !this.twinSnake.end) {
			// We still count TS in the GCD list of the window, just flag if it's early
			if (action.id === this.data.actions.TWIN_SNAKES.id) {
				const expected = this.data.statuses.TWIN_SNAKES.duration - TWIN_SNAKES_BUFFER
				if (event.timestamp - this.lastRefresh < expected) { this.earlySnakes++ }
			}

			this.twinSnake.casts.push(event)
		}
	}

	// Only happens from TS itself
	// This might be better checking if the GCD before it was buffed but ehh
	private onGain(event: BuffEvent): void {
		this.twinSnake = new TwinState(event.timestamp, this.data)
		this.lastRefresh = event.timestamp
	}

	// Can be TS, FPF, or Antman - just reset the GCD count
	private onRefresh(event: BuffEvent): void {
		this.lastRefresh = event.timestamp
	}

	private onDrop(event: BuffEvent): void {
		this.stopAndSave(event.timestamp)
	}

	private onComplete() {
		// Close off the last window
		this.stopAndSave(this.parser.fight.end_time)

		// Calculate derped potency to early refreshes
		const lostTruePotency = this.earlySnakes * (this.data.actions.TRUE_STRIKE.potency - this.data.actions.TWIN_SNAKES.potency)

		this.checklist.add(new Rule({
			name: <Trans id="mnk.twinsnakes.checklist.name">Keep Twin Snakes up</Trans>,
			description: <Trans id="mnk.twinsnakes.checklist.description">Twin Snakes is an easy 10% buff to your DPS.</Trans>,
			displayOrder: DISPLAY_ORDER.TWIN_SNAKES,
			requirements: [
				new Requirement({
					name: <Trans id="mnk.twinsnakes.checklist.requirement.name"><ActionLink {...this.data.actions.TWIN_SNAKES} /> uptime</Trans>,
					percent: () => this.getBuffUptimePercent(this.data.statuses.TWIN_SNAKES.id),
				}),
			],
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.TWIN_SNAKES.icon,
			content: <Trans id="mnk.twinsnakes.suggestions.early.content">
				Avoid refreshing <ActionLink {...this.data.actions.TWIN_SNAKES} /> signficantly before its expiration as you're losing uses of the higher potency <ActionLink {...this.data.actions.TRUE_STRIKE} />.
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
				Try to get <StatusLink {...this.data.statuses.TWIN_SNAKES} /> up before using <ActionLink {...this.data.actions.FOUR_POINT_FURY} /> to take advantage of its free refresh.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
			},
			value: this.failedFury,
			why: <Trans id="mnk.twinsnakes.suggestions.toocalm.why">
				<Plural value={this.failedFury} one="# use" other="# uses" /> of <ActionLink {...this.data.actions.FOUR_POINT_FURY} /> failed to refresh <StatusLink {...this.data.statuses.TWIN_SNAKES} />.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.ANATMAN.icon,
			content: <Trans id="mnk.twinsnakes.suggestions.antman.content">
				Try to get <StatusLink {...this.data.statuses.TWIN_SNAKES} /> up before using <ActionLink {...this.data.actions.ANATMAN} /> to take advantage of its free refresh.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
			},
			value: this.failedAnts,
			why: <Trans id="mnk.twinsnakes.suggestions.antman.why">
				<Plural value={this.failedAnts} one="# use" other="# uses" /> of <ActionLink {...this.data.actions.ANATMAN} /> failed to refresh <StatusLink {...this.data.statuses.TWIN_SNAKES} />.
			</Trans>,
		}))
	}

	private stopAndSave(endTime: number = this.parser.currentTimestamp): void {
		if (this.twinSnake) {
			this.twinSnake.end = endTime
			this.history.push(this.twinSnake)
		}
	}

	private getBuffUptimePercent(statusId: number): number {
		const statusUptime = this.entityStatuses.getStatusUptime(statusId, this.combatants.getEntities())
		const fightUptime = this.parser.currentDuration - this.invulnerability.getDuration({types: ['invulnerable']})

		return (statusUptime / fightUptime) * 100
	}
}
