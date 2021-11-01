import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import JOBS from 'data/JOBS'
import {Event, Events} from 'event'
import {EventHook} from 'parser/core/Dispatcher'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Module'
import {Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const BLOOD_WEAPON_GAIN = 10
const BLOOD_OVERCAP_SEVERITY = {
	50: SEVERITY.MINOR,
	100: SEVERITY.MEDIUM,
	200: SEVERITY.MAJOR,
}

export class Gauge extends CoreGauge {
	static override title = t('drk.gauge.title')`Blood Gauge`

	@dependency private actors!: Actors
	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private bloodGauge = this.add(new CounterGauge({
		chart: {label: 'Blood Gauge', color: JOBS.DARK_KNIGHT.colour},
	}))
	private bloodGaugeModifiers = new Map<number, Partial<Record<Event['type'], number>>>([
		// Builders
		[this.data.actions.SOULEATER.id, {combo: 20}],
		[this.data.actions.STALWART_SOUL.id, {combo: 20}],
		[this.data.actions.STORMS_PATH.id, {combo: 20}],
		[this.data.actions.MYTHRIL_TEMPEST.id, {combo: 20}],
		[this.data.actions.INFURIATE.id, {action: 50}],
		// Spenders
		[this.data.actions.LIVING_SHADOW.id, {action: -50}],
		[this.data.actions.QUIETUS.id, {action: -50}],
		[this.data.actions.BLOODSPILLER.id, {action: -50}],
	])
	private deliriumFreeCasts = [
		this.data.actions.QUIETUS.id,
		this.data.actions.BLOODSPILLER.id,
	]
	private activeGcdHook?: EventHook<Events['damage']>

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(
			playerFilter
				.type(oneOf(['action', 'combo']))
				.action(oneOf(Array.from(this.bloodGaugeModifiers.keys()))),
			this.onGaugeModifier
		)

		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.BLOOD_WEAPON.id), this.onApplyBloodWeapon)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.BLOOD_WEAPON.id), this.onRemoveBloodWeapon)

		this.addEventHook('complete', this.onComplete)
	}

	private onGaugeModifier(event: Events['action' | 'combo']) {
		const modifier = this.bloodGaugeModifiers.get(event.action)

		if (modifier != null) {
			let amount = modifier[event.type] ?? 0
			if (this.actors.current.hasStatus(this.data.statuses.DELIRIUM.id) && this.deliriumFreeCasts.includes(event.action)) {
				// Quietus and Bloodspiller are free during Delirium
				amount = 0
			}

			this.bloodGauge.modify(amount)
		}
	}

	private onApplyBloodWeapon() {
		this.activeGcdHook = this.addEventHook(filter<Event>().source(this.parser.actor.id).type('damage'), this.onHitUnderBloodWeapon)
	}

	private onRemoveBloodWeapon() {
		if (this.activeGcdHook != null) {
			this.removeEventHook(this.activeGcdHook)
			this.activeGcdHook = undefined
		}
	}

	private onHitUnderBloodWeapon(event: Events['damage']) {
		if (event.cause.type === 'status') {
			return
		}

		const action = this.data.getAction(event.cause.action)
		if (action != null && action.onGcd) {
			this.bloodGauge.modify(BLOOD_WEAPON_GAIN)
		}
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.DELIRIUM.icon,
			content: <Trans id="drk.gauge.suggestions.loss.content">
					Avoid letting your Blood Gauge overcap - the wasted resources may cost you uses of your spenders over the course of the fight.
			</Trans>,
			why: <Trans id="drk.gauge.suggestions.loss.why">
				{this.bloodGauge.overCap} blood gauge lost to an overcapped gauge.
			</Trans>,
			tiers: BLOOD_OVERCAP_SEVERITY,
			value: this.bloodGauge.overCap,
		}))
	}
}
