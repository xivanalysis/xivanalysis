import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {RotationTargetOutcome} from 'components/ui/RotationTable'
import {Action, ActionKey} from 'data/ACTIONS'
import {BuffWindow, ExpectedActionGroupsEvaluator, EvaluatedAction, NotesEvaluator, TrackedActionGroup} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {EndOfWindowHandlingMode} from 'parser/core/modules/ActionWindow/windows/BuffWindow'
import {Data} from 'parser/core/modules/Data'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import {Icon} from 'semantic-ui-react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const GENERATIONS_PER_REAWAKEN = 4
const LEGACYS_PER_REAWAKEN = 4

const SEVERITIES = {
	1: SEVERITY.MINOR,
	3: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}

const REAWAKEN_ACTIONS: ActionKey[] = [
	'REAWAKEN',
	'FIRST_GENERATION',
	'SECOND_GENERATION',
	'THIRD_GENERATION',
	'FOURTH_GENERATION',
	'FIRST_LEGACY',
	'SECOND_LEGACY',
	'THIRD_LEGACY',
	'FOURTH_LEGACY',
	'OUROBOROS',

	//You can use Uncoiled fury and it's follow ups in this window, so I'm be able to see possible delays in the window
	'UNCOILED_FURY',
	'UNCOILED_TWINFANG',
	'UNCOILED_TWINBLOOD',
]

class GenerationsEvalutor extends NotesEvaluator {

	header = {
		header: <Trans id="vpr.reawaken.generations.header">Generations used in order</Trans>,
		accessor: 'generations',
	}

	private data: Data

	constructor(data: Data) {
		super()
		this.data = data
	}

	override generateNotes(window: HistoryEntry<EvaluatedAction[]>): JSX.Element {
		return this.didGenerationsInOrder(window) ?
			<Icon name="checkmark" className="text-success"/> :
			<Icon name="remove" className="text-error"/>
	}

	private didGenerationsInOrder(window: HistoryEntry<EvaluatedAction[]>): boolean {
		let lastGeneration: Action | undefined = undefined

		for (const action of window.data) {
			if (action.action.onGcd === true && action.action.id !== this.data.actions.UNCOILED_FURY.id) {
				switch (action.action.id) {
				case this.data.actions.FIRST_GENERATION.id:
					if (lastGeneration !== undefined) { return false }
					break
				case this.data.actions.SECOND_GENERATION.id:
					if (lastGeneration !== this.data.actions.FIRST_GENERATION) { return false }
					break
				case this.data.actions.THIRD_GENERATION.id:
					if (lastGeneration !== this.data.actions.SECOND_GENERATION) { return false }
					break
				case this.data.actions.FOURTH_GENERATION.id:
					if (lastGeneration !== this.data.actions.THIRD_GENERATION) { return false }
					break
				}
				lastGeneration = action.action
			}
		}
		return true
	}
}

export class Reawaken extends BuffWindow {
	static override handle = 'reawaken'
	static override title = t('vpr.reawaken.title')`Reawaken`
	static override displayOrder = DISPLAY_ORDER.REAWAKEN

	override buffStatus = this.data.statuses.REAWAKENED
	override endOfWindowHandlingMode: EndOfWindowHandlingMode = 'SAME-TIMESTAMP'

	override initialise() {
		super.initialise()

		this.trackOnlyActions(REAWAKEN_ACTIONS.map(a => this.data.actions[a].id))

		this.addEvaluator(new ExpectedActionGroupsEvaluator({
			expectedActionGroups: [
				{
					actions: [
						this.data.actions.FIRST_GENERATION,
						this.data.actions.SECOND_GENERATION,
						this.data.actions.THIRD_GENERATION,
						this.data.actions.FOURTH_GENERATION,
					],
					expectedPerWindow: GENERATIONS_PER_REAWAKEN,
				},
				{
					actions: [
						this.data.actions.FIRST_LEGACY,
						this.data.actions.SECOND_LEGACY,
						this.data.actions.THIRD_LEGACY,
						this.data.actions.FOURTH_LEGACY,
					],
					expectedPerWindow: LEGACYS_PER_REAWAKEN,
				},
				{
					actions: [
						this.data.actions.OUROBOROS,
					],
					expectedPerWindow: 1,
				},
			],
			suggestionIcon: this.data.actions.REAWAKEN.icon,
			suggestionContent: <Trans id="vpr.reawaken.suggestions.content">
				Each <DataLink action="REAWAKEN"/> window should contain <DataLink action="FIRST_GENERATION"/>, <DataLink action="SECOND_GENERATION"/>, <DataLink action="THIRD_GENERATION"/>, and <DataLink action="FOURTH_GENERATION"/> used in order,
				and their follow up skills <DataLink action="FIRST_LEGACY"/>, <DataLink action="SECOND_LEGACY"/>, <DataLink action="THIRD_LEGACY"/>, and <DataLink action="FOURTH_LEGACY"/> used in order with <DataLink action="OUROBOROS"/> finishing the window.
			</Trans>,
			suggestionWindowName: <DataLink action="REAWAKEN" showIcon={false} />,
			severityTiers: SEVERITIES,
			adjustCount: this.adjustExpectedActionCount.bind(this),
			adjustOutcome: this.adjustOutcome.bind(this),
		}))

		this.addEvaluator(new GenerationsEvalutor(this.data))
	}

	private adjustExpectedActionCount(window: HistoryEntry<EvaluatedAction[]>, action: TrackedActionGroup) {
		//All bets are off on a rush
		if (this.isRushedEndOfPullWindow(window)) {
			return -action.expectedPerWindow
		}
		return 0
	}

	private adjustOutcome(window: HistoryEntry<EvaluatedAction[]>, action: TrackedActionGroup) {
		if (action.actions[0].onGcd === false) { return undefined }
		if (action.actions[0] === this.data.actions.OUROBOROS) { return undefined }
		if (this.isRushedEndOfPullWindow(window)) { return undefined }

		return (actual: number, expected?: number) => {
			//Going over the expected count of generations is bad since that means you will lose the Ouroboros.
			return (actual === expected) ? RotationTargetOutcome.POSITIVE : RotationTargetOutcome.NEGATIVE
		}
	}
}
