import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import Color from 'color'
import {DataLink} from 'components/ui/DbLink'
import {JOBS} from 'data/JOBS'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

type GaugeModifier = Partial<Record<Event['type'], number>>

const SUGGESTION_TIERS = {
	1: SEVERITY.MINOR,
	3: SEVERITY.MEDIUM,
	6: SEVERITY.MAJOR, //Dear god stop, push buttons
}

const STACKS_PER_MEDITATE_TICK = 1
const MEDITATE_TICK_FREQUENCY = 3000
const MAX_MEDITATE_STACKS = 3

const FADE = 0.75
const SHOHA_COLOR = Color(JOBS.WARRIOR.colour).fade(FADE)

export class Shoha extends CoreGauge {
	static override title = t('sam.shoha.title')`Meditatation Stacks`
	static override handle = 'shoha'
	static override displayOrder = DISPLAY_ORDER.SHOHA

	@dependency private suggestions!: Suggestions
	@dependency private checklist!: Checklist

	private MeditateGauge = this.add(new CounterGauge({
		graph: {
			label: <Trans id="sam.gauge.resource.meditationLabel">Meditation</Trans>,
			color: SHOHA_COLOR,
		},
		maximum: MAX_MEDITATE_STACKS,
	}))

	private MeditateGaugeModifiers = new Map<number, GaugeModifier>([
		// Builders
		[this.data.actions.HIGANBANA.id, {action: 1}],
		[this.data.actions.TENKA_GOKEN.id, {action: 1}],
		[this.data.actions.MIDARE_SETSUGEKKA.id, {action: 1}],
		[this.data.actions.OGI_NAMIKIRI.id, {action: 1}],

		// Spenders
		[this.data.actions.SHOHA.id, {action: -3}],
		[this.data.actions.SHOHA_II.id, {action: -3}],
	])

	meditateStart = -1

	override initialise() {
		super.initialise()

		const meditateActions = Array.from(this.MeditateGaugeModifiers.keys())
		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(
			playerFilter
				.type(oneOf(['action']))
				.action(oneOf(meditateActions)),
			this.onGaugeModifier,
		)

		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.MEDITATE.id), this.onApplyMeditate)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.MEDITATE.id), this.onRemoveMeditate)

		this.addEventHook('complete', this.onComplete)
	}

	private onGaugeModifier(event: Events['action']) {
		const modifier = this.MeditateGaugeModifiers.get(event.action)

		if (modifier != null)	{
			const amount = modifier[event.type] ?? 0
			this.MeditateGauge.modify(amount)

		}
	}

	private onApplyMeditate(event: Events['statusApply']) {
		this.meditateStart = event.timestamp
	}

	private onRemoveMeditate(event: Events['statusRemove']) {
		const diff = event.timestamp - this.meditateStart
		const ticks = Math.min(Math.floor(diff / MEDITATE_TICK_FREQUENCY), MAX_MEDITATE_STACKS)

		this.MeditateGauge.modify(ticks * STACKS_PER_MEDITATE_TICK)
	}

	private onComplete() {
		const ShohaUses = Math.floor(this.MeditateGauge.totalSpent/MAX_MEDITATE_STACKS)
		let totalPossible = Math.floor(this.MeditateGauge.totalGenerated/MAX_MEDITATE_STACKS)
		if (ShohaUses > totalPossible) {
			totalPossible = ShohaUses
		}
		this.checklist.add(new Rule({
			name: 'Use Meditation Stacks',
			displayOrder: DISPLAY_ORDER.SHOHA,
			description: <Trans id="sam.shoha.waste.content">
				Wasted meditation generation, ending the fight with stacks fully charged, or dying with stacks charged is a
				direct potency loss. Use <DataLink action = "SHOHA"/> or <DataLink action = "SHOHA_II"/> to avoid wasting stacks.
			</Trans>,
			requirements: [
				new Requirement({
					name: <Trans id="sam.shoha.checklist.requirement.waste.name">
						Use as many of your meditation stacks as possible.
					</Trans>,
					value: ShohaUses,
					target: totalPossible,
				}),
			],
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.SHOHA.icon,
			content: <Trans id="sam.shoha.suggestions.loss.content">
					Avoid letting your Meditation Stacks overcap - the wasted resources may cost further uses of your spenders over the course of the fight.
			</Trans>,
			why: <Trans id="sam.shoha.suggestions.loss.why">
				{this.MeditateGauge.overCap} Meditation Stacks lost to overcapping.
			</Trans>,
			tiers: SUGGESTION_TIERS,
			value: this.MeditateGauge.overCap,
		}))
	}
}
