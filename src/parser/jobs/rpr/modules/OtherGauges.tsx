import {Trans} from '@lingui/react'
import Color from 'color'
import {DataLink} from 'components/ui/DbLink'
import {Action, ActionKey} from 'data/ACTIONS'
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
	10: SEVERITY.MINOR,
	30: SEVERITY.MEDIUM,
	50: SEVERITY.MAJOR,
}

const SHROUD_ACTIONS: ActionKey[] = [
	'GIBBET',
	'GALLOWS',
	'GUILLOTINE',
	'PLENTIFUL_HARVEST',
	'ENSHROUD',
]

const GAUGE_FADE = 0.25

const DESIGN_GAIN = 10
const BASE_SHROUD_MOD = 10
const HIGH_SHROUD_MOD = 50

export class OtherGauges extends CoreGauge {
	@dependency private actors!: Actors
	@dependency private suggestions!: Suggestions

	// Initialise our gauges - default max is 100 so yolo it is
	private soulGauge = this.add(new CounterGauge({
		graph: {label: 'Soul Gauge', color: Color(JOBS.WARRIOR.colour).fade(GAUGE_FADE), collapse: true},
	}))

	private shroudGauge = this.add(new CounterGauge({
		graph: {label: 'Shroud Gauge', color: Color(JOBS.BLUE_MAGE.colour).fade(GAUGE_FADE), collapse: true},
	}))

	private soulGaugeModifiers = new Map<Action['id'], GaugeModifier>([
		// Builders - other than Design since it's a status
		[this.data.actions.SLICE.id, {action: 10}],
		[this.data.actions.WAXING_SLICE.id, {combo: 10}],
		[this.data.actions.INFERNAL_SLICE.id, {combo: 10}],
		[this.data.actions.SPINNING_SCYTHE.id, {action: 10}],
		[this.data.actions.NIGHTMARE_SCYTHE.id, {combo: 10}],
		[this.data.actions.SOUL_SLICE.id, {action: 50}],
		[this.data.actions.SOUL_SCYTHE.id, {action: 50}],
		// Spenders
		[this.data.actions.BLOOD_STALK.id, {action: -50}],
		[this.data.actions.GRIM_SWATHE.id, {action: -50}],
		[this.data.actions.UNVEILED_GIBBET.id, {action: -50}],
		[this.data.actions.UNVEILED_GALLOWS.id, {action: -50}],
		[this.data.actions.GLUTTONY.id, {action: -50}],
	])

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		const foeFilter = filter<Event>().actor(oneOf(this.actors.foes.map(a => a.id)))

		// Soul Gauge
		const soulActions = Array.from(this.soulGaugeModifiers.keys())
		this.addEventHook(playerFilter.type(oneOf(['action', 'combo'])).action(oneOf(soulActions)), this.onSoulModifier)
		this.addEventHook(foeFilter.type('death'), this.onFoeDeath)

		// Shroud Gauge
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(SHROUD_ACTIONS)), this.onShroudModifier)

		this.addEventHook('complete', this.onComplete)
	}

	private onFoeDeath(event: Events['death']) {
		// We effectively check if they had the status 100ms before death, since it drops with death
		if (this.actors.get(event.actor).at(event.timestamp - 100).hasStatus(this.data.statuses.DEATHS_DESIGN.id)) {
			this.soulGauge.generate(DESIGN_GAIN)
		}
	}

	private onSoulModifier(event: Events['action' | 'combo']) {
		const modifier = this.soulGaugeModifiers.get(event.action)

		if (modifier != null) {
			const amount = modifier[event.type] ?? 0
			this.soulGauge.modify(amount)
		}
	}

	private onShroudModifier(event: Events['action']) {
		const action = this.data.getAction(event.action)
		if (action == null) { return }

		switch (action.id) {
		case this.data.actions.ENSHROUD.id:
			this.shroudGauge.spend(HIGH_SHROUD_MOD)
			break

		case this.data.actions.PLENTIFUL_HARVEST.id:
			this.shroudGauge.generate(HIGH_SHROUD_MOD)
			break

		default:
			this.shroudGauge.generate(BASE_SHROUD_MOD)
		}
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.SOUL_SLICE.icon,
			content: <Trans id="rpr.gauge.soul.suggestions.overcap.content">
					Avoid letting your Soul gauge overcap. The wasted resources cost you Shroud generation which you need for your highest damage skills.
			</Trans>,
			why: <Trans id="rpr.gauge.soul.suggestions.overcap.why">
				{this.soulGauge.overCap} Souls lost to overcapping Soul gauge.
			</Trans>,
			tiers: SUGGESTION_TIERS,
			value: this.soulGauge.overCap,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.PLENTIFUL_HARVEST.icon,
			content: <Trans id="rpr.gauge.shroud.suggestions.overcap.content">
					Avoid letting your Shroud gauge overcap as it can cost you uses of <DataLink action="ENSHROUD"/> over the fight.
			</Trans>,
			why: <Trans id="rpr.gauge.shroud.suggestions.overcap.why">
				{this.shroudGauge.overCap} Shrouds lost to overcapping Shroud gauge.
			</Trans>,
			tiers: SUGGESTION_TIERS,
			value: this.shroudGauge.overCap,
		}))
	}
}
