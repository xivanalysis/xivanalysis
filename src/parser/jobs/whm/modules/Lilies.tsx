import {Plural, Trans} from '@lingui/react'
import Color from 'color'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Event} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {CounterGauge, Gauge as CoreGauge, TimerGauge} from 'parser/core/modules/Gauge'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const LILY_MAX_STACKS = 3
const LILY_INTERVAL_600 = 30000
const LILY_INTERVAL_610 = 20000

const MISERY_COST = 3

const GRAPH_DISPLAY_SETTINGS= {
	LILY_GAUGE_FADE: 0.25,
	LILY_TIMER_FADE: 0.75,
	BLOODLILY_GAUGE_FADE: 0.5,
	LILY_GAUGE_COLOR: Color('#4f73b5'),
	BLOODLILY_GAUGE_COLOR: Color('#b52d6c'),
}

export class Lilies extends CoreGauge {

	@dependency private suggestions!: Suggestions

	private lilyConsumers: ActionKey[] = [
		'AFFLATUS_RAPTURE',
		'AFFLATUS_SOLACE',
	]

	private bloodLilyConsumers: ActionKey[] = [
		'AFFLATUS_MISERY',
	]

	private lilyGauge = this.add(new CounterGauge({
		maximum: LILY_MAX_STACKS,
		initialValue: 0,
		graph: {
			label: <Trans id="whm.gauge.lily.stacks.label">Lily</Trans>,
			color: GRAPH_DISPLAY_SETTINGS.LILY_GAUGE_COLOR.fade(GRAPH_DISPLAY_SETTINGS.LILY_GAUGE_FADE),
		},
	}))

	private lilyTimer = this.add(new TimerGauge({
		maximum: this.parser.patch.before('6.1') ? LILY_INTERVAL_600 : LILY_INTERVAL_610,
		onExpiration: this.onLilyGeneration.bind(this),
		graph: {
			label: <Trans id="whm.gauge.lily.timer.label">Lily Timer</Trans>,
			color: GRAPH_DISPLAY_SETTINGS.LILY_GAUGE_COLOR.fade(GRAPH_DISPLAY_SETTINGS.LILY_GAUGE_FADE),
		},

	}))

	private bloodLilyGauge = this.add(new CounterGauge({
		maximum: LILY_MAX_STACKS,
		initialValue: 0,
		graph: {
			label: <Trans id="whm.gauge.bloodlily.stacks.label">Blood Lily</Trans>,
			color: GRAPH_DISPLAY_SETTINGS.BLOODLILY_GAUGE_COLOR.fade(GRAPH_DISPLAY_SETTINGS.BLOODLILY_GAUGE_FADE),
		},
	}))

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(this.lilyConsumers)), this.onLilySpend)
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(this.bloodLilyConsumers)), () => this.bloodLilyGauge.spend(MISERY_COST))
		this.addEventHook('complete', this.onComplete)
		this.lilyTimer.start()
	}

	private onLilyGeneration() {
		this.lilyGauge.generate(1)
		if (!this.lilyGauge.capped) {
			this.lilyTimer.start()
		}
	}

	private onLilySpend() {
		this.bloodLilyGauge.generate(1)
		if (this.lilyTimer.expired) {
			this.lilyTimer.start()
		}
		this.lilyGauge.spend(1)
	}

	private calculateLostLilies(): number {
		const LILY_INTERVAL = this.parser.patch.before('6.1') ? LILY_INTERVAL_600 : LILY_INTERVAL_610
		return Math.floor(this.lilyTimer.getExpirationTime() / LILY_INTERVAL)
	}

	private onComplete() {
		const bloodLilyOvercapTiers = {
			1: SEVERITY.MINOR,
			2: SEVERITY.MEDIUM,
			3: SEVERITY.MAJOR,
		}

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.AFFLATUS_MISERY.icon,
			content: <Trans id="whm.gauge.suggestions.bloodlily.overcap.content">
				Try to use <DataLink action="AFFLATUS_MISERY" /> to avoid wasting Blood Lily growth from overcapping the gauge.
			</Trans>,
			tiers: bloodLilyOvercapTiers,
			value: this.bloodLilyGauge.overCap,
			why: <Trans id="whm.gauge.suggestions.bloodlily.overcap.why">
				<Plural value={this.bloodLilyGauge.overCap} one="# Blood lily" other="# Blood lilies" /> did not bloom due to early lily use.
			</Trans>,
		})
		)

		const lilyOvercapSuggestion_600 = <Trans id="whm.gauge.suggestions.lily.overcap.content.600">
			Try to use <DataLink action="AFFLATUS_RAPTURE" /> or <DataLink action="AFFLATUS_SOLACE" /> before using other GCD heals. It's okay to cap your lilies if you don't need to heal, move, or weave with them.
		</Trans>

		const lilyOvercapSuggestion_610 = <Trans id="whm.gauge.suggestions.lily.overcap.content.610">
			Try to use <DataLink action="AFFLATUS_RAPTURE" /> or <DataLink action="AFFLATUS_SOLACE" /> before using other GCD heals. It's okay to overheal with your lilies as they are to be used for mana management and movement aswell as healing.
		</Trans>

		const lilyOvercapTiers_600 = {1: SEVERITY.MINOR}
		const lilyOvercapTiers_610 = {
			1: SEVERITY.MEDIUM,
			3: SEVERITY.MAJOR,
		}

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.AFFLATUS_SOLACE.icon,
			content:  this.parser.patch.before('6.1') ? lilyOvercapSuggestion_600 : lilyOvercapSuggestion_610,
			tiers: this.parser.patch.before('6.1') ? lilyOvercapTiers_600 : lilyOvercapTiers_610,
			value: this.calculateLostLilies(),
			why: <Trans id="whm.gauge.suggestions.lily.overcap.why">
				{<Plural value={this.calculateLostLilies()} one="# lily" other="# lilies" />} went unused.
			</Trans>,
		}))

		const bloodlilyLeftoverTier={
			1: SEVERITY.MINOR,
			3: SEVERITY.MAJOR,
		}

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.AFFLATUS_MISERY.icon,
			content: <Trans id="whm.gauge.suggestions.bloodlily.leftover.content">Aim to finish the fight with no blood lilies </Trans>,
			tiers: bloodlilyLeftoverTier,
			value: this.bloodLilyGauge.value,
			why: <Trans id="whm.gauge.suggestions.bloodlily.leftover.why">
				{<Plural value={this.bloodLilyGauge.value} one="# blood lily" other="# blood lilies" />} went unused.
			</Trans>,
		}))

	}
}

