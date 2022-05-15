import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {Action} from 'data/ACTIONS'
import {JOBS} from 'data/JOBS'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

type GaugeModifier = Partial<Record<Event['type'], number>>

const SUGGESTION_TIERS = {
	20: SEVERITY.MINOR,
	50: SEVERITY.MAJOR,
}

export class Gauge extends CoreGauge {
	static override title = t('war.gauge.title')`Beast Gauge`

	@dependency private actors!: Actors
	@dependency private suggestions!: Suggestions

	private beastGauge = this.add(new CounterGauge({
		chart: {label: 'Beast Gauge', color: JOBS.WARRIOR.colour},
	}))

	private beastGaugeModifiers = new Map<number, GaugeModifier>([
		// Builders
		[this.data.actions.MAIM.id, {combo: 10}],
		[this.data.actions.STORMS_EYE.id, {combo: 10}],
		[this.data.actions.STORMS_PATH.id, {combo: 20}],
		[this.data.actions.MYTHRIL_TEMPEST.id, {combo: 20}],
		[this.data.actions.INFURIATE.id, {action: 50}],
		// Spenders
		[this.data.actions.FELL_CLEAVE.id, {action: -50}],
		[this.data.actions.DECIMATE.id, {action: -50}],
		[this.data.actions.CHAOTIC_CYCLONE.id, {action: -50}],
		[this.data.actions.INNER_CHAOS.id, {action: -50}],
	])

	override initialise() {
		super.initialise()

		const beastActions = Array.from(this.beastGaugeModifiers.keys())

		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type(oneOf(['action', 'combo']))
				.action(oneOf(beastActions)),
			this.onGaugeModifier,
		)

		this.addEventHook('complete', this.onComplete)
	}

	private onGaugeModifier(event: Events['action' | 'combo']) {
		const modifier = this.beastGaugeModifiers.get(event.action)
		const freeActions = new Set<Action['id']>([
			this.data.actions.FELL_CLEAVE.id,
			this.data.actions.DECIMATE.id,
		])

		if (modifier != null) {
			// Spenders are free during IR, post-6.1 only FC+Decimate are
			let amount = modifier[event.type] ?? 0
			if (
				this.actors.current.hasStatus(this.data.statuses.INNER_RELEASE.id)
				&& (this.parser.patch.before('6.1') || freeActions.has(event.action))
			) {
				amount = Math.max(amount, 0)
			}

			this.beastGauge.modify(amount)
		}
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.INFURIATE.icon,
			content: <Trans id="war.gauge.suggestions.loss.content">
					Avoid letting your Beast Gauge overcap - the wasted resources may cost further uses of your spenders over the course of the fight.
			</Trans>,
			why: <Trans id="war.gauge.suggestions.loss.why">
				{this.beastGauge.overCap} Wrath lost to overcapping Beast gauge.
			</Trans>,
			tiers: SUGGESTION_TIERS,
			value: this.beastGauge.overCap,
		}))
	}
}
