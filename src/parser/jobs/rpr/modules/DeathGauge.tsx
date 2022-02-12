import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {JOBS} from 'data/JOBS'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import BrokenLog from 'parser/core/modules/BrokenLog'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import React from 'react'

const MAX_STACKS = 5

// Lemure Shroud, the blue pips
const LEMURE_MOD = 1

const LEMURE_ACTIONS: ActionKey[] = [
	'VOID_REAPING',
	'CROSS_REAPING',
	'GRIM_REAPING',
	'COMMUNIO',
]

// Void Shroud, the purple pips
const VOID_COST = 2

const VOID_ACTIONS: ActionKey[] = [
	'LEMURES_SLICE',
	'LEMURES_SCYTHE',
]

export class DeathGauge extends CoreGauge {
	@dependency private actors!: Actors
	@dependency private brokenLog!: BrokenLog

	// Lemure's Shroud, the blue pips
	// We initialise to zero because without Enshroud you can't get more
	private lemureShroud = this.add(new CounterGauge({
		maximum: 0,
		graph: {label: 'Lemure Shroud', color: JOBS.PALADIN.colour, collapse: true},
	}))

	// Void Shroud, the purple pips
	// We initialise to zero because without Lemure you can't get more
	private voidShroud = this.add(new CounterGauge({
		maximum: 0,
		graph: {label: 'Void Shroud', color: JOBS.REAPER.colour, collapse: true},
	}))

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.ENSHROUDED.id), this.onEnshroud)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.ENSHROUDED.id), this.onDeshroud)
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(LEMURE_ACTIONS)), this.onLemure)
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(VOID_ACTIONS)), this.onVoid)
		this.addEventHook('complete', this.onDeshroud)
	}

	private onEnshroud() {
		// Pre-fill Lemure stacks to max
		this.lemureShroud.setMaximum(MAX_STACKS)
		this.lemureShroud.set(MAX_STACKS, 'changeBounds')

		// Technically this can be 5 but your window would end if it did
		this.voidShroud.setMaximum(MAX_STACKS - 1)
	}

	private onDeshroud() {
		// Flush Lemure
		this.lemureShroud.reset()
		this.lemureShroud.setMaximum(0)

		// Flush Void
		this.voidShroud.reset()
		this.voidShroud.setMaximum(0)
	}

	private onLemure(event: Events['action']) {
		const action = this.data.getAction(event.action)
		if (action == null) { return }

		// Sanity check
		if (!this.actors.current.hasStatus(this.data.statuses.ENSHROUDED.id)) { return }

		// Communio gets special handling since it eats everything you have
		if (action.id === this.data.actions.COMMUNIO.id && this.lemureShroud.value > 0) {
			// Use set so we can lodge this reset as a spend rather than a reset
			this.lemureShroud.set(0, 'spend')
			return
		}

		// Sanity check more - this gauge counts down so inverts overcap
		if (LEMURE_MOD > this.lemureShroud.value) {
			this.brokenLog.trigger(this, 'rpr.deathgauge.lemure.undercap',
				<Trans id="rpr.deathgauge.lemure.undercap.reason">
					<ActionLink {...action}/> can't be executed with only {this.lemureShroud.value} stacks of Lemure's Shroud.
				</Trans>
			)
		}

		// Sanity check morer - core gauge doesn't know that these are really a single shared gauge
		// We don't need to check this in Void actions because they only consume gauge, not generate
		if (this.lemureShroud.value + this.voidShroud.value > MAX_STACKS) {
			this.brokenLog.trigger(this, 'rpr.deathgauge.lemure.outofbounds',
				<Trans id="rpr.deathgauge.lemure.outofbounds.reason">
					<ActionLink {...action}/> can't be executed with {this.lemureShroud.value} stacks of Lemure's Shroud and {this.voidShroud.value} stacks of Void Shroud as this would go over the shared gauge max.
				</Trans>
			)
		}

		// Adjust the gauges - Lemure spend actions generate Void
		this.lemureShroud.spend(LEMURE_MOD)
		this.voidShroud.generate(LEMURE_MOD)
	}

	private onVoid(event: Events['action']) {
		const action = this.data.getAction(event.action)
		if (action == null) { return }

		if (!this.actors.current.hasStatus(this.data.statuses.ENSHROUDED.id)) { return }

		if (VOID_COST > this.voidShroud.value) {
			this.brokenLog.trigger(this, 'rpr.deathgauge.void.undercap',
				<Trans id="rpr.deathgauge.void.undercap.reason">
					<ActionLink {...action}/> can't be executed with only {this.voidShroud.value} stacks of Void Shroud.
				</Trans>
			)
		}

		this.voidShroud.spend(VOID_COST)
	}
}
