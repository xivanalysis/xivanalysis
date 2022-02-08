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

/**
 * Base amount for the combo actions
 */
const BASE_GAUGE_GENERATION_AMOUNT = 10

/**
 * Base amount for the soul gauge consumption
 */
const BASE_GAUGE_CONSUMPTION_AMOUNT = 50
const PLENTIFUL_HARVEST_SHROUD_GENERATION_AMOUNT = 50
const ENSHROUD_GAUGE_CONSUMPTION = 50

/**
 * Amount generated for the "Soul" skills, which are cooldowns
 */
const SOUL_GAUGE_GENERATION_AMOUNT = 50

export class Gauge extends CoreGauge {
	@dependency private suggestions!: Suggestions

	private soulGeneratorModifiers = new Map<number, number>([
		[this.data.actions.SLICE.id, BASE_GAUGE_GENERATION_AMOUNT],
		[this.data.actions.WAXING_SLICE.id, BASE_GAUGE_GENERATION_AMOUNT],
		[this.data.actions.INFERNAL_SLICE.id, BASE_GAUGE_GENERATION_AMOUNT],
		[this.data.actions.SPINNING_SCYTHE.id, BASE_GAUGE_GENERATION_AMOUNT],
		[this.data.actions.NIGHTMARE_SCYTHE.id, BASE_GAUGE_GENERATION_AMOUNT],
		[this.data.actions.SOUL_SLICE.id, SOUL_GAUGE_GENERATION_AMOUNT],
		[this.data.actions.SOUL_SCYTHE.id, SOUL_GAUGE_GENERATION_AMOUNT],
	])

	private soulConsumptionModifiers = new Map<number, number>([
		[this.data.actions.BLOOD_STALK.id, BASE_GAUGE_CONSUMPTION_AMOUNT],
		[this.data.actions.GRIM_SWATHE.id, BASE_GAUGE_CONSUMPTION_AMOUNT],
		[this.data.actions.GLUTTONY.id, BASE_GAUGE_CONSUMPTION_AMOUNT],
		[this.data.actions.UNVEILED_GIBBET.id, BASE_GAUGE_CONSUMPTION_AMOUNT],
		[this.data.actions.UNVEILED_GALLOWS.id, BASE_GAUGE_CONSUMPTION_AMOUNT],
	])

	private shroudGeneratorModifiers = new Map<number, number>([
		[this.data.actions.GIBBET.id, BASE_GAUGE_GENERATION_AMOUNT],
		[this.data.actions.GALLOWS.id, BASE_GAUGE_GENERATION_AMOUNT],
		[this.data.actions.GUILLOTINE.id, BASE_GAUGE_GENERATION_AMOUNT],
		[this.data.actions.PLENTIFUL_HARVEST.id, PLENTIFUL_HARVEST_SHROUD_GENERATION_AMOUNT],
	])

	private shroudConsumerModifiers = new Map<number, number>([
		[this.data.actions.ENSHROUD.id, ENSHROUD_GAUGE_CONSUMPTION],
	])

	private soulGauge = this.add(new CounterGauge({
		minimum: 0,
		maximum: SOUL_MAX_VALUE,
		graph: {
			label: 'Soul Gauge',
			color: SOUL_GAUGE_COLOR.fade(0.25),
		},
		correctHistory: true,
	}))

	private shroudGauge = this.add(new CounterGauge({
		minimum: 0,
		maximum: SHROUD_MAX_VALUE,
		graph: {
			label: 'Shroud Gauge',
			color: SHROUD_GAUGE_COLOR.fade(0.25),
		},
		correctHistory: true,
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
            this.SoulGauge.spend(BASE_GAUGE_CONSUMPTION_AMOUNT)
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
				Try to not overcap Shroud gauge because it can lead to fewer uses of <DataLink action="ENSHROUD"/> over
				the course of the fight.
			</Trans>,
			tiers: {
				10: SEVERITY.MINOR,
				30: SEVERITY.MEDIUM,
				50: SEVERITY.MAJOR,
			},
			value: this.shroudGauge.overCap,
			why: <Trans id="rpr.gauge.suggestions.shroud-gauge-overcap.why">
				You lost {this.shroudGauge.overCap} Shroud due to overcapped gauge, which cost you {this.shroudGauge.overCap / ENSHROUD_GAUGE_CONSUMPTION} uses of Enshroud.
			</Trans>,
		}))
	}
}
