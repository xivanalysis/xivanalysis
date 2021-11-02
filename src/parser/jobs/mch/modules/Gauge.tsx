import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import Color from 'color'
import {DataLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Module'
import {Data} from 'parser/core/modules/Data'
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

const HEAT_COLOR = Color('#D35A10')
const BATTERY_COLOR = Color('#2C9FCB')

type GaugeModifier = Partial<Record<Event['type'], number>>

export class Gauge extends CoreGauge {
	static override title = t('mch.gauge.title')`Heat & Battery Gauge`

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private heat = this.add(new CounterGauge({
		chart: {label: 'Heat Gauge', color: HEAT_COLOR},
	}))

	private heatModifiers = new Map<number, GaugeModifier>([
		[this.data.actions.HEATED_SPLIT_SHOT.id, {action: 5}],
		[this.data.actions.HEATED_SLUG_SHOT.id, {action: 5}],
		[this.data.actions.HEATED_CLEAN_SHOT.id, {action: 5}],
		[this.data.actions.SPREAD_SHOT.id, {action: 5}],
		[this.data.actions.BARREL_STABILIZER.id, {action: 50}],
		[this.data.actions.HYPERCHARGE.id, {action: -50}],
	])

	private battery = this.add(new CounterGauge({
		chart: {label: 'Battery Gauge', color: BATTERY_COLOR},
	}))

	private batteryModifiers = new Map<number, GaugeModifier>([
		[this.data.actions.HEATED_CLEAN_SHOT.id, {action: 10}],
		[this.data.actions.AIR_ANCHOR.id, {action: 20}],
		[this.data.actions.AUTOMATON_QUEEN.id, {action: -50}],
	])

	private _lastQueenCost = 0

	override initialise() {
		super.initialise()

		const actionFilter = filter<Event>()
			.source(this.parser.actor.id)
			.type('action')

		const heatFilter = actionFilter.action(oneOf([...this.heatModifiers.keys()]))
		const batteryFilter = actionFilter.action(oneOf([...this.batteryModifiers.keys()]))

		this.addEventHook(heatFilter, this.onModifier(this.heat, this.heatModifiers))
		this.addEventHook(batteryFilter, this.onModifier(this.battery, this.batteryModifiers))
		this.addEventHook('complete', this.onComplete)
	}

	public get lastQueenCost(): number {
		return this._lastQueenCost
	}

	private onModifier(gauge: CounterGauge, modifiers: Map<number, GaugeModifier>) {
		return (event: Events['action']) => {
			const modifier = modifiers.get(event.action)
			if (modifier == null) { return }

			const amount = modifier[event.type] ?? 0

			if (event.action === this.data.actions.AUTOMATON_QUEEN.id) {
				// Ensure queen consumes its minimum cost at least
				this._lastQueenCost = Math.max(-amount, gauge.value)
				gauge.modify(-this.lastQueenCost)

			} else {
				gauge.modify(amount)
			}
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
