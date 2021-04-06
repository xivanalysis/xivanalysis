import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import Color from 'color'
import {ActionLink} from 'components/ui/DbLink'
import {ActionRoot} from 'data/ACTIONS/root'
import {CastEvent} from 'fflogs'
import {dependency} from 'parser/core/Module'
import BrokenLog from 'parser/core/modules/BrokenLog'
import {ComboEvent} from 'parser/core/modules/Combos'
import {Data} from 'parser/core/modules/Data'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import {ResourceDatum, ResourceGraphs} from 'parser/core/modules/ResourceGraphs'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const COLORS = {
	HEAT: Color('#D35A10'),
	BATTERY: Color('#2C9FCB'),
} as const

const OVERCAP_SEVERITY = {
	5: SEVERITY.MINOR,
	30: SEVERITY.MEDIUM,
	75: SEVERITY.MAJOR,
}

interface GaugeModifier {
	[key: string]: number | undefined
}

const HEAT_MODIFIERS = new Map<keyof ActionRoot, GaugeModifier>([
	// Builders
	['HEATED_SPLIT_SHOT', {cast: 5}],
	['HEATED_SLUG_SHOT', {combo: 5}],
	['HEATED_CLEAN_SHOT', {combo: 5}],
	['BARREL_STABILIZER', {cast: 50}],

	// Spenders
	['HYPERCHARGE', {cast: -50}],
])

const BATTERY_MODIFIERS = new Map<keyof ActionRoot, GaugeModifier>([
	// Builders
	['HEATED_CLEAN_SHOT', {combo: 10}],
	['AIR_ANCHOR', {cast: 20}],

	// Spenders
	['AUTOMATON_QUEEN', {cast: -50}],
	['ROOK_AUTOTURRET', {cast: -50}],
])

export default class Gauge extends CoreGauge {
	static title = t('mch.gauge.title')`Heat & Battery Gauge`

	@dependency private brokenLog!: BrokenLog
	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private heat = this.add(new CounterGauge({
		chart: {label: 'Heat', color: COLORS.HEAT},
		resource: {label: 'Heat', colour: COLORS.HEAT},
	}))

	private battery = this.add(new CounterGauge({
		chart: {label: 'Battery', color: COLORS.BATTERY},
		resource: {label: 'Battery', colour: COLORS.BATTERY},
	}))

	private HEAT_MODIFIERS = new Map<number, GaugeModifier>()
	private BATTERY_MODIFIERS = new Map<number, GaugeModifier>()

	public lastQueenCost = 0

	protected init() {
		super.init()

		HEAT_MODIFIERS.forEach((value, key) =>
			this.HEAT_MODIFIERS.set(this.data.actions[key].id, value))

		BATTERY_MODIFIERS.forEach((value, key) =>
			this.BATTERY_MODIFIERS.set(this.data.actions[key].id, value))

		this.addEventHook(
			['combo', 'cast'],
			{by: 'player', abilityId: Array.from(this.HEAT_MODIFIERS.keys())},
			this.onHeat,
		)

		this.addEventHook(
			['combo', 'cast'],
			{by: 'player', abilityId: Array.from(this.BATTERY_MODIFIERS.keys())},
			this.onBattery,
		)
	}

	private onHeat(event: CastEvent | ComboEvent) {
		const modifier = this.HEAT_MODIFIERS.get(event.ability.guid)

		if (modifier == null) {
			return
		}

		const amount = modifier[event.type] ?? 0

		if (this.heat.value + amount < 0) {
			this.flagHeatUnderflow()
		}

		this.heat.modify(amount)
	}

	private onBattery(event: CastEvent | ComboEvent) {
		const modifier = this.BATTERY_MODIFIERS.get(event.ability.guid)

		if (modifier == null) {
			return
		}

		const amount = modifier[event.type] ?? 0
		if (event.ability.guid === this.data.actions.AUTOMATON_QUEEN.id ||
			event.ability.guid === this.data.actions.ROOK_AUTOTURRET.id) {
			if (this.battery.value < amount) {
				this.flagBatteryUnderflow(event.ability.guid)
			}
			this.lastQueenCost = this.battery.value
			this.battery.set(0)
		} else {
			this.battery.modify(amount)
		}
	}

	private flagHeatUnderflow() {
		this.brokenLog.trigger(this, 'negative heat', (
			<Trans id="mch.gauge.trigger.negative-heat">
				<ActionLink {...this.data.actions.HYPERCHARGE}/> was used when the simulated Heat gauge was at {this.heat.value}.
			</Trans>
		))
	}

	private flagBatteryUnderflow(spenderId: number) {
		this.brokenLog.trigger(this, 'negative battery', (
			<Trans id="mch.gauge.trigger.negative-battery">
				<ActionLink {...this.data.getAction(spenderId)}/> was used when the simulated Battery gauge was at {this.battery.value}.
			</Trans>
		))
	}

	private onComplete() {
		const heatOvercap = this.heat.overCap
		const batteryOvercap = this.battery.overCap

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.HYPERCHARGE.icon,
			content: <Trans id="mch.gauge.suggestions.heat-waste.content">
				Try not to let your Heat gauge overcap, as it may cost you Overheat windows over the course of the fight.
			</Trans>,
			tiers: OVERCAP_SEVERITY,
			value: heatOvercap,
			why: <Trans id="mch.gauge.suggestions.heat-waste.why">
				You lost {heatOvercap} Heat to an overcapped gauge.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.AUTOMATON_QUEEN.icon,
			content: <Trans id="mch.gauge.suggestions.battery-waste.content">
				Try not to let your Battery gauge overcap, as it may cost you <ActionLink {...this.data.actions.AUTOMATON_QUEEN}/> uses over the course of the fight.
			</Trans>,
			tiers: OVERCAP_SEVERITY,
			value: batteryOvercap,
			why: <Trans id="mch.gauge.suggestions.battery-waste.why">
				You lost {batteryOvercap} Battery to an overcapped gauge.
			</Trans>,
		}))
	}
}
