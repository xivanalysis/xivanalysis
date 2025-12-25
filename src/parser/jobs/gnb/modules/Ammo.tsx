import {msg} from '@lingui/core/macro'
import {Trans, Plural} from '@lingui/react/macro'
import {ActionLink} from 'components/ui/DbLink'
import {JOBS} from 'data/JOBS'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Checklist, Requirement, Rule} from 'parser/core/modules/Checklist'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import {Suggestions, SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'

type GaugeModifier = Partial<Record<Event['type'], number>>

const LEFTOVER_AMMO_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
}

const MAX_AMMO = 3
const BLOODFEST_AMMO_CAP = 6 // x2 normal cap during Bloodfest
const DOUBLE_DOWN_COST_7_2_AND_7_3 = 1

const DOUBLE_DOWN_PRE_7_1 = 2 // also 7.4 and beyond!

export class Ammo extends CoreGauge {
	static override handle = 'ammo'
	static override title = msg({id: 'gnb.ammo.title', message: 'Cartridge Timeline'})

	@dependency private suggestions!: Suggestions
	@dependency private checklist!: Checklist

	private ammoGauge = this.add(new CounterGauge({
		maximum: MAX_AMMO,
		graph: {
			handle: 'ammo',
			label: <Trans id="gnb.gauge.resource.ammoLabel">Ammo</Trans>,
			color: JOBS.GUNBREAKER.colour,
			forceCollapsed: true,
		},
	}))

	private lostAmmoDroppedAfterBloodfest = 0 // Tracks ammo dropped by being over the regular cap when bloodfest ends.

	private ammoModifiers = new Map<number, GaugeModifier>([
		//Builders. Well more of loaders
		[this.data.actions.SOLID_BARREL.id, {combo: 1}],
		[this.data.actions.DEMON_SLAUGHTER.id, {combo: 1}],
		[this.data.actions.BLOODFEST.id, {action: MAX_AMMO}],
		//Spenders/Unloaders
		[this.data.actions.BURST_STRIKE.id, {action: -1}],
		[this.data.actions.FATED_CIRCLE.id, {action: -1}],
		[this.data.actions.GNASHING_FANG.id, {action: -1}],
		[this.data.actions.DOUBLE_DOWN.id, {action: -DOUBLE_DOWN_COST_7_2_AND_7_3}],

	])

	override initialise() {
		super.initialise()

		if (this.parser.patch.before('7.1') || this.parser.patch.after('7.3')) {
			this.ammoModifiers.set(this.data.actions.DOUBLE_DOWN.id, {action: -DOUBLE_DOWN_PRE_7_1})
		}
		if (this.parser.patch.after('7.3')) {
			this.ammoModifiers.delete(this.data.actions.BLOODFEST.id)
		}

		const ammoActions = Array.from(this.ammoModifiers.keys())

		if (this.parser.patch.before('7.4')) {
			this.addEventHook(
				filter<Event>()
					.source(this.parser.actor.id)
					.type('action')
					.action(this.data.actions.BLOODFEST.id),
				() => {
					this.ammoGauge.modify(MAX_AMMO)
				},
			)
		}

		// 7.4 onwards, Bloodfest applies a status that increases the ammo cap by x2.
		if (this.parser.patch.after('7.3')) {
			this.addEventHook(
				filter<Event>()
					.source(this.parser.actor.id)
					.type('statusApply')
					.status(this.data.statuses.BLOODFEST.id),
				this.onBloodfestApply,
			)
			this.addEventHook(
				filter<Event>()
					.source(this.parser.actor.id)
					.type('statusRemove')
					.status(this.data.statuses.BLOODFEST.id),
				this.onBloodfestRemove,
			)
		}

		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type(oneOf(['action', 'combo']))
				.action(oneOf(ammoActions)),
			this.onGaugeModifier,
		)

		this.addEventHook('complete', this.onComplete)
	}
	private onBloodfestApply() {
		this.ammoGauge.setMaximum(BLOODFEST_AMMO_CAP)
		// Based on test logs, Bloodfest status and ammo gain comes from the status apply.
		// This causes ammo to not properly be added when processed on bloodfest cast.
		this.ammoGauge.modify(MAX_AMMO)
	}
	private onBloodfestRemove() {
		const droppedOverloadAmmo = this.ammoGauge.value - MAX_AMMO
		if (droppedOverloadAmmo > 0) {
			this.lostAmmoDroppedAfterBloodfest += droppedOverloadAmmo
		}
		this.ammoGauge.setMaximum(MAX_AMMO)
	}

	private onGaugeModifier(event: Events['action' | 'combo']) {
		const modifier = this.ammoModifiers.get(event.action)
		if (modifier != null) {
			const amount = modifier[event.type] ?? 0
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
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.BLOODFEST.icon,
			content: <Trans id="gnb.ammo.overload-ammo-drop.content">
				During <ActionLink action="BLOODFEST"/>, you can store up to {BLOODFEST_AMMO_CAP} cartridges. However once <ActionLink action="BLOODFEST"/> ends, any cartridges over {MAX_AMMO} are lost.
				Make sure that you have no more than {MAX_AMMO} cartridges when <ActionLink action="BLOODFEST"/> is about to expire to avoid losing cartridges.
			</Trans>,
			why: <Trans id="gnb.ammo.overload-ammo-drop.why">
				You lost <Plural value={this.lostAmmoDroppedAfterBloodfest} one="# cartridge" other="# cartridges"/> by being over {MAX_AMMO} when <ActionLink action="BLOODFEST"/> expires.
			</Trans>,
			tiers: LEFTOVER_AMMO_SEVERITY_TIERS,
			value: this.lostAmmoDroppedAfterBloodfest,
		}))

		this.checklist.add(new Rule({
			name: <Trans id="gnb.ammo.usage.title">Cartridge usage</Trans>,
			description: <Trans id="gnb.ammo.waste.content">
				Wasted cartridge generation, ending the fight with cartridges loaded, or dying with cartridges loaded is a
				direct potency loss. Use <ActionLink action="BURST_STRIKE"/> (or <ActionLink action="FATED_CIRCLE"/> if
				there is more than one target) to avoid wasting cartridges.
			</Trans>,
			requirements: [
				new Requirement({
					name: <Trans id="gnb.ammo.checklist.requirement.waste.name">
						Use as many of your loaded cartridges as possible
					</Trans>,
					value: this.ammoGauge.totalSpent,
					target: this.ammoGauge.totalGenerated,
				}),
			],
		}))
	}
}
