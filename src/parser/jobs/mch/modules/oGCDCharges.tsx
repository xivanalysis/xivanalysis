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
const RICOCHET_COLOR = Color('#60309D').fade(FADE_AMOUNT)
const GAUSS_ROUND_COLOR = Color('#1E0AB5').fade(FADE_AMOUNT)
const GAUSS_ROUND_TIME_REQUIRED = 30000
const RICOCHET_TIME_REQUIRED = 30000
const TIMER_FADE = 0.75
const HEAT_BLAST_REFUND = 15000

const OVERCAP_SEVERITY = {
	GAUSS_ROUND: {
		2: SEVERITY.MINOR,
		3: SEVERITY.MEDIUM,
		4: SEVERITY.MAJOR,
	},
	RICHOCHET: {
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
	static override title = t('mch.oGCDCharges.title')`Gauss Round/Ricochet Charges`

	@dependency private suggestions!: Suggestions

	private gaussRound = this.add(new CounterGauge({
		graph: {
			handle: 'gaussRound',
			label: <Trans id="mch.ogcdcharges.resource.gaussround">Gauss Round</Trans>,
			color: GAUSS_ROUND_COLOR,
			collapse: false,
		},
		maximum: 3,
		initialValue: 3,
	}))

	private gaussRoundTimer = this.add(new TimerGauge({
		maximum: GAUSS_ROUND_TIME_REQUIRED,
		onExpiration: this.onCompleteGaussRoundTimer.bind(this),
		graph: {
			handle: 'gaussRound',
			label: <Trans id="mch.ogcdcharges.resource.gaussround.timer">Gauss Round Timer</Trans>,
			color: GAUSS_ROUND_COLOR.fade(TIMER_FADE),
		},
	}))

	private ricochet = this.add(new CounterGauge({
		graph: {
			handle: 'ricochet',
			label: <Trans id="mch.ogcdcharges.resource.ricochet">Richochet</Trans>,
			color: RICOCHET_COLOR,
			collapse: false,
		},
		maximum: 3,
		initialValue: 3,
	}))

	private ricochetTimer = this.add(new TimerGauge({
		maximum: RICOCHET_TIME_REQUIRED,
		onExpiration: this.onCompleteRicochetTimer.bind(this),
		graph: {
			handle: 'ricochet',
			label: <Trans id="mch.ogcdcharges.resource.ricochet.timer">Ricochet Timer</Trans>,
			color: RICOCHET_COLOR.fade(TIMER_FADE),
		},
	}))

	private gaussRoundModifiers: GaugeMap = new Map([
		[this.data.actions.GAUSS_ROUND.id, {event: 'action', type: 'spend', amount: 1}],
	])

	private gaussRoundTimerModifiers: GaugeMap = new Map([
		[this.data.actions.HEAT_BLAST.id, {event: 'action', type: 'generate', amount: HEAT_BLAST_REFUND}],
	])

	private ricochetModifiers: GaugeMap = new Map([
		[this.data.actions.RICOCHET.id, {event: 'action', type: 'spend', amount: 1}],
	])

	private ricochetTimerModifiers: GaugeMap = new Map([
		[this.data.actions.HEAT_BLAST.id, {event: 'action', type: 'generate', amount: HEAT_BLAST_REFUND}],
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

	private onCompleteGaussRoundTimer() {
		this.gaussRound.generate(1)
		if (!this.gaussRound.capped) {
			this.gaussRoundTimer.start()
		}
	}

	private onCompleteRicochetTimer() {
		this.ricochet.generate(1)
		if (!this.ricochet.capped) {
			this.ricochetTimer.start()
		}
	}

	override initialise() {
		super.initialise()

		this.addGaugeHooks(this.gaussRound, this.gaussRoundModifiers)
		this.addGaugeHooks(this.ricochet, this.ricochetModifiers)
		const baseFilter = filter<Event>().source(this.parser.actor.id)

		const heatBlastFilter = baseFilter
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
					this.gaussRoundTimer.start()
					this.ricochetTimer.start()
				}
				this.modifyGauge(gauge, modifier)
			}
		}
	}

	private onHeatBlast() {
		if (this.gaussRound.value >= 2 && this.gaussRoundTimer.remaining < HEAT_BLAST_REFUND) {
			this.gaussRoundTimer.reset()
			this.gaussRoundTimer.pause()
			this.gaussRound.generate(1)
		} else if (this.gaussRoundTimer.remaining < HEAT_BLAST_REFUND) {
			this.gaussRoundTimer.set(this.gaussRoundTimer.remaining + HEAT_BLAST_REFUND)
			this.gaussRound.generate(1)
		} else {
			this.gaussRoundTimer.set(this.gaussRoundTimer.remaining - HEAT_BLAST_REFUND)

		} if (this.ricochet.value >= 2 && this.ricochetTimer.remaining < HEAT_BLAST_REFUND) {
			this.ricochetTimer.reset()
			this.ricochetTimer.pause()
			this.ricochet.generate(1)
		} else if (this.ricochetTimer.remaining < HEAT_BLAST_REFUND) {
			this.ricochetTimer.set(this.ricochetTimer.remaining + HEAT_BLAST_REFUND)
			this.ricochet.generate(1)
		} else {
			this.ricochetTimer.set(this.ricochetTimer.remaining - HEAT_BLAST_REFUND)
		}
	}

	private modifyGauge(gauge: CounterGauge, modifier: GaugeModifier) {
		gauge.spend(modifier.amount)
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.GAUSS_ROUND.icon,
			content: <Trans id="mch.gauge.suggestions.gauss_round-waste.content">
				Try not to go into Hypercharge windows with multiple Gauss Round/Ricochet stacks, as it makes overcapping extremely easy.
			</Trans>,
			tiers: OVERCAP_SEVERITY.GAUSS_ROUND,
			value: this.gaussRound.overCap,
			why: <Trans id="mch.gauge.suggestions.gauss_round-waste.why">
				You lost {this.gaussRound.overCap} Gauss Round uses due to leaving it off cooldown.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.RICOCHET.icon,
			content: <Trans id="mch.gauge.suggestions.ricochet.content">
				Try not to go into Hypercharge windows with multiple Gauss Round/Ricochet stacks, as it makes overcapping extremely easy.
			</Trans>,
			tiers: OVERCAP_SEVERITY.RICHOCHET,
			value: this.ricochet.overCap,
			why: <Trans id="mch.gauge.suggestions.ricochet-waste.why">
				You lost {this.ricochet.overCap} Ricochet uses due to leaving it off cooldown.
			</Trans>,
		}))
	}
}
