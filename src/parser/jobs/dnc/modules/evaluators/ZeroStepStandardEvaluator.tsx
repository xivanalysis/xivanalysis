import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {RulePassedEvaluator} from 'parser/core/modules/ActionWindow/evaluators/RulePassedEvaluator'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

export interface ZeroStepStandardEvaluatorOpts {
	standardFinishId: number
	suggestionIcon: string
}

export class ZeroStepStandardEvaluator extends RulePassedEvaluator {
	private standardFinishId: number
	private suggestionIcon: string

	override header = undefined

	constructor(opts: ZeroStepStandardEvaluatorOpts) {
		super()

		this.standardFinishId = opts.standardFinishId
		this.suggestionIcon = opts.suggestionIcon
	}

	passesRule(window: HistoryEntry<EvaluatedAction[]>) {
		const finisherId = window.data[window.data.length-1].action.id
		if (finisherId === this.standardFinishId) {
			return false
		}

		return undefined
	}

	override suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const zeroStandards = this.failedRuleCount(windows)
		return new TieredSuggestion({
			icon: this.suggestionIcon,
			content: <Trans id="dnc.dirty-dancing.suggestions.zero-standard.content">
				Using <DataLink action="STANDARD_FINISH" /> without completing any steps provides no damage buff to you and your <DataLink status="DANCE_PARTNER" />, which is a core part of the job. Make sure to perform your dances correctly.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			value: zeroStandards,
			why: <Trans id="dnc.dirty-dancing.suggestions.zero-standard.why">
				<Plural value={zeroStandards} one="# Standard Step was" other="# Standard Steps were"/> completed with no dance steps.
			</Trans>,
		})
	}
}
