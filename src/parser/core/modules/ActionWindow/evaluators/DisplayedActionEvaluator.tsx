import {ActionLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import React from 'react'
import Suggestion from '../../Suggestions/Suggestion'
import {EvaluatedAction} from '../EvaluatedAction'
import {HistoryEntry} from '../History'
import {EvaluationOutput, WindowEvaluator} from './WindowEvaluator'

/**
 * Lists the number of actions used in a window without any expected minimums
 */
export class DisplayedActionEvaluator implements WindowEvaluator {
	private expectedActions: Action[]

	constructor(actions: Action[]) {
		this.expectedActions = actions
	}

	public output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput[]  {
		return this.expectedActions.map(action => {
			return {
				format: 'table',
				header: {
					header: <ActionLink showName={false} {...action}/>,
					accessor: action.name,
				},
				rows: windows.map(window => {
					return {
						actual: this.countUsed(window, action),
						expected: undefined,
					}
				}),
			}
		})
	}

	public suggest(): Suggestion | undefined {
		return undefined
	}

	protected countUsed(window: HistoryEntry<EvaluatedAction[]>, action: Action) {
		return window.data.filter(cast => cast.action.id === action.id).length
	}
}
