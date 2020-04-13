import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
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
import {ComboEvent} from 'parser/core/modules/Combos'
import {NormalisedDamageEvent} from 'parser/core/modules/NormalisedEvents'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'

const ON_CAST_GENERATORS = {
	[ACTIONS.BLOODFEST.id]: 2,
}

const ON_COMBO_GENERATORS = {
	[ACTIONS.SOLID_BARREL.id]: 1,
	[ACTIONS.DEMON_SLAUGHTER.id]: 1,
}

const AMMO_SPENDERS = {
	[ACTIONS.GNASHING_FANG.id]: 1,
	[ACTIONS.BURST_STRIKE.id]: 1,
	[ACTIONS.FATED_CIRCLE.id]: 1,
}

const SINGLE_TARGET_CIRCLE_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	4: SEVERITY.MAJOR,
}

const LEFTOVER_AMMO_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
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
	private erroneousCircles = 0 // This is my new NEW band name.

	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions

	protected init() {
		this.addEventHook('init', this.pushToHistory)
		this.addEventHook(
			'cast',
			{
				by: 'player',
				abilityId: Object.keys(ON_CAST_GENERATORS).map(Number),
			},
			this.onCastGenerator,
		)
		this.addEventHook(
			'combo',
			{
				by: 'player',
				abilityId: Object.keys(ON_COMBO_GENERATORS).map(Number),
			},
			this.onComboGenerator,
		)
		this.addEventHook(
			'cast',
			{
				by: 'player',
				abilityId: Object.keys(AMMO_SPENDERS).map(Number),
			},
			this.onSpender,
		)
		this.addEventHook('normaliseddamage', {by: 'player', abilityId: ACTIONS.FATED_CIRCLE.id}, this.onFatedCircle)
		this.addEventHook('death', {to: 'player'}, this.onDeath)
		this.addEventHook('complete', this.onComplete)
	}

	private onFatedCircle(event: NormalisedDamageEvent) {
		if (event.hitCount < 2) {
			this.erroneousCircles++
		}
	}

	private onCastGenerator(event: CastEvent) {
		const abilityId = event.ability.guid
		const generatedAmmo = ON_CAST_GENERATORS[abilityId]

		this.addGeneratedAmmoAndPush(generatedAmmo, abilityId)
	}

	private onComboGenerator(event: ComboEvent) {
		const abilityId = event.ability.guid
		const generatedAmmo = ON_COMBO_GENERATORS[abilityId]

		this.addGeneratedAmmoAndPush(generatedAmmo, abilityId)
	}

	private addGeneratedAmmoAndPush(generatedAmmo: number, abilityId: number) {
		this.ammo += generatedAmmo
		this.totalGeneratedAmmo += generatedAmmo
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
			.filter(source => source !== ACTIONS.RAISE.id) // don't include death for suggestions
			.reduce((sum, source) => sum + this.wasteBySource[source], 0)
			+ this.leftoverAmmo

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.FATED_CIRCLE.icon,
			content: <Trans id="gnb.ammo.single-target-circle.content">
				Avoid using <ActionLink {...ACTIONS.FATED_CIRCLE}/> when it would deal damage to only a single target.
			</Trans>,
			why: <Trans id="gnb.ammo.single-target-circle.why">
				<Plural value={this.erroneousCircles} one="# use" other="# uses"/> of <ActionLink {...ACTIONS.FATED_CIRCLE}/> dealt
				damage to only one target.
			</Trans>,
			tiers: SINGLE_TARGET_CIRCLE_SEVERITY_TIERS,
			value: this.erroneousCircles,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.BLOODFEST.icon,
			content: <Trans id="gnb.ammo.leftover-ammo.content">
				Avoid having leftover ammo at the end of a fight, consider using the ammo earlier if possible. <ActionLink {...ACTIONS.BURST_STRIKE}/> is more potency than any of your <ActionLink {...ACTIONS.SOLID_BARREL}/> combo.
			</Trans>,
			why: <Trans id="gnb.ammo.leftover-ammo.why">
				You had <Plural value={this.leftoverAmmo} one="# cartridge" other="# cartridges"/> remaining at the end of the fight.
			</Trans>,
			tiers: LEFTOVER_AMMO_SEVERITY_TIERS,
			value: this.leftoverAmmo,
		}))

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
		let actionName = action.name
		if (action === ACTIONS.RAISE) {
			actionName = 'Death'
		}

		return <tr key={action.id + '-row'} style={{margin: 0, padding: 0}}>
			<td key={action.id + '-name'}><ActionLink name={actionName} {...action}/></td>
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
		const chartData = {
			datasets: [
				{
					label: 'Cartridges',
					steppedLine: true,
					data: this.ammoHistory,
					backgroundColor: ammoColor.fade(0.8).toString(),
					borderColor: ammoColor.fade(0.5).toString(),
				},
			],
		}

		const chartOptions = {
			scales : {
				yAxes: [{
					ticks: {
						beginAtZero: true,
						min: 0,
						max: 2,
						callback: ((value: number) => {
							if (value % 1 === 0) {
								return value
							}
						}),
					},
				}],
			},
		}
		/* tslint:enable:no-magic-numbers */

		return <Fragment>
			<TimeLineChart
				data={chartData}
				options={chartOptions} />
			<Accordion
				exclusive={false}
				panels={cartridgeWastePanels}
				styled
				fluid
			/>
		</Fragment>
	}
}
