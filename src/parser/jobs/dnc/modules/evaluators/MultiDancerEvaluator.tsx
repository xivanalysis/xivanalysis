import {Trans} from '@lingui/react'
import {EvaluatedAction, EvaluationOutput, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import React from 'react'

const MULTI_DNC_ERROR = {
	NONE: 0,
	THEY_OVERWROTE: 1,
	YOU_OVERWROTE: 2,
}

export class MultiDancerEvaluator implements WindowEvaluator {
	private multiDncNote: (window: HistoryEntry<EvaluatedAction[]>) => number

	constructor(multiDncNote: (window: HistoryEntry<EvaluatedAction[]>) => number) {
		this.multiDncNote = multiDncNote
	}

	// this is purely informational
	public suggest() { return undefined }

	public output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput | undefined {
		const notes = windows.map(w => this.multiDncNote(w))
		if (notes.every(note => note === MULTI_DNC_ERROR.NONE)) {
			return undefined
		}

		return {
			format: 'notes',
			header: {
				header: <Trans id="dnc.technicalities.rotation-table.header.interference">Window Interference</Trans>,
				accessor: 'interference',
			},
			rows: notes.map(n => {
				if (n === MULTI_DNC_ERROR.THEY_OVERWROTE) {
					return <Trans id="dnc.technicalities.notes.they-overwrote">Overwritten by Other DNC</Trans>
				}

				if (n === MULTI_DNC_ERROR.YOU_OVERWROTE) {
					return <Trans id="dnc.technicalities.notes.you-overwrote">You Overwrote an Existing Window</Trans>
				}

				return <></>
			}),
		}
	}
}
