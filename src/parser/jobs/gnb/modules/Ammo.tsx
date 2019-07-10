import {t, Trans} from '@lingui/macro'
import Color from 'color'
import React, {Fragment} from 'react'
import {Accordion} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import TimeLineChart from 'components/ui/TimeLineChart'
import ACTIONS from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import {CastEvent} from 'fflogs'
import Module, {dependency, DISPLAY_MODE} from 'parser/core/Module'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'

const AMMO_GENERATORS = {
	// I'm specifying all the event types here because Typescript is a moron
	// and yells at us later if we don't.
	[ACTIONS.SOLID_BARREL.id]: {begincast: 0, cast: 0, combo: 1},
	[ACTIONS.DEMON_SLAUGHTER.id]: {begincast: 0, cast: 0, combo: 1},
	[ACTIONS.BLOODFEST.id]: {begincast: 0, cast: 2, combo: 0},
}

const AMMO_SPENDERS = {
	[ACTIONS.GNASHING_FANG.id]: 1,
	[ACTIONS.BURST_STRIKE.id]: 1,
	[ACTIONS.FATED_CIRCLE.id]: 1,
}

const MAX_AMMO = 2

class AmmoState {
	t?: number
	y?: number
}

export default class Ammo extends Module {
	static handle = 'ammo'
	static title = t('gnb.ammo.title')`Cartridge Timeline`
	static displayMode = DISPLAY_MODE.FULL

	private ammo = 0
	private ammoHistory: AmmoState[] = []
	private wasteBySource = {
		[ACTIONS.SOLID_BARREL.id]: 0,
		[ACTIONS.DEMON_SLAUGHTER.id]: 0,
		[ACTIONS.BLOODFEST.id]: 0,
		[ACTIONS.RAISE.id]: 0,
	}
	private leftoverAmmo = 0
	private totalGeneratedAmmo = 0 // Keep track of the total amount of generated ammo over the fight

	@dependency private checklist!: Checklist

	protected init() {
		this.addHook('init', this.pushToHistory)
		this.addHook(
			['cast', 'combo'],
			{
				by: 'player',
				abilityId: Object.keys(AMMO_GENERATORS).map(Number),
			},
			this.onGenerator,
		)
		this.addHook(
			'cast',
			{
				by: 'player',
				abilityId: Object.keys(AMMO_SPENDERS).map(Number),
			},
			this.onSpender,
		)
		this.addHook('death', {to: 'player'}, this.onDeath)
		this.addHook('complete', this.onComplete)
	}

	private onGenerator(event: CastEvent) {
		const abilityId = event.ability.guid
		const action = AMMO_GENERATORS[abilityId]
		if (!action || !action[event.type]) {
			return
		}

		this.ammo += action[event.type] // This line is why we have to define all the event types up above
		this.totalGeneratedAmmo += action[event.type]
		if (this.ammo > MAX_AMMO) {
			const waste = this.ammo - MAX_AMMO
			this.wasteBySource[abilityId] += waste
			this.ammo = MAX_AMMO
		}

		this.pushToHistory()
	}

	private onSpender(event: CastEvent) {
		this.ammo = this.ammo - AMMO_SPENDERS[event.ability.guid]

		this.pushToHistory()
	}

	private onDeath() {
		this.wasteBySource[ACTIONS.RAISE.id] += this.ammo
		this.dumpRemainingResources()
	}

	private dumpRemainingResources() {
		this.leftoverAmmo = this.ammo
		this.ammo = 0
		this.pushToHistory()
	}

	private pushToHistory() {
		const timestamp = this.parser.currentTimestamp - this.parser.fight.start_time
		this.ammoHistory.push({t: timestamp, y: this.ammo})
	}

	private onComplete() {
		this.dumpRemainingResources()

		const totalWaste = Object.keys(this.wasteBySource)
			.map(Number)
			.reduce((sum, source) => sum + this.wasteBySource[source], 0)
			+ this.leftoverAmmo

		this.checklist.add(new Rule({
			name: 'Cartridge Usage',
			description: <Trans id="gnb.ammo.waste.content">
				Wasted cartridge generation, ending the fight with cartridges loaded, or dying with cartridges loaded is a
				direct potency loss. Use <ActionLink {...ACTIONS.BURST_STRIKE}/> (or <ActionLink {...ACTIONS.FATED_CIRCLE}/> if
				there is more than one target) to avoid wasting cartridges.
			</Trans>,
			requirements: [
				new Requirement({
					name: <Trans id="gnb.ammo.checklist.requirement.waste.name">
						Use as many of your loaded cartridges as possible.
					</Trans>,
					value: this.totalGeneratedAmmo - totalWaste,
					target: this.totalGeneratedAmmo,
				}),
			],
		}))
	}

	private convertWasteMapToTable() {
		const rows = [
			this.convertWasteEntryToRow(ACTIONS.SOLID_BARREL),
			this.convertWasteEntryToRow(ACTIONS.DEMON_SLAUGHTER),
			this.convertWasteEntryToRow(ACTIONS.BLOODFEST),
			this.convertWasteEntryToRow(ACTIONS.RAISE),
		]

		return <Fragment key="wasteBySource-fragment">
			<table key="wasteBySource-table">
				<tbody key="wasteBySource-tbody">
					{rows}
				</tbody>
			</table>
		</Fragment>
	}

	private convertWasteEntryToRow(action: TODO) {
		return <tr key={action.id + '-row'} style={{margin: 0, padding: 0}}>
			<td key={action.id + '-name'}><ActionLink {...action}/></td>
			<td key={action.id + '-value'}>{this.wasteBySource[action.id]}</td>
		</tr>
	}

	output() {
		const cartridgeWastePanels = []
		cartridgeWastePanels.push({
			key: 'key-wastebysource',
			title: {
				key: 'title-wastebysource',
				content: <Trans id="gnb.ammo.waste.by-source.key">Cartridge Waste By Source</Trans>,
			},
			content: {
				key: 'content-wastebysource',
				content: this.convertWasteMapToTable(),
			},
		})

		const ammoColor = Color(JOBS.GUNBREAKER.colour)
		/* tslint:disable:no-magic-numbers */
		const chartdata = {
			datasets: [
				{
					label: 'Cartridges',
					steppedLine: true,
					data: this.ammoHistory,
					backgroundColor: ammoColor.fade(0.8),
					borderColor: ammoColor.fade(0.5),
				},
			],
		}
		/* tslint:enable:no-magic-numbers */

		return <Fragment>
			<TimeLineChart data={chartdata} />
			<Accordion
				exclusive={false}
				panels={cartridgeWastePanels}
				styled
				fluid
			/>
		</Fragment>
	}
}
