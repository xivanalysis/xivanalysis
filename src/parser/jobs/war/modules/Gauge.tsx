import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionKey} from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Module'
import {Actors} from 'parser/core/modules/Actors'
import {Cooldowns} from 'parser/core/modules/Cooldowns'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

type GaugeModifier = Partial<Record<Event['type'], number>>

const BEAST_USAGE_SEVERITY = {
	20: SEVERITY.MINOR,
	50: SEVERITY.MAJOR,
}

const INFURIATE_REDUCERS: ActionKey[] = [
	'FELL_CLEAVE',
	'DECIMATE',
	'CHAOTIC_CYCLONE',
	'INNER_CHAOS',
]
const INFURIATE_CDR = 5000

export class Gauge extends CoreGauge {
	static override title = t('war.gauge.title')`Beast Gauge`

	@dependency private actors!: Actors
	@dependency private cooldowns!: Cooldowns
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
		[this.data.actions.UPHEAVAL.id, {action: -20}],
		[this.data.actions.ONSLAUGHT.id, {action: -20}],
		[this.data.actions.CHAOTIC_CYCLONE.id, {action: -50}],
		[this.data.actions.INNER_CHAOS.id, {action: -50}],
	])

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		const beastActions = Array.from(this.beastGaugeModifiers.keys())
		this.addEventHook(
			playerFilter
				.type(oneOf(['action', 'combo']))
				.action(oneOf(beastActions)),
			this.onGaugeModifier
		)

		const infuriateReducerIds = INFURIATE_REDUCERS.map(key => this.data.actions[key].id)
		this.addEventHook(playerFilter.type('action').action(oneOf(infuriateReducerIds)), () => this.cooldowns.reduce('INFURIATE', INFURIATE_CDR))

		this.addEventHook('complete', this.onComplete)
	}

	private onGaugeModifier(event: Events['action' | 'combo']) {
		const modifier = this.beastGaugeModifiers.get(event.action)

		if (modifier != null) {
			// Spenders are free during IR
			let amount = modifier[event.type] ?? 0
			if (this.actors.current.hasStatus(this.data.statuses.INNER_RELEASE.id)) {
				amount = Math.max(amount, 0)
			}

			this.beastGauge.modify(amount)
		}
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.INFURIATE.icon,
			content: <Trans id="war.gauge.suggestions.loss.content">
					Avoid letting your Beast Gauge overcap - the wasted resources may cost you uses of your spenders over the course of the fight.
			</Trans>,
			why: <Trans id="war.gauge.suggestions.loss.why">
				{this.beastGauge.overCap} beast gauge lost to an overcapped gauge.
			</Trans>,
			tiers: BEAST_USAGE_SEVERITY,
			value: this.beastGauge.overCap,
		}))
	}
}
