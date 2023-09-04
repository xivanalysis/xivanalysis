import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {EvaluationOutput, WindowEvaluator, EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import React from 'react'

interface RiddleOfWindEvaluatorOpts {
	riddleActions: Array<Action['id']>,
}

export class RiddleOfWindEvaluator implements WindowEvaluator {
	private riddleActions: Array<Action['id']>

	constructor(opts: RiddleOfWindEvaluatorOpts) {
		this.riddleActions = opts.riddleActions
	}

	suggest() {
		return undefined
	}

	output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput {
		return {
			format: 'table',
			header: {
				header: <DataLink showName={false} action="RIDDLE_OF_WIND" />,
				accessor: 'riddleofwind',
			},
			rows: windows.map(window => {
				return {
					actual: this.usedRow(window) ? 1 : 0,
					expected: undefined,
				}
			}),
		}
	}

	private usedRow(window: HistoryEntry<EvaluatedAction[]>): boolean {
		return window.data.filter(value => this.riddleActions.includes(value.action.id)).length !== 0
	}
}
