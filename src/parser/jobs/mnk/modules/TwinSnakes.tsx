import {Plural, Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import Combatants from 'parser/core/modules/Combatants'
import {Data} from 'parser/core/modules/Data'
import Enemies from 'parser/core/modules/Enemies'
import {EntityStatuses} from 'parser/core/modules/EntityStatuses'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import Suggestions, {SEVERITY, Suggestion, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

// Expected time to drop Twin in GL4 (basically part way thru previous GCD)
const TWIN_SNAKES_CYCLE_BUFFER = 3000

// Expected GCDs between TS in GL3 or lower
const TWIN_SNAKES_CYCLE_LENGTH = 5

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
	static handle = 'twinsnakes'

	@dependency private checklist!: Checklist
	@dependency private combatants!: Combatants
	@dependency private data!: Data
	@dependency private enemies!: Enemies
	@dependency private invuln!: Invulnerability
	@dependency private suggestions!: Suggestions
	@dependency private entityStatuses!: EntityStatuses

	private history: TwinState[] = []
	private twinSnake?: TwinState

	// Fury used without TS active
	private failedFury: number = 0

	// Clipping the duration, or dropping for more than TS itself
	private earlySnakes: number = 0
	private lateSnakes: number = 0

	// Separate accounting from the window, to handle counting while TS is down
	private gcdsSinceTS: number = 0

	protected init() {
		// Hook all GCDs so we can count GCDs in buff windows
		this.addEventHook('cast', {by: 'player'}, this.onCast)

		// This gets weird because, we don't wanna penalise if it was from FPF...
		this.addEventHook('applybuff', {to: 'player', abilityId: STATUSES.TWIN_SNAKES.id}, this.onGain)
		this.addEventHook('refreshbuff', {to: 'player', abilityId: STATUSES.TWIN_SNAKES.id}, this.onRefresh)
		this.addEventHook('removebuff', {to: 'player', abilityId: STATUSES.TWIN_SNAKES.id}, this.onDrop)

		this.addEventHook('complete', this.onComplete)
	}

	private onCast(event: CastEvent): void {
		const action = this.data.getAction(event.ability.guid)

		// Only include GCDs
		if (!action?.onGcd) {
			return
		}

		switch (action.id) {
		// Ignore TS itself, plus Form Shift and maybe 6SS?
		// We use gcdsSinceTS because we don't want to double count FPF
		case (ACTIONS.TWIN_SNAKES.id):
			if (this.twinSnake && !this.twinSnake.end && this.gcdsSinceTS < TWIN_SNAKES_CYCLE_LENGTH) {
				this.earlySnakes++
			}

		// Ignore Form Shift, theres probably forced downtime so we expect TS to get weird anyway
		case (ACTIONS.FORM_SHIFT.id):
			break

		// Count FPF, but check if it's a bad one
		case (ACTIONS.FOUR_POINT_FURY.id):
			if (!this.combatants.selected.hasStatus(STATUSES.TWIN_SNAKES.id)) {
				this.failedFury++
			}

		// Verify the window isn't closed, and count the GCDs
		default:
			if (this.twinSnake && !this.twinSnake.end) {
				this.twinSnake.casts.push(event)
			}

			this.gcdsSinceTS++
		}
	}

	// Only happens from TS itself
	// This might be better checking if the GCD before it was buffed but ehh
	private onGain(event: BuffEvent): void {
		if (this.twinSnake?.end) {
			const unbuffedGcds = this.gcdsSinceTS - this.twinSnake.gcds
			const unbuffedTime = event.timestamp - this.twinSnake.end
			// TODO: some kind of downtime check, maybe a warning for non-GL4
			if (unbuffedGcds > 1 || unbuffedTime > TWIN_SNAKES_CYCLE_BUFFER) {
				this.lateSnakes++
			}
		}

		// Start a new window
		this.twinSnake = new TwinState(event.timestamp, this.data)
		this.gcdsSinceTS = 0
	}

	// Can be TS or FPF - just reset the GCD count
	// This is ok even with the reduced duration from FPF provided user is in GL3/4
	private onRefresh(): void {
		this.gcdsSinceTS = 0
	}

	private onDrop(event: BuffEvent): void {
		this.stopAndSave(event.timestamp)
	}

	private onComplete() {
		// Close off the last window
		this.stopAndSave(this.parser.fight.end_time)

		// Calculate derped potency to early refreshes
		const lostTruePotency = this.earlySnakes * (ACTIONS.TRUE_STRIKE.potency - ACTIONS.TWIN_SNAKES.potency)

		this.checklist.add(new Rule({
			name: <Trans id="mnk.twinsnakes.checklist.name">Keep Twin Snakes up</Trans>,
			description: <Trans id="mnk.twinsnakes.checklist.description">Twin Snakes is an easy 10% buff to your DPS.</Trans>,
			displayOrder: DISPLAY_ORDER.TWIN_SNAKES,
			requirements: [
				new Requirement({
					name: <Trans id="mnk.twinsnakes.checklist.requirement.name"><ActionLink {...ACTIONS.TWIN_SNAKES} /> uptime</Trans>,
					percent: () => this.getBuffUptimePercent(STATUSES.TWIN_SNAKES.id),
				}),
			],
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.TWIN_SNAKES.icon,
			content: <Trans id="mnk.twinsnakes.suggestions.early.content">
				Avoid refreshing <ActionLink {...ACTIONS.TWIN_SNAKES} /> signficantly before its expiration as you're losing uses of the higher potency <ActionLink {...ACTIONS.TRUE_STRIKE} />.
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
			icon: ACTIONS.TWIN_SNAKES.icon,
			content: <Trans id="mnk.twinsnakes.suggestions.late.content">
				Refreshing <ActionLink {...ACTIONS.TWIN_SNAKES} /> on every third combo is a potency gain but only when you don't drop the buff for the GCD before it.
				This only works under 4 stacks of <StatusLink {...STATUSES.GREASED_LIGHTNING} />.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				4: SEVERITY.MAJOR,
			},
			value: this.lateSnakes,
			why: <Trans id="mnk.twinsnakes.suggestions.late.why">
				<Plural value={this.lateSnakes} one="# GCD was" other="# GCDs were" /> lost to delayed refreshing.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.FOUR_POINT_FURY.icon,
			content: <Trans id="mnk.twinsnakes.suggestions.toocalm.content">
				Try to get <StatusLink {...STATUSES.TWIN_SNAKES} /> up before using <ActionLink {...ACTIONS.FOUR_POINT_FURY} /> to take advantage of its free refresh.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
			},
			value: this.failedFury,
			why: <Trans id="mnk.twinsnakes.suggestions.toocalm.why">
				<Plural value={this.failedFury} one="# use" other="# uses" /> of <ActionLink {...ACTIONS.FOUR_POINT_FURY} /> failed to refresh <StatusLink {...STATUSES.TWIN_SNAKES} />.
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
		const fightUptime = this.parser.currentDuration - this.invuln.getInvulnerableUptime()

		return (statusUptime / fightUptime) * 100
	}
}
