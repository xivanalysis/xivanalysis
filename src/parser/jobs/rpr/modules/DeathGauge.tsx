import {Trans} from '@lingui/react'
import Color from 'color'
import {ActionLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
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

const LEMURE_SHROUD_COLOR = Color('#4ec8dc')
const VOID_SHROUD_COLOR = Color('#b614c4')

export class DeathGauge extends CoreGauge {
	static override handle = 'deathGauge'

	@dependency private actors!: Actors
	@dependency private brokenLog!: BrokenLog

	// Lemure's Shroud
	// History correction is enabled:
	//   you cannot rely on point-in-time gauge values and need the history in onComplete for any consuming modules
	private lemureShroud = this.add(new CounterGauge({
		maximum: MAX_STACKS,
		correctHistory: true,
		graph: {handle: 'deathgauge', label: 'Lemure Shroud', color: LEMURE_SHROUD_COLOR.fade(GAUGE_FADE), collapse: true},
	}))

	// Void Shroud
	// History correction is enabled:
	//   you cannot rely on point-in-time gauge values and need the history in onComplete for any consuming modules
	private voidShroud = this.add(new CounterGauge({
		maximum: MAX_STACKS,
		correctHistory: true,
		graph: {handle: 'deathgauge', label: 'Void Shroud', color: VOID_SHROUD_COLOR.fade(GAUGE_FADE), collapse: true},
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

		this.resourceGraphs.addDataGroup({
			handle: 'deathgauge',
			label: <Trans id="rpr.gauge.resource.death">Death Gauge</Trans>,
			collapse: true,
			forceCollapsed: true,
			stacking: true,
		})
	}

	private onEnshroud() {
		// Pre-fill Lemure stacks to max, using generate as that's what the tooltip says it does internally
		this.lemureShroud.generate(MAX_STACKS)
	}

	private onDeshroud() {
		// Flush Lemure
		this.lemureShroud.reset()

		// Flush Void
		this.voidShroud.reset()
	}

	private onLemure(event: Events['action']) {
		const action = this.data.getAction(event.action)

		// Sanity check
		if (action == null || !this.actors.current.hasStatus(this.data.statuses.ENSHROUDED.id)) { return }

		// Communio gets special handling since it eats everything you have
		if (action.id === this.data.actions.COMMUNIO.id && this.lemureShroud.value > 0) {
			this.lemureShroud.spend(this.lemureShroud.value)
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
