import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {Action} from 'data/ACTIONS'
import {JOBS} from 'data/JOBS'
import {Event, Events} from 'event'
import {EventHook} from 'parser/core/Dispatcher'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const BLOOD_WEAPON_GAIN = 10

const BLOOD_OVERCAP_SEVERITY = {
	50: SEVERITY.MINOR,
	100: SEVERITY.MEDIUM,
	200: SEVERITY.MAJOR,
}

export class BloodGauge extends CoreGauge {
	static override title = t('drk.gauge.title')`Blood Gauge`

	@dependency private actors!: Actors
	@dependency private suggestions!: Suggestions

	private bloodGauge = this.add(new CounterGauge({
		chart: {label: 'Blood Gauge', color: JOBS.DARK_KNIGHT.colour},
	}))

	/* eslint-disable @typescript-eslint/no-magic-numbers */
	private onComboModifiers = new Map<Action['id'], number>([
		[this.data.actions.SOULEATER.id, 20],
		[this.data.actions.STALWART_SOUL.id, 20],
		[this.data.actions.STORMS_PATH.id, 20],
		[this.data.actions.MYTHRIL_TEMPEST.id, 20],
	])

	private onActionModifiers = new Map<Action['id'], number>([
		[this.data.actions.INFURIATE.id, 50],
		[this.data.actions.LIVING_SHADOW.id, -50],
		[this.data.actions.QUIETUS.id, -50],
		[this.data.actions.BLOODSPILLER.id, -50],
	])

	/* eslint-enable @typescript-eslint/no-magic-numbers */
	private deliriumFreeCasts = [
		this.data.actions.QUIETUS.id,
		this.data.actions.BLOODSPILLER.id,
	]

	private activeGcdHook?: EventHook<Events['damage']>

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action').action(oneOf([...this.onActionModifiers.keys()])), this.onModifier(this.onActionModifiers))
		this.addEventHook(playerFilter.type('combo').action(oneOf([...this.onComboModifiers.keys()])), this.onModifier(this.onComboModifiers))

		// We hook the action for BW so we can just ignore stacks entirely
		this.addEventHook(playerFilter.type('action').action(this.data.actions.BLOOD_WEAPON.id), this.onApplyBloodWeapon)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.BLOOD_WEAPON.id), this.onRemoveBloodWeapon)

		this.addEventHook('complete', this.onComplete)
	}

	private onModifier(modifiers: Map<Action['id'], number>) {
		return (event: Events['action' | 'combo']) => {
			const modifier = modifiers.get(event.action) ?? 0
			const freeBloodAction = this.actors.current.hasStatus(this.data.statuses.DELIRIUM.id) && this.deliriumFreeCasts.includes(event.action)
			this.bloodGauge.modify(freeBloodAction ? 0 : modifier)
		}
	}

	private onApplyBloodWeapon() {
		this.activeGcdHook = this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type('damage'),
			this.onHitUnderBloodWeapon
		)
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
