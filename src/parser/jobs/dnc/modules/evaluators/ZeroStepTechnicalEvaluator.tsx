import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {RulePassedEvaluator} from 'parser/core/modules/ActionWindow/evaluators/RulePassedEvaluator'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

export interface ZeroStepTechnicalEvaluatorOpts {
	technicalFinishId: number
	suggestionIcon: string
}

export class ZeroStepTechnicalEvaluator extends RulePassedEvaluator {
	private technicalFinishId: number
	private suggestionIcon: string

	override header = undefined

	constructor(opts: ZeroStepTechnicalEvaluatorOpts) {
		super()

		this.technicalFinishId = opts.technicalFinishId
		this.suggestionIcon = opts.suggestionIcon
	}

	passesRule(window: HistoryEntry<EvaluatedAction[]>) {
		const finisherId = window.data[window.data.length-1].action.id
		if (finisherId === this.technicalFinishId) {
			return false
		}

		return undefined
	}

	override suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const zeroTechnicals = this.failedRuleCount(windows)
		if (zeroTechnicals > 0) {
			return new Suggestion({
				icon: this.suggestionIcon,
				content: <Trans id="dnc.dirty-dancing.suggestions.zero-technical.content">
					Using <DataLink action="TECHNICAL_FINISH" /> without completing any steps provides no damage buff to you and your party, which is a core part of the job. Make sure to perform your dances correctly.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="dnc.dirty-dancing.suggestions.zero-technical.why">
					<Plural value={zeroTechnicals} one="# Technical Step was" other="# Technical Steps were"/> completed with no dance steps.
				</Trans>,
			})
		}
	}
}
