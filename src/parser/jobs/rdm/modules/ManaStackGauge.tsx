import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {JOBS} from 'data/JOBS'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import {Statistics} from 'parser/core/modules/Statistics'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {Gauge} from 'parser/jobs/rdm/modules/Gauge'
import {DualStatistic} from 'parser/jobs/rdm/statistics/DualStatistic'
import React, {Fragment} from 'react'

interface ManaStackGaugeModifier {
	manaStack: number
}
interface GaugeBreaker {
	action: number,
	timestamp: number,
	manaStacksLost: number,
}
export const MINIMUM = 0
export const MAXIMUM = 3

export class ManaStackGauge extends CoreGauge {
	static override handle = 'manaStackGauge'
	static override title = t('rdm.manaStackGauge.title')`Mana Stack Gauge Usage`
	static override debug = false

	@dependency private suggestions!: Suggestions
	@dependency private statistics!: Statistics
	@dependency private gauge!: Gauge

	private manaStackGauge = this.add(new CounterGauge({
		graph: {
			label: <Trans id="rdm.manaStackGauge.resource.manaStacks">Mana Stacks</Trans>,
			color: JOBS.RED_MAGE.colour,
		},
		maximum: MAXIMUM,
		minimum: MINIMUM,
	}))
	public gaugeModifiers = new Map<number, ManaStackGaugeModifier>([
		[this.data.actions.ENCHANTED_REPRISE.id, {manaStack: 0}],
		[this.data.actions.ENCHANTED_MOULINET.id, {manaStack: 1}],
		[this.data.actions.ENCHANTED_RIPOSTE.id, {manaStack: 1}],
		[this.data.actions.ENCHANTED_ZWERCHHAU.id, {manaStack: 1}],
		[this.data.actions.ENCHANTED_REDOUBLEMENT.id, {manaStack: 1}],
	])
	public spenderModifiers = new Map<number, ManaStackGaugeModifier>([
		[this.data.actions.VERHOLY.id, {manaStack: -3}],
		[this.data.actions.VERFLARE.id, {manaStack: -3}],
		[this.data.actions.SCORCH.id, {manaStack: -0}],
		[this.data.actions.RESOLUTION.id, {manaStack: -0}],
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
	manaStatistics = {
		white: {
			overcapLoss: 0,
		},
		black: {
			overcapLoss: 0,
		},
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
				.action(oneOf(this.gaugeBreakers)),
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

		//Always check it we should break
		if (this.onGaugeBreak(event)) {
			//No further modifications to the gauge if this skill broke it.
			return
		}

		if (modifier == null) {
			return
		}

		if (this.manaStackGauge.capped) {
			const manaSpender = this.gauge.spenderModifiers.get(event.action)
			this.debug(`Gauge is Broken by action ${this.data.getAction(event.action)?.name}`)
			this.debug(`manaSpender is ${manaSpender} white mana value of ${manaSpender?.white} and black mana value of ${manaSpender?.black}`)
			this.debug(`Time the Overcap happened ${this.parser.formatEpochTimestamp(event.timestamp)}`)
			if (manaSpender != null) {
				this.manaStatistics.white.overcapLoss += Math.abs(manaSpender.white)
				this.manaStatistics.black.overcapLoss += Math.abs(manaSpender.black)
			}
		}

		this.manaStackGauge.modify(modifier.manaStack)
	}

	private onGaugeSpender(event: Events['action']) {
		const modifier = this.spenderModifiers.get(event.action)

		if (modifier == null) {
			this.onGaugeBreak(event)
			return
		}

		this.manaStackGauge.modify(modifier.manaStack)
	}

	private onGaugeBreak(event: Events['action']) {
		this.debug(`manaStackGauge is ${this.manaStackGauge.value} and the action is ${this.data.getAction(event.action)?.name} with id ${event.action} and it's included? ${this.gaugeBreakers.includes(event.action)}`)
		//It's only a break if we're above the minimum
		if (this.gaugeBreakers.includes(event.action) && this.manaStackGauge.value > MINIMUM) {
			const breaker = {} as GaugeBreaker
			breaker.action = event.action
			breaker.timestamp = event.timestamp
			breaker.manaStacksLost = this.manaStackGauge.value
			this.gaugeBreak.push(breaker)
			this.manaStackGauge.reset()

			return true
		}

		return false
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.RESOLUTION.icon,
			content: <Fragment>
				<Trans id="rdm.manaStackGauge.suggestions.manaStack-wasted-content">Ensure you don't overcap your ManaStacks before using your finisher combo; overcapping ManaStacks means you used more than 3 enchanted skills in a row.</Trans>
			</Fragment>,
			tiers:  this.severity,
			value:  this.manaStackGauge.overCap,
			why: <Fragment>
				<Trans id="rdm.manaStackGauge.suggestions.manaStack-wasted-why">You lost { this.manaStackGauge.overCap} ManaStacks due to capped Gauge resources</Trans>
			</Fragment>,
		}))

		const manaStacksLost = this.gaugeBreak.reduce((sum, current) => sum + current.manaStacksLost, 0)

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.RESOLUTION.icon,
			content: <Fragment>
				<Trans id="rdm.manaStackGauge.suggestions.manaStack-loss-content">Ensure that you don't use a non Enchanted GCD when you have ManaStacks, otherwise you lose them all</Trans>
			</Fragment>,
			tiers:  this.severity,
			value:  manaStacksLost,
			why: <Fragment>
				<Trans id="rdm.manaStackGauge.suggestions.manaStack-loss-why">You lost { manaStacksLost} ManaStacks due to using a non Enchanted GCD</Trans>
			</Fragment>,
		}))

		this.statistics.add(new DualStatistic({
			label: <Trans id="rdm.manaStackGauge.title-mana-lost-to-overcap">Mana Stack Overcap Loss:</Trans>,
			title: <Trans id="rdm.manaStackGauge.white-mana-lost-to-overcap">White</Trans>,
			title2: <Trans id="rdm.manaStackGauge.black-mana-lost-to-overcap">Black</Trans>,
			icon: this.data.actions.VERHOLY.icon,
			icon2: this.data.actions.VERFLARE.icon,
			value:  this.manaStatistics.white.overcapLoss,
			value2:  this.manaStatistics.black.overcapLoss,
			info: (
				<Trans id="rdm.manaStackGauge.white-mana-lost-to-overcap-statistics">
					You should never overcap your Mana Stacks
				</Trans>
			),
		}))
	}

	public getManaStacks() {
		return this.manaStackGauge.value
	}

	public getManaStacksAt(timestamp: number) {
		return this.manaStackGauge.getValueAt(timestamp)
	}
}
