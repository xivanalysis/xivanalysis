import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {JOBS} from 'data/JOBS'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'

interface GemGaugeModifier {
	gem: number
}
interface GaugeBreaker {
	action: number,
	timestamp: number,
	gemsLost: number,
}
export const MINIMUM = 0
export const MAXIMUM = 3

export class GemGauge extends CoreGauge {
	static override handle = 'gemGauge'
	static override title = t('rdm.gemgauge.title')`Gem Gauge Usage`

	@dependency private suggestions!: Suggestions

	private gemGauge = this.add(new CounterGauge({
		graph: {
			label: <Trans id="rdm.gemgauge.resource.gems">Gems</Trans>,
			color: JOBS.RED_MAGE.colour,
		},
		maximum: MAXIMUM,
		minimum: MINIMUM,
	}))
	public gaugeModifiers = new Map<number, GemGaugeModifier>([
		[this.data.actions.ENCHANTED_REPRISE.id, {gem: 1}],
		[this.data.actions.ENCHANTED_MOULINET.id, {gem: 1}],
		[this.data.actions.ENCHANTED_RIPOSTE.id, {gem: 1}],
		[this.data.actions.ENCHANTED_ZWERCHHAU.id, {gem: 1}],
		[this.data.actions.ENCHANTED_REDOUBLEMENT.id, {gem: 1}],
	])
	public spenderModifiers = new Map<number, GemGaugeModifier>([
		[this.data.actions.VERHOLY.id, {gem: -1}],
		[this.data.actions.VERFLARE.id, {gem: -1}],
		[this.data.actions.SCORCH.id, {gem: -1}],
		[this.data.actions.RESOLUTION.id, {gem: -1}],
	])
	public gaugeBreakers: number[] = [
		this.data.actions.VERAERO.id,
		this.data.actions.VERAERO_II.id,
		this.data.actions.VERAERO_III.id,
		this.data.actions.VERSTONE.id,
		this.data.actions.VERTHUNDER.id,
		this.data.actions.VERTHUNDER_II.id,
		this.data.actions.VERTHUNDER_III.id,
		this.data.actions.VERFIRE.id,
		this.data.actions.JOLT.id,
		this.data.actions.JOLT_II.id,
		this.data.actions.IMPACT.id,
	]
	gaugeBreak: GaugeBreaker[] = []
	//Any loss is a major severity
	severity = {
		1: SEVERITY.MAJOR,
	}

	override initialise() {
		super.initialise()

		this.addEventHook(
			filter<Event>()
				.type('action')
				.source(this.parser.actor.id)
				.action(oneOf(Array.from(this.gaugeModifiers.keys()))),
			this.onGaugeModifying
		)
		this.addEventHook(
			filter<Event>()
				.type('action')
				.source(this.parser.actor.id)
				.action(oneOf(Array.from(this.spenderModifiers.keys()))),
			this.onGaugeSpender
		)
		this.addEventHook('complete', this.onComplete)
	}

	private onGaugeModifying(event: Events['action']) {
		const modifier = this.gaugeModifiers.get(event.action)

		if (modifier == null) {
			this.onGaugeBreak(event)
			return
		}

		this.gemGauge.modify(modifier.gem)
	}

	private onGaugeSpender(event: Events['action']) {
		const modifier = this.spenderModifiers.get(event.action)

		if (modifier == null) {
			this.onGaugeBreak(event)
			return
		}

		this.gemGauge.modify(modifier.gem)
	}

	private onGaugeBreak(event: Events['action']) {
		//It's only a break if we're above the minimum
		if (this.gaugeBreakers.includes(event.action) && this.gemGauge.value > MINIMUM) {
			const breaker = {} as GaugeBreaker
			breaker.action = event.action
			breaker.timestamp = event.timestamp
			breaker.gemsLost = this.gemGauge.value
			this.gaugeBreak.push(breaker)
			this.gemGauge.reset()
		}
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.RESOLUTION.icon,
			content: <Fragment>
				<Trans id="rdm.gemgauge.suggestions.gem-wasted-content">Ensure you don't overcap your Gems before using your finisher combo; overcapping Gems means you used more than 3 enchanted skills in a row.</Trans>
			</Fragment>,
			tiers:  this.severity,
			value:  this.gemGauge.overCap,
			why: <Fragment>
				<Trans id="rdm.gemgauge.suggestions.gem-wasted-why">You lost { this.gemGauge.overCap} Gems due to capped Gauge resources</Trans>
			</Fragment>,
		}))

		const gemsLost = this.gaugeBreak.reduce((sum, current) => sum + current.gemsLost, 0)

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.RESOLUTION.icon,
			content: <Fragment>
				<Trans id="rdm.gemgauge.suggestions.gem-loss-content">Ensure that you don't use a non Enchanted GCD when you have Gems, otherwise you lose them all</Trans>
			</Fragment>,
			tiers:  this.severity,
			value:  gemsLost,
			why: <Fragment>
				<Trans id="rdm.gemgauge.suggestions.gem-loss-why">You lost { gemsLost} Gems due to using a non Enchanted GCD</Trans>
			</Fragment>,
		}))
	}

	public getGems() {
		return  this.gemGauge.value
	}

	public getGemsAt(timestamp: number) {
		return  this.gemGauge.getValueAt(timestamp)
	}
}
