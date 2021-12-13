import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {JOBS} from 'data/JOBS'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

type GaugeModifier = Partial<Record<Event['type'], number>>

const LEFTOVER_AMMO_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
}

const MAX_AMMO = 2

export class Ammo extends CoreGauge {
	static override handle = 'ammo'
	static override title = t('gnb.ammo.title')`Cartridge Timeline`

	@dependency private suggestions!: Suggestions
	@dependency private checklist!: Checklist

	private ammoGauge = this.add(new CounterGauge({
		maximum: MAX_AMMO,
		/* We'll see how people like it being in the timeline over a seperate chart.
		I've grown to prefer it on the timeline myself
		chart: {label: 'Ammo', color: JOBS.GUNBREAKER.colour}, */
		graph: {
			handle: 'ammo',
			label: <Trans id="gnb.gauge.resource.ammoLabel">Ammo</Trans>,
			color: JOBS.GUNBREAKER.colour,
		},
	}))

	// Used for Checklist as CounterGauge seems to lack total tracking at this time.
	private totalGeneratedAmmo = 0

	private ammoModifiers = new Map<number, GaugeModifier>([
		//Builders. Well more of loaders
		[this.data.actions.SOLID_BARREL.id, {combo: 1}],
		[this.data.actions.DEMON_SLAUGHTER.id, {combo: 1}],
		[this.data.actions.BLOODFEST.id, {action: MAX_AMMO}],
		//Spenders/Unloaders
		[this.data.actions.BURST_STRIKE.id, {action: -1}],
		[this.data.actions.FATED_CIRCLE.id, {action: -1}],
		[this.data.actions.GNASHING_FANG.id, {action: -1}],

	])

	override initialise() {
		super.initialise()

		const ammoActions = Array.from(this.ammoModifiers.keys())

		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type(oneOf(['action', 'combo']))
				.action(oneOf(ammoActions)),
			this.onGaugeModifier,
		)

		this.addEventHook('complete', this.onComplete)
	}

	private onGaugeModifier(event: Events['action' | 'combo']) {
		const modifier = this.ammoModifiers.get(event.action)

		if (modifier != null) {
			const amount = modifier[event.type] ?? 0

			if (amount > 0) {
				this.totalGeneratedAmmo += amount //Increment total tracker for generated ammo
			}
			this.ammoGauge.modify(amount)
		}
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.BLOODFEST.icon,
			content: <Trans id="gnb.ammo.leftover-ammo.content">
				Avoid having leftover ammo at the end of a fight, consider using the ammo earlier if possible. <ActionLink action="BURST_STRIKE"/> is more potency than any of your <ActionLink action="SOLID_BARREL"/> combo.
			</Trans>,
			why: <Trans id="gnb.ammo.leftover-ammo.why">
				You had <Plural value={this.ammoGauge.value} one="# cartridge" other="# cartridges"/> remaining at the end of the fight.
			</Trans>,
			tiers: LEFTOVER_AMMO_SEVERITY_TIERS,
			value: this.ammoGauge.value,
		}))

		this.checklist.add(new Rule({
			name: 'Cartridge Usage',
			description: <Trans id="gnb.ammo.waste.content">
				Wasted cartridge generation, ending the fight with cartridges loaded, or dying with cartridges loaded is a
				direct potency loss. Use <ActionLink action="BURST_STRIKE"/>(or <ActionLink action="FATED_CIRCLE"/> if
				there is more than one target) to avoid wasting cartridges.
			</Trans>,
			requirements: [
				new Requirement({
					name: <Trans id="gnb.ammo.checklist.requirement.waste.name">
						Use as many of your loaded cartridges as possible.
					</Trans>,
					value: this.totalGeneratedAmmo - this.ammoGauge.overCap,
					target: this.totalGeneratedAmmo,
				}),
			],
		}))
	}
}
