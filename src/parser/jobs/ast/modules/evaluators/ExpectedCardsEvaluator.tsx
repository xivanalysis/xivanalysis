import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction, EvaluationOutput, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import React from 'react'
import {DivinationMetadata} from '../Divination'

const TARGET_CARDS_PLAYED = 3 //used to get the target for amount of cards played in window

interface ExpectedCardsEvaluatorOpts {
	metadataHistory: History<DivinationMetadata>
}
/**
 * Checks if a window contains the expected number of card buffs, either played during the window or just before such that they expire during the window
 */
export class ExpectedCardsEvaluator implements WindowEvaluator {
	private metadataHistory: History<DivinationMetadata>

	constructor(opts: ExpectedCardsEvaluatorOpts) {
		this.metadataHistory = opts.metadataHistory
	}

	public suggest(_windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		return undefined
	}

	public output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput  {
		return {
			format: 'table',
			header: {
				header: <DataLink action="PLAY_I" showName={false} />,
				accessor: 'cardsPlayed',
			},
			rows: windows.map(window => {
				const windowMetadata = this.metadataHistory.entries.find(entry => entry.start === window.start)
				return {
					actual: windowMetadata?.data.cardsInWindow ?? 0,
					expected: TARGET_CARDS_PLAYED,
				}
			}),
		}
	}
}
