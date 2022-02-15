import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {EvaluatedAction, EvaluationOutput, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import React from 'react'

interface BlitzEvaluatorOpts {
	blitzActions: Array<Action['id']>,
	expected?: number
}

export class BlitzEvaluator implements WindowEvaluator {
	private readonly expected: number | undefined;
	private blitzActions: Array<Action['id']>

	constructor(opts: BlitzEvaluatorOpts) {
		this.blitzActions = opts.blitzActions
		this.expected = opts.expected
	}

	suggest() {
		return undefined
	}

	output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput {
		return {
			format: 'table',
			header: {
				header: <DataLink showName={false} action="MASTERFUL_BLITZ"/>,
				accessor: 'masterfulblitz',
			},
			rows: windows.map(window => {
				return {
					actual: this.countBlitzes(window),
					expected: this.expected,
				}
			}),
		}
	}

	private countBlitzes(window: HistoryEntry<EvaluatedAction[]>): number {
		return window.data.filter(value => this.blitzActions.includes(value.action.id)).length
	}
}
