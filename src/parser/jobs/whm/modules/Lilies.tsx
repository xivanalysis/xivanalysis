import {Plural, Trans} from '@lingui/react'
import Color from 'color'
import {DataLink} from 'components/ui/DbLink'
import {Event} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Checklist from 'parser/core/modules/Checklist'
import {CounterGauge, Gauge as CoreGauge, TimerGauge} from 'parser/core/modules/Gauge'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const LILY_INITIAL_STACKS = 0
const LILY_MAX_STACKS = 3
const LILY_TIME_REQUIRED = 20000

const BLOOD_LILY_BLOOM = 3

const GAUGE_FADE = 0.25
const TIMER_FADE = 0.75
const BLOODLILY_FADE = 0.5
const LILY_COLOR = Color('#4f73b5')
const BLOODLILY_COLOR = Color('#b52d6c')

export class Lilies extends CoreGauge {

	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions

	private lilyConsumers = [
		this.data.actions.AFFLATUS_RAPTURE.id,
		this.data.actions.AFFLATUS_SOLACE.id,
	]

	private bloodLilyConsumers = [
		this.data.actions.AFFLATUS_MISERY.id,
	]

	private lilyGauge = this.add(new CounterGauge({
		maximum: LILY_MAX_STACKS,
		initialValue: LILY_INITIAL_STACKS,
		graph: {
			label: <Trans id="whm.gauge.resource.lily">Lily</Trans>,
			color: LILY_COLOR.fade(GAUGE_FADE),
		},
	}))

	private lilyTimer = this.add(new TimerGauge({
		maximum: LILY_TIME_REQUIRED,
		onExpiration: this.onLilyGeneration.bind(this),
		graph: {
			label: <Trans id="whm.gauge.resource.lily-timer">Lily Timer</Trans>,
			color: LILY_COLOR.fade(TIMER_FADE),
		},

	}))

	private bloodLilyGauge = this.add(new CounterGauge({
		maximum: BLOOD_LILY_BLOOM,
		initialValue: 0,
		graph: {
			label: <Trans id="whm.gauge.resource.bloodlily">Blood Lily</Trans>,
			color: BLOODLILY_COLOR.fade(BLOODLILY_FADE),
		},
	}))

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action').action(oneOf(this.lilyConsumers)), this.onLilySpend)
		this.addEventHook(playerFilter.type('action').action(oneOf(this.bloodLilyConsumers)), () => this.bloodLilyGauge.spend(3))
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
		this.bloodLilyGauge.capped ? this.bloodLilyGauge.overCap +=1 : this.bloodLilyGauge.modify(1)
		if (this.lilyTimer.expired) {
			this.lilyTimer.start()
		}
		this.lilyGauge.spend(1)

	}

	private calculateLostLilies(): number {
		const lostLilies = Math.floor(this.lilyTimer.getExpirationTime() / LILY_TIME_REQUIRED)
		return lostLilies
	}

	private onComplete() {

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.AFFLATUS_MISERY.icon,
			content: <Trans id="whm.lily-blood.suggestion.content">
						Use <DataLink action="AFFLATUS_MISERY" /> to avoid wasting Blood lily growth.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: this.bloodLilyGauge.overCap,
			why: <Trans id="whm.lily-blood.suggestion.why">
				<Plural value={this.bloodLilyGauge.overCap} one="# Blood lily" other="# Blood lilies" /> did not bloom due to early lily use.
			</Trans>,
		})
		)

		if (this.calculateLostLilies() >0) {
			this.suggestions.add(new TieredSuggestion({
				icon: this.data.actions.AFFLATUS_SOLACE.icon,
				content: <Trans id="whm.lily-cap.suggestion.content">
						Use <DataLink action="AFFLATUS_RAPTURE" /> or <DataLink action="AFFLATUS_SOLACE" /> before using other GCD heals. It's okay to overheal with your lilies as they are to be used for mana management and movement.
				</Trans>,
				tiers: {
					1: SEVERITY.MEDIUM,
					3: SEVERITY.MAJOR,
				},
				value: this.calculateLostLilies(),
				why: <Trans id="whm.lily-cap.suggestion.why">
					{<Plural value={this.calculateLostLilies()} one="# lily" other="# lilies" />} went unused.
				</Trans>,
			}))
		}

		if (this.bloodLilyGauge.value > 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: this.data.actions.AFFLATUS_MISERY.icon,
				content: <Trans id="whm.unspent-blood-lily.suggestion.content">Aim to finish the fight with no blood lilies </Trans>,
				tiers: {
					1: SEVERITY.MINOR,
					3: SEVERITY.MAJOR,
				},
				value: this.bloodLilyGauge.value,
				why: <Trans id="whm.unspent-blood-lily.suggestion.why">
					{<Plural value={this.bloodLilyGauge.value} one="# blood lily" other="# blood lilies"/>} went unused.
				</Trans>,
			}))
		}

	}
}

