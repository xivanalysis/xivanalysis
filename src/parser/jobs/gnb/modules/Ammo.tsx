import {msg} from '@lingui/core/macro'
import {Trans, Plural} from '@lingui/react/macro'
import {ActionLink} from 'components/ui/DbLink'
import {JOBS} from 'data/JOBS'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Checklist, Requirement, Rule} from 'parser/core/modules/Checklist'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import {DataSet, PieChartStatistic, Statistics} from 'parser/core/modules/Statistics'
import {Suggestions, SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {ReactNode} from 'react'
import {Button, Table} from 'semantic-ui-react'

type GaugeModifier = Partial<Record<Event['type'], number>>

const enum WasteType {
	DEATH = 'death',
	BLOODFEST_EXPIRE = 'bloodfest',
	BLOODFEST_ACTION_OVERCAP = 'bloodfest_action',
	SOLID_BARREL_OVERCAP = 'solid_barrel',
	DEMON_SLAUGHTER_OVERCAP = 'demon_slaughter',
}

interface AmmoWasteEvent {
	timestamp: number
	amount: number
	reason: ReactNode
	type: WasteType
}

const LEFTOVER_AMMO_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
}

const OVERCAPPED_AMMO_SEVERITY_TIERS = {
	1: SEVERITY.MEDIUM, // worse than leftover ammo since you actively wasted something rather than having extra.
	3: SEVERITY.MAJOR, // The player has wasted a full gauge of ammo.
	// 6: SEVERITY.UNINSTALL // SIR, PUT THE GUNBLADE DOWN.
}

const MAX_AMMO = 3
const BLOODFEST_AMMO_CAP = 6 // x2 normal cap during Bloodfest
const DOUBLE_DOWN_COST_7_2_AND_7_3 = 1

const DOUBLE_DOWN_PRE_7_1 = 2 // also 7.4 and beyond!

export class Ammo extends CoreGauge {
	static override handle = 'ammo'
	static override title = msg({id: 'gnb.ammo.title', message: 'Lost Cartridges'})

	@dependency private suggestions!: Suggestions
	@dependency private checklist!: Checklist
	@dependency private statistics!: Statistics

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
	private ammoWasteEvents: AmmoWasteEvent[] = []
	private ammoLostToDeath = 0

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
	protected override onDeath(event: Events['death']) {
		const ammoLost = this.ammoGauge.value
		if (ammoLost > 0) {
			this.ammoLostToDeath += ammoLost
			this.ammoWasteEvents.push({
				timestamp: event.timestamp,
				amount: ammoLost,
				reason: <Trans id="gnb.ammo.waste.reason.death">Died with <Plural value={ammoLost} one="# cartridge" other="# cartridges"/> loaded</Trans>,
				type: WasteType.DEATH,
			})
		}
		super.onDeath(event)
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
			this.ammoWasteEvents.push({
				timestamp: this.parser.currentEpochTimestamp,
				amount: droppedOverloadAmmo,
				reason: <Trans id="gnb.ammo.waste.reason.bloodfest-expire">Lost <Plural value={droppedOverloadAmmo} one="# cartridge" other="# cartridges"/> due to being over {MAX_AMMO} when <ActionLink action="BLOODFEST"/> expired</Trans>,
				type: WasteType.BLOODFEST_EXPIRE,
			})
		}
		this.ammoGauge.setMaximum(MAX_AMMO)
	}

	private onGaugeModifier(event: Events['action' | 'combo']) {
		const modifier = this.ammoModifiers.get(event.action)
		if (modifier != null) {
			const amount = modifier[event.type] ?? 0

			// Track overcap before modifying
			if (amount > 0) {
				const potentialValue = this.ammoGauge.value + amount
				const overcapAmount = Math.max(0, potentialValue - this.ammoGauge.maximum)

				if (overcapAmount > 0) {
					if (event.action === this.data.actions.BLOODFEST.id) {
						this.ammoWasteEvents.push({
							timestamp: event.timestamp,
							amount: overcapAmount,
							reason: <Trans id="gnb.ammo.waste.reason.bloodfest-overcap">Lost <Plural value={overcapAmount} one="# cartridge" other="# cartridges"/> from using <ActionLink id={event.action}/></Trans>,
							type: WasteType.BLOODFEST_ACTION_OVERCAP,
						})
					} else {
						const wasteType = event.action === this.data.actions.SOLID_BARREL.id
							? WasteType.SOLID_BARREL_OVERCAP
							: WasteType.DEMON_SLAUGHTER_OVERCAP

						this.ammoWasteEvents.push({
							timestamp: event.timestamp,
							amount: overcapAmount,
							reason: <Trans id="gnb.ammo.waste.reason.combo-overcap">Lost a cartridge from using <ActionLink id={event.action}/> with full cartridges</Trans>,
							type: wasteType,
						})
					}
				}
			}

			this.ammoGauge.modify(amount)
		}
	}

	private onComplete() {
		// Add pie chart statistic for waste totals
		const solidBarrelWaste = this.getWasteByType(WasteType.SOLID_BARREL_OVERCAP)
		const demonSlaughterWaste = this.getWasteByType(WasteType.DEMON_SLAUGHTER_OVERCAP)
		const bloodfestActionWaste = this.getWasteByType(WasteType.BLOODFEST_ACTION_OVERCAP)
		const bloodfestWaste = this.getWasteByType(WasteType.BLOODFEST_EXPIRE)
		const deathWaste = this.getWasteByType(WasteType.DEATH)

		if (this.totalAmmoWaste > 0) {
			const data: DataSet<ReactNode, 2> = []

			if (solidBarrelWaste > 0) {
				data.push({
					value: solidBarrelWaste,
					color: '#4a90d9',
					columns: [
						<Trans key="solid-barrel" id="gnb.ammo.statistic.solid-barrel-overcap.label">Overcapped using <ActionLink action="SOLID_BARREL"/></Trans>,
						solidBarrelWaste,
					],
				})
			}

			if (demonSlaughterWaste > 0) {
				data.push({
					value: demonSlaughterWaste,
					color: '#6a5acd',
					columns: [
						<Trans key="demon-slaughter" id="gnb.ammo.statistic.demon-slaughter-overcap.label">Overcapped using <ActionLink action="DEMON_SLAUGHTER"/></Trans>,
						demonSlaughterWaste,
					],
				})
			}

			if (bloodfestActionWaste > 0) {
				data.push({
					value: bloodfestActionWaste,
					color: '#f0ad4e',
					columns: [
						<Trans key="bloodfest-action" id="gnb.ammo.statistic.bloodfest-action-overcap.label">Overcapped using <ActionLink action="BLOODFEST"/></Trans>,
						bloodfestActionWaste,
					],
				})
			}

			if (bloodfestWaste > 0) {
				data.push({
					value: bloodfestWaste,
					color: '#d9534f',
					columns: [
						<Trans key="bloodfest" id="gnb.ammo.statistic.bloodfest-expire.label">Overcapped when <ActionLink action="BLOODFEST"/> ended</Trans>,
						bloodfestWaste,
					],
				})
			}

			if (deathWaste > 0) {
				data.push({
					value: deathWaste,
					color: '#5a5a5a',
					columns: [
						<Trans key="death" id="gnb.ammo.statistic.death.label">Death</Trans>,
						deathWaste,
					],
				})
			}

			this.statistics.add(new PieChartStatistic({
				headings: [
					<Trans key="gnb.ammo.statistic.headings.source" id="gnb.ammo.statistic.headings.source">Source</Trans>,
					<Trans key="gnb.ammo.statistic.headings.lost" id="gnb.ammo.statistic.headings.lost">Lost</Trans>,
				],
				data: data,
				info: <Trans id="gnb.ammo.statistic.info">
					This chart shows the breakdown of lost cartridges by source.
					Avoid wasting cartridges by spending them before using combo actions that generate more.
				</Trans>,
			}))
		}

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
			tiers: OVERCAPPED_AMMO_SEVERITY_TIERS,
			value: this.lostAmmoDroppedAfterBloodfest,
		}))

		const comboOvercap = solidBarrelWaste + demonSlaughterWaste + bloodfestActionWaste
		if (this.parser.patch.after('7.3')) {
			this.suggestions.add(new TieredSuggestion({
				icon: this.data.actions.SOLID_BARREL.icon,
				content: <Trans id="gnb.ammo.combo-overcap.content">
				Avoid using <ActionLink action="SOLID_BARREL"/> or <ActionLink action="DEMON_SLAUGHTER"/> when you already have {MAX_AMMO} cartridges.
				Use <ActionLink action="BURST_STRIKE"/> or <ActionLink action="FATED_CIRCLE"/> to spend cartridges before finishing your combo.
				</Trans>,
				why: <Trans id="gnb.ammo.combo-overcap.why">
				You lost <Plural value={comboOvercap} one="# cartridge" other="# cartridges"/> by using combo finishers with full cartridges.
				</Trans>,
				tiers: OVERCAPPED_AMMO_SEVERITY_TIERS,
				value: comboOvercap,
			}))
		} else {
			this.suggestions.add(new TieredSuggestion({
				icon: this.data.actions.SOLID_BARREL.icon,
				content: <Trans id="gnb.ammo.combo-overcap.content-pre-7-4">
				Avoid using <ActionLink action="SOLID_BARREL"/>, <ActionLink action="DEMON_SLAUGHTER"/> or <ActionLink action="BLOODFEST"/> when you already have {MAX_AMMO} cartridges.
				Use <ActionLink action="BURST_STRIKE"/> or <ActionLink action="FATED_CIRCLE"/> to spend cartridges before finishing your combo.
				</Trans>,
				why: <Trans id="gnb.ammo.combo-overcap.why-pre-7-4">
				You lost <Plural value={comboOvercap} one="# cartridge" other="# cartridges"/> by using actions that generate cartridges with full cartridges.
				</Trans>,
				tiers: OVERCAPPED_AMMO_SEVERITY_TIERS,
				value: comboOvercap,
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
	private get totalAmmoWaste(): number {
		return this.ammoWasteEvents.reduce((total, event) => total + event.amount, 0)
	}

	private getWasteByType(type: WasteType): number {
		return this.ammoWasteEvents
			.filter(event => event.type === type)
			.reduce((total, event) => total + event.amount, 0)
	}

	private formatTimestamp(timestamp: number) {
		const relative_timestamp = timestamp - this.parser.pull.timestamp
		return <Button
			circular
			compact
			icon="time"
			size="small"
			onClick={() => this.timeline.show(relative_timestamp, relative_timestamp)}
			content={this.parser.formatEpochTimestamp(timestamp)}
		/>
	}

	override output() {
		if (this.ammoWasteEvents.length === 0) {
			return false
		}

		return (
			<Table compact unstackable celled>
				<Table.Header>
					<Table.Row>
						<Table.HeaderCell>
							<Trans id="gnb.ammo.waste.table.header.time">Time</Trans>
						</Table.HeaderCell>
						<Table.HeaderCell>
							<Trans id="gnb.ammo.waste.table.header.reason">Reason</Trans>
						</Table.HeaderCell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{this.ammoWasteEvents.map((event, index) => (
						<Table.Row key={index}>
							<Table.Cell>
								{this.formatTimestamp(event.timestamp)}
							</Table.Cell>
							<Table.Cell>
								{event.reason}
							</Table.Cell>
						</Table.Row>
					))}
				</Table.Body>
			</Table>
		)
	}
}
