import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {JOBS} from 'data/JOBS'
import {Event, Events} from 'event'
import {EventHook} from 'parser/core/Dispatcher'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {CounterGauge} from 'parser/core/modules/Gauge'
import {Gauge as CoreGauge} from 'parser/core/modules/Gauge/Gauge'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const GAUGE_GAIN_AMOUNT = 10

// Start at 30 because you can overcap when seraph is out and you can't drain the gauge
const OVERCAP_SEVERITY = {
	30: SEVERITY.MINOR,
	50: SEVERITY.MEDIUM,
	70: SEVERITY.MAJOR,
}

const GAUGE_GENERATORS: ActionKey[] = [
	'SCH_ENERGY_DRAIN',
	'LUSTRATE',
	'INDOMITABILITY',
	'SACRED_SOIL',
	'EXCOGITATION',
]

const FAERIE_SUMMONERS: ActionKey[] = [
	'SUMMON_EOS',
	'SUMMON_SELENE',
]

export class FaerieGauge extends CoreGauge {
	static override handle = 'faeriegauge'
	static override title = t('sch.gauge.title')`Faerie Gauge Usage`

	@dependency private suggestions!: Suggestions
	// Defaults
	private gauge = this.add(new CounterGauge({
		graph: {
			label: <Trans id="sch.gauge.faerie.label">Faerie Gauge</Trans>,
			color: JOBS.SCHOLAR.colour,
		},
	}))

	private fairyOut: boolean = false
	private actorPets = this.parser.pull.actors.filter(actor => actor.owner != null && actor.owner.id === this.parser.actor.id).map(pet => pet.id)
	private petHook?: EventHook<Events['action']>

	override initialise() {
		super.initialise()
		const playerFilter = filter<Event>().source(this.parser.actor.id)

		//Faerie Summon same as the generation actions, this list is only used once.
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(FAERIE_SUMMONERS)), this.onSummon)

		//sanity check, your pets can't take actions if they're not out.
		this.petHook = this.addEventHook(filter<Event>().source(oneOf(this.actorPets)), this.onSummon)

		//Consumers
		this.addEventHook(filter<Event>()
			.type('heal')
			.source(oneOf(this.actorPets))
			.cause(this.data.matchCauseStatus(['FEY_UNION'])),
		this.onGaugeSpend)

		//generators
		this.addEventHook(playerFilter
			.type('action')
			.action(this.data.matchActionId(GAUGE_GENERATORS)),
		this.onGaugeGenerate)

		//Death
		this.addEventHook('death', () => this.fairyOut = false)
		//Dissipation (Faerie is automatically re-summoned at status expiration)
		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.DISSIPATION.id), () => this.fairyOut = false)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.DISSIPATION.id), () => this.fairyOut = true)

		this.addEventHook('complete', this.onComplete)
	}

	private onSummon() {
		this.fairyOut = true
		if (this.petHook != null) {
			this.removeEventHook(this.petHook)
		}
	}

	//all spenders consume 10 gauge per event
	private onGaugeSpend() {
		this.gauge.spend(GAUGE_GAIN_AMOUNT)
	}

	private onGaugeGenerate() {
		if (this.fairyOut) {
			this.gauge.generate(GAUGE_GAIN_AMOUNT)
		}
	}
	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.SUMMON_SERAPH.icon,
			content: <Trans id="sch.faeriegauge.overcap.content">
					Use <DataLink action="FEY_UNION" /> when your Faerie Gauge is high to spend gauge and avoid using Aetherflow abilities when your Faerie Gauge is full.
			</Trans>,
			tiers: OVERCAP_SEVERITY,
			value: this.gauge.overCap,
			why: <Trans id="sch.faeriegauge.overcap.why">

					You lost a total of {this.gauge.overCap} Faerie Gauge over the course of the fight due to overcapping.
			</Trans>,
		}))
	}
}
