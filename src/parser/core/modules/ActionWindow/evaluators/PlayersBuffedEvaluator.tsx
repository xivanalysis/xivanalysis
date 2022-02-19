import {Trans} from '@lingui/react'
import {EvaluatedAction, EvaluationOutput, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Suggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

interface TrackedBuffOpts {
	expectedCount: number,
	affectedPlayers: (window: HistoryEntry<EvaluatedAction[]>) => number
	suggestion: (windows: Array<HistoryEntry<EvaluatedAction[]>>) => Suggestion | undefined
}
/**
 * Checks the number of people a buff hit per window against an expected count.
 */
export class PlayersBuffedEvaluator implements WindowEvaluator {
	private affectedPlayers: (window: HistoryEntry<EvaluatedAction[]>) => number
	private expectedCount: number
	private suggestion: (windows: Array<HistoryEntry<EvaluatedAction[]>>) => Suggestion | undefined

	constructor(opts: TrackedBuffOpts) {
		this.affectedPlayers = opts.affectedPlayers
		this.expectedCount = opts.expectedCount
		this.suggestion = opts.suggestion
	}

	public suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		return this.suggestion(windows)
	}

	public output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput | undefined {
		const affected = windows.map(w => this.affectedPlayers(w))
		return {
			format: 'table',
			header: {
				header: <Trans id="core.raidbuffwindow.table.header.players">Players Buffed</Trans>,
				accessor: 'buffed',
			},
			rows: affected.map(a => {
				return {
					actual: a,
					expected: this.expectedCount,
				}
			}),
		}
	}
}
