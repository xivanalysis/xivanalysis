import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import Color from 'color'
import {ActionLink} from 'components/ui/DbLink'
import TimeLineChart from 'components/ui/TimeLineChart'
import ACTIONS from 'data/ACTIONS'
import {JOBS} from 'data/JOBS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'
import Module, {dependency, DISPLAY_MODE} from 'parser/core/Module'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import React, {Fragment} from 'react'
import {Accordion} from 'semantic-ui-react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

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
const MEDITATE_TICK_FREQUENCY = 3000
const MAX_MEDITATE_TICKS = 3

interface StackState {
	t?: number
	y?: number
}

export default class Shoha extends Module {
	static override displayOrder = DISPLAY_ORDER.SHOHA
	static override handle = 'shoha'
	static override title = t('sam.shoha.title')`Meditation Timeline`
	static override displayMode = DISPLAY_MODE.FULL

	private stacks = 0
	private meditateStart = 0
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
	private totalGeneratedStacks = 0 // Keep track of the total amount of generated stacks over the fight

	@dependency private checklist!: Checklist
	@dependency private data!: Data

	protected override init() {
		this.addEventHook('init', this.pushToHistory)
		this.addEventHook(
			'cast',
			{
				by: 'player',
				abilityId: Object.keys(GENERATORS).map(Number),
			},
			this.onGenerate,
		)
		this.addEventHook(
			'cast',
			{
				by: 'player',
				abilityId: Object.keys(SPENDERS).map(Number),
			},
			this.onSpend,
		)
		this.addEventHook('applybuff', {to: 'player', abilityId: STATUSES.MEDITATE.id}, this.onApplyMeditate)
		this.addEventHook('removebuff', {to: 'player', abilityId: STATUSES.MEDITATE.id}, this.onRemoveMeditate)

		this.addEventHook('death', {to: 'player'}, this.onDeath)
		this.addEventHook('complete', this.onComplete)
	}

	private onGenerate(event: CastEvent) {
		const abilityId = event.ability.guid
		const generatedStacks = GENERATORS[abilityId]

		this.addStacks(generatedStacks, abilityId)
	}

	// back to time guessing we a go~
	private onApplyMeditate(event: BuffEvent) {
		this.meditateStart = event.timestamp
	}

	private onRemoveMeditate(event: BuffEvent) {
		const diff = event.timestamp - this.meditateStart

		const ticks = Math.min(Math.floor(diff / MEDITATE_TICK_FREQUENCY), MAX_MEDITATE_TICKS)

		let generatedStacks = ticks

		if ((ticks + this.stacks) > MAX_STACKS) {
			generatedStacks = (MAX_STACKS - this.stacks)
		}

		this.stacks += generatedStacks
		this.totalGeneratedStacks += generatedStacks
		if (this.stacks > MAX_STACKS) {
			this.stacks = MAX_STACKS
		}

		this.pushToHistory()
	}

	private addStacks(generatedStacks: number, abilityId: number) {
		this.stacks += generatedStacks
		this.totalGeneratedStacks += generatedStacks
		if (this.stacks > MAX_STACKS) {
			const waste = this.stacks - MAX_STACKS
			this.wasteBySource[abilityId] += waste
			this.stacks = MAX_STACKS
		}

		this.pushToHistory()
	}

	private onSpend() {
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

	private convertWasteMapToPanel(): JSX.Element {
		const rows = Object.entries(this.wasteBySource)
			.map(([id, waste]) => {
				if (waste > 0) {
					const actionId = Number(id)
					return <tr key={actionId + '-row'} style={{margin: 0, padding: 0}}>
						<td key={actionId + '-name'}><ActionLink {...this.data.getAction(actionId)}/></td>
						<td key={actionId + '-value'}>{waste}</td>
					</tr>
				}
			})
			.filter(row => row)

		if (!rows.length) {
			return <></>
		}

		const panel = [{
			key: 'key-wastebysource',
			title: {
				key: 'title-wastebysource',
				content: <Trans id="sam.shoha.waste.by-source.key">Meditation Stack Waste by Source</Trans>,
			},
			content: {
				key: 'content-wastebysource',
				content: <Fragment key="wasteBySource-fragment">
					<table key="wasteBySource-table">
						<tbody key="wasteBySource-tbody">
							{rows}
						</tbody>
					</table>
				</Fragment>,
			},
		}]

		return <Accordion
			exclusive={false}
			panels={panel}
			styled
			fluid />
	}

	override output() {
		const stackColor = Color(JOBS.SAMURAI.colour)
		/* eslint-disable @typescript-eslint/no-magic-numbers */
		const chartData = {
			datasets: [
				{
					label: 'Meditation Stacks',
					steppedLine: true,
					data: this.stackHistory,
					backgroundColor: stackColor.fade(0.8).toString(),
					borderColor: stackColor.fade(0.5).toString(),
				},
			],
		}

		const chartOptions = {
			scales: {
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
		/* eslint-enable @typescript-eslint/no-magic-numbers */

		return <Fragment>
			<TimeLineChart
				data={chartData}
				options={chartOptions} />
			{this.convertWasteMapToPanel()}
		</Fragment>
	}
}
