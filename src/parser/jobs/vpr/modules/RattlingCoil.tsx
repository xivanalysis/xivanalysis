import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import Color from 'color'
import {ActionLink, DataLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

type GaugeModifier = Partial<Record<Event['type'], number>>

const LEFTOVER_COIL_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
}

const MAX_COILS = 3
const COIL_COLOR = Color('#DC1E32') // Red like the Job Gauge to help split serpent's offerings from coil stacks visually

export class RattlingCoil extends CoreGauge {
	static override handle = 'rattlingcoil'
	static override title = t('vpr.rattlingcoil.title')`Rattling Coil Timeline`

	@dependency private suggestions!: Suggestions
	@dependency private checklist!: Checklist

	private coilGauge = this.add(new CounterGauge({
		maximum: MAX_COILS,
		graph: {
			handle: 'coils',
			label: <Trans id="vpr.gauge.resource.coilsLabel">Rattling Coils</Trans>,
			color: COIL_COLOR,
			forceCollapsed: true,
		},
	}))

	private CoilModifiers = new Map<number, GaugeModifier>([

		[this.data.actions.VICEWINDER.id, {action: 1}],
		[this.data.actions.VICEPIT.id, {action: 1}],
		[this.data.actions.SERPENTS_IRE.id, {action: 1}],

		[this.data.actions.UNCOILED_FURY.id, {action: -1}],
	])

	private uncoiledTwinbloods = 0
	private uncoiledTwinfangs = 0

	override initialise() {
		super.initialise()

		const coilActions = Array.from(this.CoilModifiers.keys())

		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type(oneOf(['action', 'combo']))
				.action(oneOf(coilActions)),
			this.onGaugeModifier,
		)

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(
			playerFilter
				.type(oneOf(['action']))
				.action(this.data.actions.UNCOILED_TWINBLOOD.id),
			() => this.uncoiledTwinbloods++,
		)

		this.addEventHook(
			playerFilter
				.type(oneOf(['action']))
				.action(this.data.actions.UNCOILED_TWINFANG.id),
			() => this.uncoiledTwinfangs++,
		)

		this.addEventHook('complete', this.onComplete)
	}

	private onGaugeModifier(event: Events['action' | 'combo']) {
		const modifier = this.CoilModifiers.get(event.action)

		if (modifier == null) { return }
		const amount = modifier[event.type] ?? 0
		this.coilGauge.modify(amount)

	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.UNCOILED_FURY.icon,
			content: <Trans id="vpr.rattlingcoil.leftover-coil.content">
				Avoid having leftover rattling coils at the end of a fight, consider using <ActionLink action="UNCOILED_FURY"/> earlier if possible.
			</Trans>,
			why: <Trans id="vpr.rattlingcoil.leftover-coil.why">
				You had <Plural value={this.coilGauge.value} one="# rattling coil" other="# rattling coils"/> remaining at the end of the fight.
			</Trans>,
			tiers: LEFTOVER_COIL_SEVERITY_TIERS,
			value: this.coilGauge.value,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.UNCOILED_FURY.icon,
			content: <Trans id="vpr.rattlingcoil.overcap-coil.content">
				Avoid overcapping rattling coils during a fight, consider using <ActionLink action="UNCOILED_FURY"/> earlier if possible to avoid overcapping.
			</Trans>,
			why: <Trans id="vpr.rattlingcoil.overcap-coil.why">
				You overcapped <Plural value={this.coilGauge.overCap} one="# rattling coil" other="# rattling coils"/> during the fight.
			</Trans>,
			tiers: LEFTOVER_COIL_SEVERITY_TIERS,
			value: this.coilGauge.overCap,
		}))

		this.checklist.add(new Rule({
			name: <Trans id="vpr.rattlingcoil.usage.title"> <DataLink action="UNCOILED_FURY"/>,  <DataLink action="UNCOILED_TWINBLOOD"/> &  <DataLink action="UNCOILED_TWINFANG"/> Usage</Trans>,
			description: <Trans id="vpr.rattlingcoilwaste.content">
				Wasted rattling coil generation, ending the fight with rattling coils remaining, or dying with rattling coils coiled is a
				direct potency loss. Use <ActionLink action="UNCOILED_FURY"/> to avoid wasting rattling coils.
				<br/>
				Using <DataLink action="UNCOILED_FURY"/> will grant access to <DataLink action="UNCOILED_TWINBLOOD"/> and <DataLink action="UNCOILED_TWINFANG"/> as follow up attacks. Make sure to use them as well.
			</Trans>,
			requirements: [
				new Requirement({
					name: <Trans id="vpr.rattlingcoil.checklist.requirement.waste.name">
						<DataLink action="UNCOILED_FURY"/>
					</Trans>,
					value: this.coilGauge.totalGenerated - (this.coilGauge.overCap + this.coilGauge.value),
					target: this.coilGauge.totalGenerated,
				}),
				new Requirement({
					name: <Trans id="vpr.rattlingcoil.checklist.requirement.twinblood.name"> <DataLink action="UNCOILED_TWINBLOOD"/></Trans>,
					value: this.uncoiledTwinbloods,
					target: this.coilGauge.totalGenerated,
				}),
				new Requirement({
					name: <Trans id="vpr.rattlingcoil.checklist.requirement.twinfang.name"> <DataLink action="UNCOILED_TWINFANG"/></Trans>,
					value: this.uncoiledTwinfangs,
					target: this.coilGauge.totalGenerated,
				}),
			],
		}))
	}
}
