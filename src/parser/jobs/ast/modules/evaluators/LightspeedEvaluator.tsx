import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {RulePassedEvaluator} from 'parser/core/modules/ActionWindow/evaluators/RulePassedEvaluator'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {DivinationMetadata} from '../Divination'

export interface LightspeedEvaluatorOpts {
	metdataHistory: History<DivinationMetadata>
	suggestionIcon: string
}

export class LightspeedEvaluator extends RulePassedEvaluator {
	private metadataHistory: History<DivinationMetadata>
	private suggestionIcon: string

	header = {
		header: <DataLink action="LIGHTSPEED" showName={false} />,
		accessor: 'lightspeedActive',
	}

	constructor(opts: LightspeedEvaluatorOpts) {
		super()

		this.metadataHistory = opts.metdataHistory
		this.suggestionIcon = opts.suggestionIcon
	}

	override suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const unusedLightspeed = this.failedRuleCount(windows)
		if (unusedLightspeed === 0) { return }

		// SUGGESTION: not using lightspeed in any divination window
		return new Suggestion({
			icon: this.suggestionIcon,
			content: <Trans id="ast.divination.suggestion.lightspeed.usage.content">
				<DataLink action="LIGHTSPEED" /> is necessary for every <DataLink action="DIVINATION" /> window to use the many oGCD actions to maximize potential raid damage output. Use <DataLink action="LIGHTSPEED" showIcon={false} /> around <DataLink action="DIVINATION" showIcon={false} /> windows to ensure all applicable actions are able to fit within.
			</Trans>,
			severity: SEVERITY.MAJOR,
			why: <Trans id="ast.divination.suggestion.lightspeed.usage.why">
				{unusedLightspeed} <Plural value={unusedLightspeed} one="cast" other="casts" /> of <DataLink action="LIGHTSPEED" /> were missed during <DataLink action="DIVINATION" /> windows resulting in lost actions during burst phases.
			</Trans>,
		})
	}

	override passesRule(window: HistoryEntry<EvaluatedAction[]>): boolean | undefined {
		const windowMetadata = this.metadataHistory.entries.find(entry => entry.start === window.start)
		if (windowMetadata == null) { return }
		return windowMetadata.data.lightspeed
	}
}
