import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import Color from 'color'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {CounterGauge, Gauge as CoreGauge, TimerGauge} from 'parser/core/modules/Gauge'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const FADE_AMOUNT = 0.25
const CHECKMATE_COLOR = Color('#9767C7').fade(FADE_AMOUNT)
const DOUBLE_CHECK_COLOR = Color('#41BAEC').fade(FADE_AMOUNT)
const DOUBLE_CHECK_TIME_REQUIRED = 30000
const CHECKMATE_TIME_REQUIRED = 30000
const TIMER_FADE = 0.75
const HEAT_BLAST_REFUND = 15000

const OVERCAP_SEVERITY = {
	DOUBLE_CHECK: {
		2: SEVERITY.MINOR,
		3: SEVERITY.MEDIUM,
		4: SEVERITY.MAJOR,
	},
	CHECKMATE: {
		2: SEVERITY.MINOR,
		3: SEVERITY.MEDIUM,
		4: SEVERITY.MAJOR,
	},
}

interface GaugeModifier {
	event: 'action'
	type: 'generate' | 'spend'
	amount: number
}

type GaugeMap = Map<number, GaugeModifier>

export class OGCDCharges extends CoreGauge {
	static override handle = 'ogcdcharges'
	static override title = t('mch.ogcdcharges.title')`Double Check / Checkmate Charges`

	@dependency private suggestions!: Suggestions

	private doubleCheck = this.add(new CounterGauge({
		graph: {
			handle: 'doubleCheck',
			label: <Trans id="mch.ogcdcharges.resource.doublecheck">Double Check</Trans>,
			color: DOUBLE_CHECK_COLOR,
			collapse: true,
		},
		maximum: 3,
		initialValue: 3,
	}))

	private doubleCheckTimer = this.add(new TimerGauge({
		maximum: DOUBLE_CHECK_TIME_REQUIRED,
		onExpiration: this.onCompleteGaussRoundTimer.bind(this),
		graph: {
			handle: 'doubleCheck',
			label: <Trans id="mch.ogcdcharges.resource.doublecheck.timer">Double Check Timer</Trans>,
			color: DOUBLE_CHECK_COLOR.fade(TIMER_FADE),
		},
	}))

	private checkmate = this.add(new CounterGauge({
		graph: {
			handle: 'checkmate',
			label: <Trans id="mch.ogcdcharges.resource.checkmate">Checkmate</Trans>,
			color: CHECKMATE_COLOR,
			collapse: true,
		},
		maximum: 3,
		initialValue: 3,
	}))

	private checkmateTimer = this.add(new TimerGauge({
		maximum: CHECKMATE_TIME_REQUIRED,
		onExpiration: this.onCompleteCheckmateTimer.bind(this),
		graph: {
			handle: 'checkmate',
			label: <Trans id="mch.ogcdcharges.resource.checkmate.timer">Checkmate Timer</Trans>,
			color: CHECKMATE_COLOR.fade(TIMER_FADE),
		},
	}))

	private doubleCheckModifiers: GaugeMap = new Map([
		[this.data.actions.GAUSS_ROUND.id, {event: 'action', type: 'spend', amount: 1}],
		[this.data.actions.DOUBLE_CHECK.id, {event: 'action', type: 'spend', amount: 1}],
	])

	private checkmateModifiers: GaugeMap = new Map([
		[this.data.actions.RICOCHET.id, {event: 'action', type: 'spend', amount: 1}],
		[this.data.actions.CHECKMATE.id, {event: 'action', type: 'spend', amount: 1}],
	])

	private addGaugeHooks(gauge: CounterGauge, modifiers: GaugeMap) {
		const castActions = []

		for (const action of modifiers.keys()) {
			castActions.push(action)
		}

		const baseFilter = filter<Event>().source(this.parser.actor.id)

		const actionFilter = baseFilter
			.type(oneOf(['action']))
			.action(oneOf(castActions))

		this.addEventHook(actionFilter, this.onAction(gauge, modifiers))
	}

	private onCompleteTimer(gauge: CounterGauge, timer: TimerGauge) {
		gauge.generate(1)
		timer.reset()
		if (!gauge.capped) {
			timer.start()
		}
	}

	private onCompleteGaussRoundTimer() {
		this.onCompleteTimer(this.doubleCheck, this.doubleCheckTimer)
	}

	private onCompleteCheckmateTimer() {
		this.onCompleteTimer(this.checkmate, this.checkmateTimer)
	}

	override initialise() {
		super.initialise()

		this.addGaugeHooks(this.doubleCheck, this.doubleCheckModifiers)
		this.addGaugeHooks(this.checkmate, this.checkmateModifiers)

		const heatBlastFilter = filter<Event>()
			.source(this.parser.actor.id)
			.type('action')
			.action(this.data.actions.HEAT_BLAST.id)

		this.addEventHook(heatBlastFilter, this.onHeatBlast)
		this.addEventHook('complete', this.onComplete)
	}

	private onAction(gauge: CounterGauge, modifiers: GaugeMap) {
		return (event: Events['action' | 'combo']) => {
			const modifier = modifiers.get(event.action)

			if (modifier && modifier.event === event.type) {
				if (modifier.type === 'spend' && gauge.capped) {
					this.doubleCheckTimer.start()
					this.checkmateTimer.start()
				}
				gauge.spend(modifier.amount)
			}
		}
	}

	private refundPartialCooldown(gauge: CounterGauge, timer: TimerGauge, amount: number) {
		if (gauge.capped) {
			return
		}

		if (timer.remaining < amount) {
			const remainder = timer.remaining
			this.onCompleteTimer(gauge, timer)
			if (!gauge.capped) {
				timer.set(timer.remaining - amount + remainder)
			}
			return
		}

		timer.set(timer.remaining - amount)
	}

	private onHeatBlast() {
		this.refundPartialCooldown(this.doubleCheck, this.doubleCheckTimer, HEAT_BLAST_REFUND)
		this.refundPartialCooldown(this.checkmate, this.checkmateTimer, HEAT_BLAST_REFUND)
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.DOUBLE_CHECK.icon,
			content: <Trans id="mch.gauge.suggestions.gauss_round-waste.content">
				Try not to go into Hypercharge windows with multiple Double Check/Checkmate stacks, as it makes overcapping extremely easy.
			</Trans>,
			tiers: OVERCAP_SEVERITY.DOUBLE_CHECK,
			value: this.doubleCheck.overCap,
			why: <Trans id="mch.gauge.suggestions.gauss_round-waste.why">
				You lost {this.doubleCheck.overCap} Double Check uses due to leaving it off cooldown.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.CHECKMATE.icon,
			content: <Trans id="mch.gauge.suggestions.checkmate.content">
				Try not to go into Hypercharge windows with multiple Double Check/Checkmate stacks, as it makes overcapping extremely easy.
			</Trans>,
			tiers: OVERCAP_SEVERITY.CHECKMATE,
			value: this.checkmate.overCap,
			why: <Trans id="mch.gauge.suggestions.checkmate-waste.why">
				You lost {this.checkmate.overCap} Checkmate uses due to leaving it off cooldown.
			</Trans>,
		}))
	}
}
