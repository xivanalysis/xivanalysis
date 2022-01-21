import {Trans} from '@lingui/react'
import Color from 'color'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const SOUL_MAX_VALUE = 100
const SHROUD_MAX_VALUE = 100

const SOUL_GAUGE_COLOR = Color('#DC0707FF')
const SHROUD_GAUGE_COLOR = Color('#2C9FCB')

const SOUL_GENERATORS: ActionKey[] = [
	'SLICE',
	'WAXING_SLICE',
	'INFERNAL_SLICE',
	'SPINNING_SCYTHE',
	'NIGHTMARE_SCYTHE',
	'SOUL_SLICE',
	'SOUL_SCYTHE',
]

const SOUL_CONSUMERS: ActionKey[] = [
	'BLOOD_STALK',
	'GRIM_SWATHE',
	'GLUTTONY',
	'UNVEILED_GIBBET',
	'UNVEILED_GALLOWS',
]

const SHROUD_GENERATORS: ActionKey[] = [
	'GIBBET',
	'GALLOWS',
	'GUILLOTINE',
	'PLENTIFUL_HARVEST',
]

const SHROUD_CONSUMERS: ActionKey[] = [
	'ENSHROUD',
]

export class Gauge extends CoreGauge {
	@dependency private suggestions!: Suggestions

	/* eslint-disable @typescript-eslint/no-magic-numbers */
	private soulGeneratorModifiers = new Map<number, number>([
		[this.data.actions.SLICE.id, 10],
		[this.data.actions.WAXING_SLICE.id, 10],
		[this.data.actions.INFERNAL_SLICE.id, 10],
		[this.data.actions.SPINNING_SCYTHE.id, 10],
		[this.data.actions.NIGHTMARE_SCYTHE.id, 10],
		[this.data.actions.SOUL_SLICE.id, 50],
		[this.data.actions.SOUL_SCYTHE.id, 50],
	])

	private soulConsumptionModifiers = new Map<number, number>([
		[this.data.actions.BLOOD_STALK.id, 50],
		[this.data.actions.GRIM_SWATHE.id, 50],
		[this.data.actions.GLUTTONY.id, 50],
		[this.data.actions.UNVEILED_GIBBET.id, 50],
		[this.data.actions.UNVEILED_GALLOWS.id, 50],
	])

	private shroudGeneratorModifiers = new Map<number, number>([
		[this.data.actions.GIBBET.id, 10],
		[this.data.actions.GALLOWS.id, 10],
		[this.data.actions.GUILLOTINE.id, 10],
		[this.data.actions.PLENTIFUL_HARVEST.id, 50],
	])

	private shroudConsumerModifiers = new Map<number, number>([
		[this.data.actions.ENSHROUD.id, 50],
	])

	private soulGauge = this.add(new CounterGauge({
		minimum: 0,
		maximum: SOUL_MAX_VALUE,
		graph: {
			label: 'Soul Gauge',
			color: SOUL_GAUGE_COLOR.fade(0.25),
		},
		correctHistory: true,
		deterministic: false,
	}))

	private shroudGauge = this.add(new CounterGauge({
		minimum: 0,
		maximum: SHROUD_MAX_VALUE,
		graph: {
			label: 'Shroud Gauge',
			color: SHROUD_GAUGE_COLOR.fade(0.25),
		},
		correctHistory: true,
		deterministic: false,
	}))

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		// soul gauge
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(SOUL_GENERATORS)), this.onSoulGeneration)
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(SOUL_CONSUMERS)), this.onSoulConsumption)

		// shroud gauge
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(SHROUD_GENERATORS)), this.onShroudGeneration)
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(SHROUD_CONSUMERS)), this.onShroudConsumption)

		this.addEventHook('complete', this.onComplete)
	}

	private onSoulGeneration(event: Events['action']) {
		const generatedAmount = this.soulGeneratorModifiers.get(event.action)
		if (generatedAmount) {
			this.soulGauge.generate(generatedAmount)
		}
	}

	private onSoulConsumption(event: Events['action']) {
		const spentAmount = this.soulConsumptionModifiers.get(event.action)
		if (spentAmount) {
			this.soulGauge.spend(spentAmount)
		}
	}

	private onShroudGeneration(event: Events['action']) {
		const generated = this.shroudGeneratorModifiers.get(event.action)
		if (generated) {
			this.shroudGauge.generate(generated)
		}
	}

	private onShroudConsumption(event: Events['action']) {
		const spent = this.shroudConsumerModifiers.get(event.action)
		if (spent) {
			this.shroudGauge.spend(spent)
		}
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.SOUL_SLICE.icon,
			content: <Trans id="rpr.gauge.suggestions.soul-gauge-overcap.content">
				Try to not overcap Soul gauge since it's required for shroud generation for your highest damaging skills
				via <DataLink action="ENSHROUD"/>.
				Pay special attention when using <DataLink action="SOUL_SLICE"/> or <DataLink action="SOUL_SCYTHE"/> as
				they increase the gauge by <b>50</b>, make sure you have <b>50</b> or less in your gauge before using.
			</Trans>,
			tiers: {
				10: SEVERITY.MINOR,
				30: SEVERITY.MEDIUM,
				50: SEVERITY.MAJOR,
			},
			value: this.soulGauge.overCap,
			why: <Trans id="rpr.gauge.suggestions.soul-gauge-overcap.why">
				You lost {this.soulGauge.overCap} Soul due to overcapped gauge.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.ENSHROUD.icon,
			content: <Trans id="rpr.gauge.suggestions.shroud-gauge-overcap.content">
				Try to not overcap Shroud gauge because it can lead to less usages of <DataLink action="ENSHROUD"/> over
				the course of the fight.
			</Trans>,
			tiers: {
				10: SEVERITY.MINOR,
				30: SEVERITY.MEDIUM,
				50: SEVERITY.MAJOR,
			},
			value: this.shroudGauge.overCap,
			why: <Trans id="rpr.gauge.suggestions.shroud-gauge-overcap.why">
				You lost {this.shroudGauge.overCap} Shroud due to overcapped gauge.
			</Trans>,
		}))
	}
}
