import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import Color from 'color'
import {DataLink} from 'components/ui/DbLink'
import {JOBS} from 'data/JOBS'
import {Event, Events} from 'event'
import {EventHook} from 'parser/core/Dispatcher'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

type GaugeModifier = Partial<Record<Event['type'], number>>

const FADE = 0.25
const SnilkColor = Color(JOBS.VIPER.colour).fade(FADE)

const SUGGESTION_TIERS = {
	25: SEVERITY.MEDIUM,
	50: SEVERITY.MAJOR,
}

export class snilk extends CoreGauge {
	static override title = t('vpr.gauge.title')`Serpent's Offerings Gauge`
	static override displayOrder = DISPLAY_ORDER.SNILK
	@dependency private suggestions!: Suggestions

	private snilkGauge = this.add(new CounterGauge({
		graph: {
			label: <Trans id="vpr.gauge.resource.kenkiLabel">Serpent's Offerings</Trans>,
			color: SnilkColor,
		},
	}))

	private snakeGaugeModifiers = new Map<number, GaugeModifier>([
		// Builders
		[this.data.actions.HUNTERS_COIL.id, {action: 5}],
		[this.data.actions.HUNTERS_DEN.id, {action: 5}],
		[this.data.actions.SWIFTSKINS_COIL.id, {action: 5}],
		[this.data.actions.SWIFTSKINS_DEN.id, {action: 5}],
		[this.data.actions.HINDSBANE_FANG.id, {action: 10}],
		[this.data.actions.HINDSTING_STRIKE.id, {action: 10}],
		[this.data.actions.FLANKSBANE_FANG.id, {action: 10}],
		[this.data.actions.FLANKSTING_STRIKE.id, {action: 10}],

		// Spenders
		[this.data.actions.REAWAKEN.id, {action: -50}],
	])

	private damageHook?: EventHook<Events['damage']>

	readyToAwaken = false

	override initialise() {
		super.initialise()

		const snakeActions = Array.from(this.snakeGaugeModifiers.keys())
		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(
			playerFilter
				.type(oneOf(['action', 'combo']))
				.action(oneOf(snakeActions)),
			this.onGaugeModifier,
		)
		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.READY_TO_REAWAKEN.id), () => this.readyToAwaken = true)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.READY_TO_REAWAKEN.id), () => this.readyToAwaken = false)

		this.addEventHook('complete', this.onComplete)
	}

	private onGaugeModifier(event: Events['action' | 'combo']) {
		const modifier = this.snakeGaugeModifiers.get(event.action)

		if (modifier == null)	{ return }

		if (this.readyToAwaken === true) { return } //If Ready to Reawaken, do not modify the gauge.

		const amount = modifier[event.type] ?? 0
		this.snilkGauge.modify(amount)

	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.REAWAKEN.icon,
			content: <Trans id="vpr.gauge.suggestions.loss.content">
				Avoid letting your Serpent's Gauge overcap - the wasted resources may cost you uses of your <DataLink action="REAWAKEN"/> burst.
			</Trans>,
			why: <Trans id="vpr.gauge.suggestions.loss.why">
				{this.snilkGauge.overCap} Seperent's Offerings lost to overcapping.
			</Trans>,
			tiers: SUGGESTION_TIERS,
			value: this.snilkGauge.overCap,
		}))
	}
}
