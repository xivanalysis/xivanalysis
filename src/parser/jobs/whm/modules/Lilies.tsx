import {Plural, Trans} from '@lingui/react'
import Color from 'color'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Event} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {CounterGauge, Gauge as CoreGauge, TimerGauge} from 'parser/core/modules/Gauge'
import Suggestions, {SEVERITY, TieredSuggestion, Suggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const LILY_MAX_STACKS = 3
const LILY_INTERVAL = 20000

const MISERY_COST = 3

/* eslint-disable @typescript-eslint/no-magic-numbers */
const GAUGE_COLOURS = {
	LILY_GAUGE: Color('#4f73b5').fade(0.25),
	LILY_TIMER: Color('#4f73b5').fade(0.75),
	BLOODLILY: Color('#b52d6c').fade(0.5),
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

const LILY_CONSUMERS: ActionKey[] = [
	'AFFLATUS_RAPTURE',
	'AFFLATUS_SOLACE',
]

const BLOODLILY_CONSUMERS: ActionKey[] = [
	'AFFLATUS_MISERY',
]

// Leaving out CURE3 due to having it only warn instead of error
const GCD_HEALS: ActionKey[] = [
	'MEDICA',
	'CURE',
	'CURE_II',
]

const SEVERITIES = {
	BLOODLILY_OVERCAP: {
		1: SEVERITY.MEDIUM,
		2: SEVERITY.MAJOR,
	},
	LILY_OVERCAP: {
		1: SEVERITY.MEDIUM,
		3: SEVERITY.MAJOR,
	},
	WASTED_GCD_HEALS: {
		3: SEVERITY.MAJOR,
	},
}

export class Lilies extends CoreGauge {
	static override handle = 'gauge'

	@dependency private suggestions!: Suggestions
	@dependency private actors!: Actors

	private wastedGcds = 0;

	private lilyInterval = LILY_INTERVAL

	private lilyGauge = this.add(new CounterGauge({
		maximum: LILY_MAX_STACKS,
		initialValue: 0,
		graph: {
			label: <Trans id="whm.gauge.lily.stacks.label">Lily</Trans>,
			color: GAUGE_COLOURS.LILY_GAUGE,
		},
	}))

	private lilyTimer = this.add(new TimerGauge({
		maximum: this.lilyInterval,
		onExpiration: this.onGain.bind(this),
		graph: {
			label: <Trans id="whm.gauge.lily.timer.label">Lily Timer</Trans>,
			color: GAUGE_COLOURS.LILY_TIMER,
		},

	}))

	private bloodLilyGauge = this.add(new CounterGauge({
		maximum: LILY_MAX_STACKS,
		initialValue: 0,
		graph: {
			label: <Trans id="whm.gauge.bloodlily.stacks.label">Blood Lily</Trans>,
			color: GAUGE_COLOURS.BLOODLILY,
		},
	}))

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(LILY_CONSUMERS)), this.onSpend)
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(BLOODLILY_CONSUMERS)), () => this.bloodLilyGauge.spend(MISERY_COST))
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(GCD_HEALS)), this.checkAfflatusAvailability)

		this.addEventHook('complete', this.onComplete)

		this.lilyTimer.start()
	}

	private onGain() {
		this.lilyGauge.generate(1)

		// When we gain a Lily, if the gauge isn't already capped the timer starts
		if (!this.lilyGauge.capped) {
			this.lilyTimer.start()
		}
	}

	private onSpend() {
		// Each spend also generates a Blood Lily
		this.bloodLilyGauge.generate(1)
		this.lilyGauge.spend(1)

		// When we spend a Lily, if the timer isn't running we restart it
		if (this.lilyTimer.expired) {
			this.lilyTimer.start()
		}

	}

	private checkAfflatusAvailability() {
		if (!this.lilyGauge.empty && !this.bloodLilyGauge.capped && !this.actors.current.hasStatus(this.data.statuses.THIN_AIR.id)) {
			this.wastedGcds++
		}
	}

	private onComplete() {
		// Calculate lost Lilies for the fight, does not correct for UTA or other downtime
		const lostLilies = Math.floor(this.lilyTimer.getExpirationTime() / this.lilyInterval)

		// Calculate how many Blood Lillies were lost due to overcapping
		const lostBloodLilies = this.bloodLilyGauge.value < MISERY_COST ? Math.floor((this.bloodLilyGauge.overCap + this.bloodLilyGauge.value) / MISERY_COST) : Math.floor(this.bloodLilyGauge.overCap / MISERY_COST)

		// Calculate how many Blood Lilies were unused at the end of the fight
		const unusedLilies = Math.floor(this.bloodLilyGauge.value / MISERY_COST)

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.AFFLATUS_MISERY.icon,
			content: <Trans id="whm.gauge.bloodlily.suggestions.overcap.content">
				Try to use <DataLink action="AFFLATUS_MISERY" /> to avoid wasting Blood Lily growth from overcapping the gauge.
			</Trans>,
			tiers: SEVERITIES.BLOODLILY_OVERCAP,
			value: lostBloodLilies,
			why: <Trans id="whm.gauge.bloodlily.suggestions.overcap.why">
				<Plural value={lostBloodLilies} one="# Blood Lily" other="# Blood Lilies" /> did not bloom due to using a Lily too early.
			</Trans>,
		})
		)

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.AFFLATUS_SOLACE.icon,
			content: <Trans id="whm.gauge.lily.suggestions.overcap.content.610">
				Try to use <DataLink action="AFFLATUS_RAPTURE" /> or <DataLink action="AFFLATUS_SOLACE" /> before using other GCD heals. It's okay to overheal with your lilies as they are to be used for mana management and movement aswell as healing.
			</Trans>,
			tiers: SEVERITIES.LILY_OVERCAP,
			value: lostLilies,
			why: <Trans id="whm.gauge.lily.suggestions.overcap.why">
				{<Plural value={lostLilies} one="# Lily" other="# Lilies" />} were wasted due to overcapping the gauge.
			</Trans>,
		}))

		if (unusedLilies > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.AFFLATUS_MISERY.icon,
				content: <Trans id="whm.gauge.bloodlily.suggestions.leftover.content">
					Try to finish the fight with no leftover Blood Lilies.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="whm.gauge.bloodlily.suggestions.leftover.why">
					{<Plural value={unusedLilies} one="# Blood Lily" other="# Blood Lilies" />} went unused.
				</Trans>,
			}))
		}

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.AFFLATUS_RAPTURE.icon,
			content: <Trans id="whm.gauge.lily.suggestions.leftover.content">
        Try to use Lilies instead of GCD heals when they're available.
			</Trans>,
			tiers: SEVERITIES.WASTED_GCD_HEALS,
			value: this.wastedGcds,
			why: <Trans id="whm.gauge.lily.suggestions.leftover.why">
				{<Plural value={this.wastedGcds} one="# GCD Heal was" other="# GCD Heals were" />} used instead of using a Lily.
			</Trans>,
		}))
	}
}

