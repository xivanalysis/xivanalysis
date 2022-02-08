import {Trans} from '@lingui/react'
import Color from 'color'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Event} from 'event'
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
]

/**
 * Actions on cooldown that generate souls, those generate
 * more souls than regular combo actions
 */
const SOUL_GENERATORS_CDS: ActionKey[] = [
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

	private soulGauge = this.add(new CounterGauge({
		minimum: 0,
		maximum: SOUL_MAX_VALUE,
		graph: {
			label: 'Soul Gauge',
			color: SOUL_GAUGE_COLOR.fade(0.25),
		},
	}))

	private shroudGauge = this.add(new CounterGauge({
		minimum: 0,
		maximum: SHROUD_MAX_VALUE,
		graph: {
			label: 'Shroud Gauge',
			color: SHROUD_GAUGE_COLOR.fade(0.25),
		},
	}))

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		// soul gauge
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(SOUL_GENERATORS)), this.onSoulGeneration)
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(SOUL_GENERATORS_CDS)), this.onSoulGenerationCds)
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(SOUL_CONSUMERS)), this.onSoulConsumption)
		this.addEventHook(playerFilter.type('action').action(this.data.actions.PLENTIFUL_HARVEST.id), this.onPlentifulHarvest)

		// shroud gauge
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(SHROUD_GENERATORS)), this.onShroudGeneration)
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(SHROUD_CONSUMERS)), this.onShroudConsumption)
		this.addEventHook(playerFilter.type('action').action(this.data.actions.ENSHROUD.id), this.onEnshroud)

		this.addEventHook('complete', this.onComplete)
	}

	private onSoulGeneration() {
		this.soulGauge.generate(BASE_GAUGE_GENERATION_AMOUNT)
	}

	private onSoulGenerationCds() {
		this.soulGauge.generate(SOUL_GAUGE_GENERATION_AMOUNT)
	}

	private onSoulConsumption() {
		this.soulGauge.spend(BASE_GAUGE_CONSUMPTION_AMOUNT)
	}

	private onShroudGeneration() {
		this.shroudGauge.generate(BASE_GAUGE_GENERATION_AMOUNT)
	}

	private onPlentifulHarvest() {
		this.shroudGauge.generate(PLENTIFUL_HARVEST_SHROUD_GENERATION_AMOUNT)
	}

	private onEnshroud() {
		this.shroudGauge.spend(ENSHROUD_GAUGE_CONSUMPTION)
	}

	private onShroudConsumption() {
		this.shroudGauge.spend(BASE_GAUGE_CONSUMPTION_AMOUNT)
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
