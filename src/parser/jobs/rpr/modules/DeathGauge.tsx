import {Trans} from '@lingui/react'
import Color from 'color'
import {ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import {EnumGauge} from 'parser/core/modules/Gauge/EnumGauge'
import {GAUGE_FADE} from 'parser/core/modules/ResourceGraphs/ResourceGraphs'
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

const LEMURE_SHROUD = 'lemure'
const VOID_SHROUD = 'void'

const LEMURE_SHROUD_COLOR = Color('#4ec8dc').fade(GAUGE_FADE)
const VOID_SHROUD_COLOR = Color('#b614c4').fade(GAUGE_FADE)

export class DeathGauge extends CoreGauge {
	static override handle = 'deathGauge'

	@dependency private actors!: Actors

	private deathGauge = this.add(new EnumGauge({
		maximum: MAX_STACKS,
		options: [
			{
				value: VOID_SHROUD,
				label: <Trans id="rpr.deathgauge.void-shroud.label">Void Shroud</Trans>,
				color: VOID_SHROUD_COLOR,
			},
			{
				value: LEMURE_SHROUD,
				label: <Trans id="rpr.deathgauge.lemure-shroud.label">Lemure Shroud</Trans>,
				color: LEMURE_SHROUD_COLOR,
			},
		],
		graph: {
			handle: 'deathgaugee',
			label: <Trans id="rpr.gauge.resource.death">Death Gauge</Trans>,
			tooltipHideWhenEmpty: true, // Death gauge is only interesting while in Enshroud, so hide the tooltip if we're not Enshrouded
		},
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
		this.deathGauge.generate(LEMURE_SHROUD, MAX_STACKS)
	}

	private onDeshroud() {
		this.deathGauge.reset()
	}

	private onLemure(event: Events['action']) {
		const action = this.data.getAction(event.action)

		// Sanity check
		if (action == null || !this.actors.current.hasStatus(this.data.statuses.ENSHROUDED.id)) { return }

		// Communio gets special handling since it eats everything you have
		const lemureShroudValue = this.deathGauge.getCountAt(LEMURE_SHROUD)
		if (action.id === this.data.actions.COMMUNIO.id && lemureShroudValue > 0) {
			this.deathGauge.spend(LEMURE_SHROUD, lemureShroudValue)
			return
		}

		// Adjust the gauges - Lemure spend actions generate Void
		this.deathGauge.spend(LEMURE_SHROUD, LEMURE_MOD)
		this.deathGauge.generate(VOID_SHROUD, LEMURE_MOD)
	}

	private onVoid() {
		if (this.actors.current.hasStatus(this.data.statuses.ENSHROUDED.id)) {
			this.deathGauge.spend(VOID_SHROUD, VOID_COST)
		}
	}
}
