import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {RulePassedEvaluator} from 'parser/core/modules/ActionWindow/evaluators/RulePassedEvaluator'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Data} from 'parser/core/modules/Data'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {TECHNICAL_SEVERITY_TIERS} from '../Technicalities'

export interface TimelyDevilmentEvaluatorOpts {
	data: Data
}

export class TimelyDevilmentEvaluator extends RulePassedEvaluator {
	private devilmentAction: Action

	header = {
		header: <Trans id="dnc.technicalities.rotation-table.header.missed"><DataLink showName={false} action="DEVILMENT" /> On Time?</Trans>,
		accessor: 'timely',
	}

	constructor(devilmentAction: Action) {
		super()
		this.devilmentAction = devilmentAction
	}

	override suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const lateDevilments = this.failedRuleCount(windows)
		return new TieredSuggestion({
			icon: this.devilmentAction.icon,
			content: <Trans id="dnc.technicalities.suggestions.late-devilments.content">
				Using <DataLink action="DEVILMENT" /> as early as possible during your <DataLink status="TECHNICAL_FINISH" /> windows allows you to maximize the multiplicative bonuses that both statuses give you. It should be used immediately after <DataLink action="TECHNICAL_FINISH" />.
			</Trans>,
			tiers: TECHNICAL_SEVERITY_TIERS,
			value: lateDevilments,
			why: <Trans id="dnc.technicalities.suggestions.late-devilments.why">
				<Plural value={lateDevilments} one="# Devilment was" other="# Devilments were"/> used later than optimal.
			</Trans>,
		})
	}

	override passesRule(window: HistoryEntry<EvaluatedAction[]>): boolean | undefined {
		// If the window didn't contain Devilment, we're not evaluating it
		if (window.data.filter(entry => entry.action.id === this.devilmentAction.id).length === 0) {
			return
		}

		// If the window actually contains Devilment, determine if it was used on time
		if (window.data[0].action.id === this.devilmentAction.id) {
			return true
		}

		return false
	}
}
