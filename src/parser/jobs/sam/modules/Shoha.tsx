import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import Color from 'color'
import React, {Fragment} from 'react'
import {Accordion} from 'semantic-ui-react'

import STATUSES from 'data/STATUSES'

import {ActionLink} from 'components/ui/DbLink'
import TimeLineChart from 'components/ui/TimeLineChart'
import ACTIONS from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import {CastEvent, Event} from 'fflogs'
import Module, {dependency, DISPLAY_MODE} from 'parser/core/Module'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import Combatants from 'parser/core/modules/Combatants'
import {ComboEvent} from 'parser/core/modules/Combos'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'

const GENERATORS = {
	[ACTIONS.HIGANBANA.id]: 1,
	[ACTIONS.KAESHI_HIGANBANA.id]: 1,
	[ACTIONS.TENKA_GOKEN.id]: 1,
	[ACTIONS.KAESHI_GOKEN.id]: 1,
	[ACTIONS.MIDARE_SETSUGEKKA.id]: 1,
	[ACTIONS.KAESHI_SETSUGEKKA.id]: 1,
}

const SPENDERS = {
	[ACTIONS.SHOHA.id]: 3,
}

const MAX_STACKS = 3

interface StackState {
	t?: number
	y?: number
}

export default class Shoha extends Module {
	static handle = 'shoha'
	static title = t('sam.shoha.title')`Meditation Timeline`
	static displayMode = DISPLAY_MODE.FULL

	private stacks = 0
	private shohaUses = 0
	private stackHistory: StackState[] = []
	private wasteBySource = {
		[ACTIONS.HIGANBANA.id]: 0,
		[ACTIONS.KAESHI_HIGANBANA.id]: 0,
		[ACTIONS.TENKA_GOKEN.id]: 0,
		[ACTIONS.KAESHI_GOKEN.id]: 0,
		[ACTIONS.MIDARE_SETSUGEKKA.id]: 0,
		[ACTIONS.KAESHI_SETSUGEKKA.id]: 0,
		[ACTIONS.RAISE.id]: 0,
	}
	private leftoverStacks = 0
	private totalGeneratedStacks = 0 // Keep track of the total amount of generated stacks over the fight

	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions
	@dependency private combatants!: Combatants

	protected init() {
		this.addHook('init', this.pushToHistory)
		this.addHook(
			'cast',
			{
				by: 'player',
				abilityId: Object.keys(GENERATORS).map(Number),
			},
			this.onGenerate,
		)
		this.addHook(
			'cast',
			{
				by: 'player',
				abilityId: Object.keys(SPENDERS).map(Number),
			},
			this.onSpend,
		)
		this.addEventHook([
			'applybuff', 'applybuffstack'],
			{
				to: 'player',
				abilityId: STATUSES.MEDITATION.id,
			},
			this.onMeditateGain)

		this.addHook('death', {to: 'player'}, this.onDeath)
		this.addHook('complete', this.onComplete)
	}

	private onGenerate(event: CastEvent) {
		if (this.stacks === MAX_STACKS) {
		const abilityId = event.ability.guid
		const generatedStacks = GENERATORS[abilityId]

		this.addWaste(generatedStacks, abilityId)
		}
	}

		// the previous comment was a lie: This is for ALL meditation gains
	private onMeditateGain() {
			this.stacks++
			this.totalGeneratedStacks++

			// just a safety net
			if (this.stacks > MAX_STACKS) {
				this.stacks = MAX_STACKS
			}

			this.pushToHistory()
	}

	private addWaste(generatedStacks: number, abilityId: number) {
		this.stacks += generatedStacks
		this.totalGeneratedStacks += generatedStacks
		if (this.stacks > MAX_STACKS) {
			const waste = this.stacks - MAX_STACKS
			this.wasteBySource[abilityId] += waste
			this.stacks = MAX_STACKS
		}

		this.pushToHistory()
	}

	private onSpend(event: CastEvent) {
		this.stacks = 0
		this.shohaUses++

		this.pushToHistory()

	}

	private onDeath() {
		this.wasteBySource[ACTIONS.RAISE.id] += this.stacks
		this.dumpRemainingResources()
	}

	private dumpRemainingResources() {
		this.stacks = 0
		this.pushToHistory()
	}

	private pushToHistory() {
		const timestamp = this.parser.currentTimestamp - this.parser.fight.start_time
		this.stackHistory.push({t: timestamp, y: this.stacks})
	}

	private onComplete() {
		this.dumpRemainingResources()

		this.checklist.add(new Rule({
			name: 'Meditation',
			description: <Trans id="sam.shoha.waste.content">
				Wasted meditation generation, ending the fight with stacks fully charged, or dying with stacks charged is a
				direct potency loss. Use <ActionLink {...ACTIONS.SHOHA}/> to avoid wasting stacks.
			</Trans>,
			requirements: [
				new Requirement({
					name: <Trans id="sam.shoha.checklist.requirement.waste.name">
						Use as many of your meditation stacks as possible.
					</Trans>,
					value: this.shohaUses,
					target: Math.floor(this.totalGeneratedStacks/MAX_STACKS),
				}),
			],
		}))
	}

	private convertWasteMapToTable() {
		const rows = [
			this.convertWasteEntryToRow(ACTIONS.HIGANBANA),
			this.convertWasteEntryToRow(ACTIONS.TENKA_GOKEN),
			this.convertWasteEntryToRow(ACTIONS.MIDARE_SETSUGEKKA),
			this.convertWasteEntryToRow(ACTIONS.KAESHI_HIGANBANA),
			this.convertWasteEntryToRow(ACTIONS.KAESHI_GOKEN),
			this.convertWasteEntryToRow(ACTIONS.KAESHI_SETSUGEKKA),
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
		const actionName = action.name

		return <tr key={action.id + '-row'} style={{margin: 0, padding: 0}}>
			<td key={action.id + '-name'}><ActionLink name={actionName} {...action}/></td>
			<td key={action.id + '-value'}>{this.wasteBySource[action.id]}</td>
		</tr>
	}

	output() {
		const meditationWastePanels = []
		meditationWastePanels.push({
			key: 'key-wastebysource',
			title: {
				key: 'title-wastebysource',
				content: <Trans id="sam.shoha.waste.by-source.key">Meditation Stack Waste By Source</Trans>,
			},
			content: {
				key: 'content-wastebysource',
				content: this.convertWasteMapToTable(),
			},
		})

		const stackColor = Color(JOBS.SAMURAI.colour)
		/* tslint:disable:no-magic-numbers */
		const chartData = {
			datasets: [
				{
					label: 'Meditation Stacks',
					steppedLine: true,
					data: this.stackHistory,
					backgroundColor: stackColor.fade(0.8),
					borderColor: stackColor.fade(0.5),
				},
			],
		}

		const chartOptions = {
			scales : {
				yAxes: [{
					ticks: {
						beginAtZero: true,
						min: 0,
						max: 3,
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
				panels={meditationWastePanels}
				styled
				fluid
			/>
		</Fragment>
	}
}
