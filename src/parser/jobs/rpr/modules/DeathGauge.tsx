import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {JOBS} from 'data/JOBS'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import BrokenLog from 'parser/core/modules/BrokenLog'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import React from 'react'

const MAX_STACKS = 5

export class DeathGauge extends CoreGauge {
	@dependency private actors!: Actors
	@dependency private brokenLog!: BrokenLog

	// Lemure's Shroud, the blue pips
	private lemureShroud = this.add(new CounterGauge({
		maximum: 0,
		graph: {label: 'Lemure Shroud', color: JOBS.MACHINIST.colour, collapse: false},
	}))

	private lemureStackModifiers = new Map<Action['id'], number>([
		[this.data.actions.VOID_REAPING.id, 1],
		[this.data.actions.CROSS_REAPING.id, 1],
		[this.data.actions.GRIM_REAPING.id, 1],
		[this.data.actions.COMMUNIO.id, 0],
	])

	// Void Shroud, the purple pips
	private voidShroud = this.add(new CounterGauge({
		maximum: 0,
		graph: {label: 'Void Shroud', color: JOBS.REAPER.colour, collapse: false},
	}))

	private voidStackModifiers = new Map<Action['id'], number>([
		// Communio kinda weird, needs at least 1, eats all and cancels shroud
		[this.data.actions.LEMURES_SLICE.id, 2],
		[this.data.actions.LEMURES_SCYTHE.id, 2],
	])

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		const lemureActions = Array.from(this.lemureStackModifiers.keys())
		const voidActions = Array.from(this.voidStackModifiers.keys())

		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.ENSHROUDED.id), this.onEnshroud)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.ENSHROUDED.id), this.onDeshroud)
		this.addEventHook(playerFilter.type('action').action(oneOf(lemureActions)),	this.onLemure)
		this.addEventHook(playerFilter.type('action').action(oneOf(voidActions)),	this.onVoid)
	}

	private onEnshroud() {
		// Pre-fill Lemure stacks to max
		this.lemureShroud.setMaximum(MAX_STACKS)
		this.lemureShroud.set(MAX_STACKS, 'changeBounds')

		// Technically this can be 5 but your window would end if it did
		this.voidShroud.setMaximum(MAX_STACKS - 1)
	}

	private onDeshroud() {
		this.lemureShroud.setMaximum(0)
		this.voidShroud.setMaximum(0)
	}

	private onLemure(event: Events['action']) {
		const action = this.data.getAction(event.action)
		if (action == null) { return }

		if (action.id === this.data.actions.COMMUNIO.id) {
			// Use set so we can lodge this reset as a spend rather than a reset
			this.lemureShroud.set(0, 'spend')
			return
		}

		const amount = this.lemureStackModifiers.get(action.id)

		// Sanity check
		if (amount == null || !this.actors.current.hasStatus(this.data.statuses.ENSHROUDED.id)) { return }

		// Sanity check more - this gauge counts down so inverts overcap
		if (amount > this.lemureShroud.value) {
			// how did this even happen, broken log yolo
			this.brokenLog.trigger(this, 'rpr.deathgauge.lemure.undercap',
				<Trans id="rpr.deathgauge.lemure.undercap.reason">
					<ActionLink {...action}/> can't be executed with only {this.lemureShroud.value} stacks of Lemure's Shroud.
				</Trans>
			)
		}

		// Sanity check morer - core gauge doesn't know that these are really a single shared gauge
		if (this.lemureShroud.value + this.voidShroud.value > MAX_STACKS) {
			// why is it like this
			this.brokenLog.trigger(this, 'rpr.deathgauge.lemure.outofbounds',
				<Trans id="rpr.deathgauge.lemure.outofbounds.reason">
					<ActionLink {...action}/> can't be executed with {this.lemureShroud.value} stacks of Lemure's Shroud and {this.voidShroud.value} stacks of Void Shroud as this would go over the shared gauge max.
				</Trans>
			)
		}

		this.lemureShroud.spend(amount)
		this.voidShroud.generate(amount)
	}

	private onVoid(event: Events['action']) {
		const action = this.data.getAction(event.action)
		if (action == null) { return }

		const amount = this.voidStackModifiers.get(action.id)

		if (amount == null || !this.actors.current.hasStatus(this.data.statuses.ENSHROUDED.id)) { return }

		if (this.voidShroud.value < amount) {
			// big wat
			this.brokenLog.trigger(this, 'rpr.deathgauge.void.undercap',
				<Trans id="rpr.deathgauge.void.undercap.reason">
					<ActionLink {...action}/> can't be executed with only {this.voidShroud.value} stacks of Void Shroud.
				</Trans>
			)
		}

		this.voidShroud.spend(amount)
	}
}
