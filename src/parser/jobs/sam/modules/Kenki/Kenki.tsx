import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import Color from 'color'
import {JOBS} from 'data/JOBS'
import {Event, Events} from 'event'
import {EventHook} from 'parser/core/Dispatcher'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
import kenkiIcon from './kenki.png'

type GaugeModifier = Partial<Record<Event['type'], number>>

const SUGGESTION_TIERS = {
	5: SEVERITY.MINOR,
	20: SEVERITY.MEDIUM,
	35: SEVERITY.MAJOR,
}

const THIRD_EYE_GAIN = 10
const KENKI_PER_MEDITATE_TICK = 10
const MEDITATE_TICK_FREQUENCY = 3000
const MAX_MEDITATE_TICKS = 5

const FADE = 0.25
const KENKI_COLOR = Color(JOBS.SAMURAI.colour).fade(FADE)

export class Kenki extends CoreGauge {
	static override title = t('sam.gauge.title')`Kenki Gauge`
	static override displayOrder = DISPLAY_ORDER.KENKI
	@dependency private suggestions!: Suggestions

	private kenkiGauge = this.add(new CounterGauge({
		graph: {
			label: <Trans id="sam.gauge.resource.kenkiLabel">Kenki</Trans>,
			color: KENKI_COLOR,
		},
	}))

	private kenkiGaugeModifiers = new Map<number, GaugeModifier>([
		// Builders
		[this.data.actions.HAKAZE.id, {action: 5}],
		[this.data.actions.JINPU.id, {combo: 5}],
		[this.data.actions.SHIFU.id, {combo: 5}],
		[this.data.actions.KASHA.id, {combo: 10}],
		[this.data.actions.GEKKO.id, {combo: 10}],
		[this.data.actions.YUKIKAZE.id, {combo: 15}],

		[this.data.actions.FUKO.id, {action: 10}],
		[this.data.actions.MANGETSU.id, {combo: 10}],
		[this.data.actions.OKA.id, {combo: 10}],

		[this.data.actions.IKISHOTEN.id, {action: 50}],

		// Spenders
		[this.data.actions.HISSATSU_GUREN.id, {action: -25}],
		[this.data.actions.HISSATSU_KYUTEN.id, {action: -25}],
		[this.data.actions.HISSATSU_SHINTEN.id, {action: -25}],
		[this.data.actions.HISSATSU_SENEI.id, {action: -25}],
		[this.data.actions.HISSATSU_KAITEN.id, {action: -20}],
		[this.data.actions.HISSATSU_GYOTEN.id, {action: -10}],
		[this.data.actions.HISSATSU_YATEN.id, {action: -10}],
	])

	private damageHook?: EventHook<Events['damage']>

	meditateStart = -1

	override initialise() {
		super.initialise()

		const kenkiActions = Array.from(this.kenkiGaugeModifiers.keys())
		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(
			playerFilter
				.type(oneOf(['action', 'combo']))
				.action(oneOf(kenkiActions)),
			this.onGaugeModifier,
		)
		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.THIRD_EYE.id), this.onApplyEye)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.THIRD_EYE.id), this.onRemoveEye)

		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.MEDITATE.id), this.onApplyMeditate)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.MEDITATE.id), this.onRemoveMeditate)

		this.addEventHook('complete', this.onComplete)
	}

	private onApplyEye() {
		this.damageHook = this.addEventHook(
			filter<Event>().type('damage'),
			this.eyeExam
		)
	}

	private eyeExam(event: Events['damage']) {
		const targetedSelf = event.targets.some(({target}) => target === this.parser.actor.id)
		if (targetedSelf) {
			this.kenkiGauge.modify(THIRD_EYE_GAIN)
		}
	}

	private onRemoveEye() {
		if (this.damageHook != null) {
			this.removeEventHook(this.damageHook)
		}
	}

	private onGaugeModifier(event: Events['action' | 'combo']) {
		const modifier = this.kenkiGaugeModifiers.get(event.action)

		if (modifier != null)	{
			const amount = modifier[event.type] ?? 0
			this.kenkiGauge.modify(amount)
		}
	}

	onApplyMeditate(event: Events['statusApply']) {
		this.meditateStart = event.timestamp
	}

	onRemoveMeditate(event: Events['statusRemove']) {
		const diff = event.timestamp - this.meditateStart
		const ticks = Math.min(Math.floor(diff / MEDITATE_TICK_FREQUENCY), MAX_MEDITATE_TICKS)

		this.kenkiGauge.modify(ticks * KENKI_PER_MEDITATE_TICK)
	}

	//Method for Sen to dump kenki gain into gauge
	onHagakure(kenkiGain: number) {
		this.kenkiGauge.modify(kenkiGain)
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: kenkiIcon,
			content: <Trans id="sam.gauge.suggestions.loss.content">
					Avoid letting your Kenki Gauge overcap - the wasted resources may cost further uses of your spenders over the course of the fight.
			</Trans>,
			why: <Trans id="sam.gauge.suggestions.loss.why">
				{this.kenkiGauge.overCap} Kenki lost to overcapping.
			</Trans>,
			tiers: SUGGESTION_TIERS,
			value: this.kenkiGauge.overCap,
		}))
	}
}
