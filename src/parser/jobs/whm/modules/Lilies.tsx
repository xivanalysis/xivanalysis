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
			label: 'LILY',
			color: Color('#9F9F9F'),
		},
	}))

	private lilyTimer = this.add(new TimerGauge({
		maximum: LILY_TIME_REQUIRED,
		onExpiration: this.onLilyGeneration.bind(this),
		graph: {
			label: <Trans id="whm.gauge.resource.lily-timer">Lily Timer</Trans>,
			color: Color('blue').fade(0.25),
		},

	}))

	private bloodLilyGauge = this.add(new CounterGauge({
		maximum: BLOOD_LILY_BLOOM,
		initialValue: 0,
		graph: {
			label: <Trans>Blood Lily</Trans>,
			color: Color('#333333'),
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

	private onBloodLilySpend() {
		this.bloodLilyGauge.reset()
	}

	private calculateLostLilies(): number {
		return Math.floor(this.lilyTimer.getExpirationTime() / LILY_TIME_REQUIRED)
	}

	private onComplete() {

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.AFFLATUS_MISERY.icon,
			content: <Trans id="whm.lily-blood.suggestion.content">
						Use <DataLink action="AFFLATUS_MISERY" /> to avoid wasting blood lily growth.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: this.bloodLilyGauge.overCap,
			why: <Trans id="whm.lily-blood.suggestion.why">
				<Plural value={this.bloodLilyGauge.overCap} one="# blood lily" other="# blood lilies" /> did not bloom due to early lily use.
			</Trans>,
		})
		)

		const lostLilies = this.calculateLostLilies()

		if (lostLilies >0) {
			this.suggestions.add(new TieredSuggestion({
				icon: this.data.actions.AFFLATUS_SOLACE.icon,
				content: <Trans id="whm.lily-cap.suggestion.content">
						Use <DataLink action="AFFLATUS_RAPTURE" /> or <DataLink action="AFFLATUS_SOLACE" /> before using other GCD heals. It's okay to cap your lilies if you don't need to heal, move, or weave with them.
				</Trans>,
				tiers: {
					1: SEVERITY.MINOR,
					2: SEVERITY.MEDIUM,
					3: SEVERITY.MAJOR,
				},
				value: lostLilies,
				why: <Trans id="whm.lily-cap.suggestion.why">
					{<Plural value={lostLilies} one="# lily" other="# lilies" />} went unused.
				</Trans>,
			}))
		}

		if (!this.bloodLilyGauge.empty) {
			this.suggestions.add(new TieredSuggestion({
				icon: this.data.actions.GLARE_III.icon,
				content: <Trans>Dont spend unrefunded lilies</Trans>,
				tiers: {
					1: SEVERITY.MINOR,
					3: SEVERITY.MAJOR,
				},
				value: this.bloodLilyGauge.value,
				why: 'Pref OGCD to unrefunded lilies, GCD spent ' + this.bloodLilyGauge.value,
			}))
		}

	}
}

