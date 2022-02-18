import {Trans} from '@lingui/react'
import Color from 'color'
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

const GAUGE_FADE = 0.25

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

	// Lemure's Shroud
	// We initialise to zero because without Enshroud you can't get more
	// History correction is enabled:
	//   you cannot rely on point-in-time gauge values and need the history in onComplete for any consuming modules
	private lemureShroud = this.add(new CounterGauge({
		maximum: 0,
		correctHistory: true,
		graph: {label: 'Lemure Shroud', color: Color(JOBS.PALADIN.colour).fade(GAUGE_FADE), collapse: true},
	}))

	// Void Shroud
	// We initialise to zero because without Lemure you can't get more
	// History correction is enabled:
	//   you cannot rely on point-in-time gauge values and need the history in onComplete for any consuming modules
	private voidShroud = this.add(new CounterGauge({
		maximum: 0,
		correctHistory: true,
		graph: {label: 'Void Shroud', color: Color(JOBS.REAPER.colour).fade(GAUGE_FADE), collapse: true},
	}))

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.ENSHROUDED.id), this.onEnshroud)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.ENSHROUDED.id), this.onDeshroud)
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(LEMURE_ACTIONS)), this.onLemure)
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(VOID_ACTIONS)), this.onVoid)

		// This is effectively emptying the gauge at end of fight for history
		this.addEventHook('complete', this.onDeshroud)
	}

	private onEnshroud() {
		// Pre-fill Lemure stacks to max, using generate as that's what the tooltip says it does internally
		this.lemureShroud.setMaximum(MAX_STACKS)
		this.lemureShroud.generate(MAX_STACKS)

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

		// Sanity check
		if (action == null || !this.actors.current.hasStatus(this.data.statuses.ENSHROUDED.id)) { return }

		// Communio gets special handling since it eats everything you have
		if (action.id === this.data.actions.COMMUNIO.id && this.lemureShroud.value > 0) {
			// Use set so we can lodge this reset as a spend rather than a reset
			this.lemureShroud.set(0, 'spend')
			return
		}

		// Adjust the gauges - Lemure spend actions generate Void
		this.lemureShroud.spend(LEMURE_MOD)
		this.voidShroud.generate(LEMURE_MOD)

		// Sanity check more - core gauge doesn't know that these are really a single shared gauge
		// We don't need to check this in Void actions because they only consume gauge, not generate
		if (this.lemureShroud.value + this.voidShroud.value > MAX_STACKS) {
			this.brokenLog.trigger(this, 'rpr.gauge.lemure.outofbounds',
				<Trans id="rpr.gauge.lemure.outofbounds.reason">
					<ActionLink {...action}/> can't be executed with {this.lemureShroud.value} stacks of Lemure's Shroud and {this.voidShroud.value} stacks of Void Shroud as this would go over the shared gauge max.
				</Trans>
			)
		}
	}

	private onVoid() {
		if (this.actors.current.hasStatus(this.data.statuses.ENSHROUDED.id)) {
			this.voidShroud.spend(VOID_COST)
		}
	}
}
