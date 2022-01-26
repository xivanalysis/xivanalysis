import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import Color from 'color'
import {JOBS} from 'data/JOBS'
import {Event} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {CounterGauge} from 'parser/core/modules/Gauge'
import {Gauge as CoreGauge} from 'parser/core/modules/Gauge/Gauge'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const GAUGE_GAIN_AMOUNT = 10
// Graph color
const GRAPH_COLOR = Color(JOBS.SCHOLAR.colour)
// Start at 30 because you can overcap when seraph is out and you can't drain the gauge
const OVERCAP_SEVERITY = {
	30: SEVERITY.MINOR,
	50: SEVERITY.MEDIUM,
	70: SEVERITY.MAJOR,
}
export default class FaerieGauge extends CoreGauge {
	static override handle = 'fairieGauge'
	static override title = t('sch.gauge.title')`Faerie Gauge Usage`

	@dependency private suggestions!: Suggestions
	// Defaults
	private gauge = this.add(new CounterGauge({
		chart: {label: 'Faerie Gauge', color: GRAPH_COLOR},
	}))
	private fairyOut: boolean = false
	private dissipationActive: boolean = false
	private actorPets = this.parser.pull.actors.filter(actor => actor.owner != null && actor.owner.id === this.parser.actor.id).map(pet => pet.id)

	override initialise() {
		super.initialise()
		const playerFilter = filter<Event>().source(this.parser.actor.id)

		//Faerie Summon
		this.addEventHook(playerFilter.type('action').action(oneOf([this.data.actions.SUMMON_EOS.id, this.data.actions.SUMMON_SELENE.id])), this.onSummon)
		//sanity check, your pets can't take actions if they're not out.
		this.addEventHook(filter<Event>().source(oneOf(this.actorPets)), this.onSummon)
		//Consumers
		this.addEventHook(filter<Event>().type('heal').source(oneOf(this.actorPets))
			.cause(this.data.matchCauseStatusId([this.data.statuses.FEY_UNION.id])), this.onGaugeSpend)
		this.addEventHook(playerFilter.type('action').action(this.data.actions.SCH_FEY_BLESSING.id), this.onGaugeSpend)
		//generators
		//I only use this list of actions once, so as ugly as it is, I think it's still better to inline it
		this.addEventHook(playerFilter.type('action').action(oneOf([
			this.data.actions.SCH_ENERGY_DRAIN.id,
			this.data.actions.LUSTRATE.id,
			this.data.actions.INDOMITABILITY.id,
			this.data.actions.SACRED_SOIL.id,
			this.data.actions.EXCOGITATION.id,
		])), this.onGaugeGenerate)
		//Death
		this.addEventHook('death', () => this.fairyOut = false)
		//Dissipation
		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.DISSIPATION.id), () => this.dissipationActive = true)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.DISSIPATION.id), () => this.dissipationActive = false)
		this.addEventHook('complete', this.onComplete)
	}

	private onSummon() {
		if (!(this.fairyOut || this.dissipationActive)) {
			this.fairyOut = true
		}
	}

	//all spenders consume 10 gauge per event
	private onGaugeSpend() {
		this.gauge.spend(GAUGE_GAIN_AMOUNT)
	}

	private onGaugeGenerate() {
		if (this.dissipationActive || !this.fairyOut) {
			// can't generate a guage without the fairy, so bail out
			return
		}

		this.gauge.generate(GAUGE_GAIN_AMOUNT)
	}
	private onComplete() {
		if (this.gauge.overCap > 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: this.data.actions.SUMMON_SERAPH.icon,
				content: <Trans id="sch.gauge.overcap.content">
					Avoid using Aetherflow abilities when your Faerie Gauge is already at 100.
				</Trans>,
				tiers: OVERCAP_SEVERITY,
				value: this.gauge.overCap,
				why: <Trans id="sch.gauge.overcap.why">
					You lost a total of {this.gauge.overCap} Faerie Gauge over the course of the fight due to overcapping.
				</Trans>,
			}))
		}
	}
}
