import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Data} from 'parser/core/modules/Data'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {TECHNICAL_SEVERITY_TIERS} from '../Technicalities'

export interface LateStandardEvaluatorOpts {
	data?: Data
}

export class LateStandardEvaluator implements WindowEvaluator {
	private _data?: Data

	constructor(opts: LateStandardEvaluatorOpts) {
		this._data = opts.data
	}

	protected get data() {
		if (!this._data) {
			throw new Error('No data found. Ensure this evaluator is being initialised with a reference to the data.')
		}

		return this._data
	}

	suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const lateStandards = windows.filter(window => this.determineLate(window)).length
		return new TieredSuggestion({
			icon: this.data.actions.STANDARD_STEP.icon,
			content: <Trans id="dnc.technicalities.suggestions.late-standards.content">
				Avoid using <DataLink action="STANDARD_STEP" /> at the end of a <DataLink status="TECHNICAL_FINISH" showIcon={false} /> window, when the finish will fall outside the buff. Use another GCD for buffed damage instead.
			</Trans>,
			tiers: TECHNICAL_SEVERITY_TIERS,
			value: lateStandards,
			why: <Trans id="dnc.technicalities.suggestions.late-standards.why">
				<Plural value={lateStandards} one="# Standard Finish" other="# Standard Finishes"/> missed the <DataLink status="TECHNICAL_FINISH" showIcon={false} /> buff.
			</Trans>,
		})
	}

	output(_windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		return undefined
	}

	private determineLate(window: HistoryEntry<EvaluatedAction[]>): boolean | undefined {
		if (window.data[window.data.length-1].action.id === this.data.actions.STANDARD_STEP.id) {
			return true
		}

		return false
	}
}
