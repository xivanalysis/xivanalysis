import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import Color from 'color'
import {DataLink} from 'components/ui/DbLink'
import {Cause, Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const OVERCAP_SEVERITY = {
	HEAT: {
		5: SEVERITY.MINOR,
		20: SEVERITY.MEDIUM,
		30: SEVERITY.MAJOR,
	},
	BATTERY: {
		10: SEVERITY.MINOR,
		20: SEVERITY.MEDIUM,
		30: SEVERITY.MAJOR,
	},
}
const FADE_AMOUNT = 0.25
const HEAT_COLOR = Color('#D35A10').fade(FADE_AMOUNT)
const BATTERY_COLOR = Color('#2C9FCB').fade(FADE_AMOUNT)

interface GaugeModifier {
	event: 'action' | 'damage' | 'combo'
	type: 'generate' | 'spend' | 'queen'
	amount: number
}

type GaugeMap = Map<number, GaugeModifier>

export class Gauge extends CoreGauge {
	static override title = t('mch.gauge.title')`Heat & Battery Gauge`

	@dependency private suggestions!: Suggestions

	private heat = this.add(new CounterGauge({
		graph: {
			label: <Trans id="mch.gauge.resource.heat">Heat</Trans>,
			color: HEAT_COLOR,
		},
	}))

	private battery = this.add(new CounterGauge({
		graph: {
			label: <Trans id="mch.gauge.resource.battery">Battery</Trans>,
			color: BATTERY_COLOR,
		},
	}))

	private heatModifiers: GaugeMap = new Map([
		[this.data.actions.HEATED_SPLIT_SHOT.id, {event: 'damage', type: 'generate', amount: 5}],
		[this.data.actions.HEATED_SLUG_SHOT.id, {event: 'combo', type: 'generate', amount: 5}],
		[this.data.actions.HEATED_CLEAN_SHOT.id, {event: 'combo', type: 'generate', amount: 5}],
		[this.data.actions.SPREAD_SHOT.id, {event: 'damage', type: 'generate', amount: 5}],
		[this.data.actions.SCATTERGUN.id, {event: 'damage', type: 'generate', amount: 10}],
		[this.data.actions.BARREL_STABILIZER.id, {event: 'action', type: 'generate', amount: 50}],
		[this.data.actions.HYPERCHARGE.id, {event: 'action', type: 'spend', amount: 50}],
	])

	private batteryModifiers: GaugeMap = new Map([
		[this.data.actions.HEATED_CLEAN_SHOT.id, {event: 'combo', type: 'generate', amount: 10}],
		[this.data.actions.AIR_ANCHOR.id, {event: 'damage', type: 'generate', amount: 20}],
		[this.data.actions.CHAIN_SAW.id, {event: 'damage', type: 'generate', amount: 20}],
		[this.data.actions.AUTOMATON_QUEEN.id, {event: 'action', type: 'queen', amount: 50}],
	])

	private _lastQueenCost = 0

	private addGaugeHooks(gauge: CounterGauge, modifiers: GaugeMap) {
		const damageActions = []
		const castActions = []

		for (const [action, modifier] of modifiers.entries()) {
			modifier.event === 'damage' ?
				damageActions.push(action) :
				castActions.push(action)
		}

		const baseFilter = filter<Event>().source(this.parser.actor.id)

		const actionFilter = baseFilter
			.type(oneOf(['action', 'combo']))
			.action(oneOf(castActions))

		const damageFilter = baseFilter
			.type('damage')
			.cause(filter<Cause>()
				.type('action')
				.action(oneOf(damageActions))
			)

		this.addEventHook(actionFilter, this.onAction(gauge, modifiers))
		this.addEventHook(damageFilter, this.onDamage(gauge, modifiers))
	}

	override initialise() {
		super.initialise()

		this.addGaugeHooks(this.heat, this.heatModifiers)
		this.addGaugeHooks(this.battery, this.batteryModifiers)
		this.addEventHook('complete', this.onComplete)
	}

	public get lastQueenCost() {
		return this._lastQueenCost
	}

	private onAction(gauge: CounterGauge, modifiers: GaugeMap) {
		return (event: Events['action' | 'combo']) => {
			const modifier = modifiers.get(event.action)

			if (modifier && modifier.event === event.type) {
				this.modifyGauge(gauge, modifier)
			}
		}
	}

	private onDamage(gauge: CounterGauge, modifiers: GaugeMap) {
		return (event: Events['damage']) => {
			if (event.cause.type === 'status') { return }

			const modifier = modifiers.get(event.cause.action)

			if (modifier) {
				this.modifyGauge(gauge, modifier)
			}
		}
	}

	private modifyGauge(gauge: CounterGauge, modifier: GaugeModifier) {
		if (modifier.type === 'queen') {
			this._lastQueenCost = gauge.value
			gauge.reset()

		} else if (modifier.type === 'generate') {
			gauge.generate(modifier.amount)

		} else {
			gauge.spend(modifier.amount)
		}
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.HYPERCHARGE.icon,
			content: <Trans id="mch.gauge.suggestions.heat-waste.content">
				Try not to let your Heat gauge overcap, as it may cost you Overheat windows over the course of the fight.
			</Trans>,
			tiers: OVERCAP_SEVERITY.HEAT,
			value: this.heat.overCap,
			why: <Trans id="mch.gauge.suggestions.heat-waste.why">
				You lost {this.heat.overCap} Heat to an overcapped gauge.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.AUTOMATON_QUEEN.icon,
			content: <Trans id="mch.gauge.suggestions.battery-waste.content">
				Try not to let your Battery gauge overcap, as it may cost you <DataLink action="AUTOMATON_QUEEN" /> uses over the course of the fight.
			</Trans>,
			tiers: OVERCAP_SEVERITY.BATTERY,
			value: this.battery.overCap,
			why: <Trans id="mch.gauge.suggestions.battery-waste.why">
				You lost {this.battery.overCap} Battery to an overcapped gauge.
			</Trans>,
		}))
	}
}
