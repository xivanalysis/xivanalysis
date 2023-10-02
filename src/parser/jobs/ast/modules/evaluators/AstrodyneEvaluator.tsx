import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {RulePassedEvaluator} from 'parser/core/modules/ActionWindow/evaluators/RulePassedEvaluator'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import React from 'react'
import {DivinationMetadata} from '../Divination'

export class AstrodyneEvaluator extends RulePassedEvaluator {
	private metadataHistory: History<DivinationMetadata>

	header = {
		header: <DataLink action="ASTRODYNE" showName={false} />,
		accessor: 'astrodyneActive',
	}

	constructor(metdataHistory: History<DivinationMetadata>) {
		super()

		this.metadataHistory = metdataHistory
	}

	override passesRule(window: HistoryEntry<EvaluatedAction[]>): boolean | undefined {
		const windowMetadata = this.metadataHistory.entries.find(entry => entry.start === window.start)
		if (windowMetadata == null) { return }
		return windowMetadata.data.astrodyne
	}
}
