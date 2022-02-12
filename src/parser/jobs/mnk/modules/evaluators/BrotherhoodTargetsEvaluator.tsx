import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {EvaluatedAction, EvaluationOutput, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {BrotherhoodWindow} from 'parser/jobs/mnk/modules/Brotherhood'
import React from 'react'
import {Trans} from "@lingui/react";

interface BrotherhoodTargetsEvaluatorOpts {
	brotherhoodWindows: BrotherhoodWindow[]
}

export class BrotherhoodTargetsEvaluator implements WindowEvaluator {
	private brotherhoodWindows: BrotherhoodWindow[]

	constructor(opts: BrotherhoodTargetsEvaluatorOpts) {
		this.brotherhoodWindows = opts.brotherhoodWindows
	}

	suggest() {
		return undefined
	}

	output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput {
		return {
			format: 'table',
			header: {
				header: <Trans id="mnk.bh.players-count">Players Buffed</Trans>,
				accessor: 'players',
			},
			rows: windows.map((_, i) => {
				return {
					actual: this.brotherhoodWindows[i].targetsAffected,
					expected: 8,
				}
			}),
		}
	}
}
