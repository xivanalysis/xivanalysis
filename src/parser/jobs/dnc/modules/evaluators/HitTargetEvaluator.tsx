import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {RulePassedEvaluator} from 'parser/core/modules/ActionWindow/evaluators/RulePassedEvaluator'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {DEFAULT_SEVERITY_TIERS} from '../../CommonData'

export interface HitTargetEvaluatorOpts {
	missedDanceWindowStarts: number[]
	suggestionIcon: string
	finishIds: number[]
	errorIndex: number[]
}

export class HitTargetEvaluator extends RulePassedEvaluator {
	private missedDanceWindowStarts: number[]
	private suggestionIcon: string
	private finishIds: number[]
	private errorIndex: number[]

	override header = {
		header: <Trans id="dnc.dirty-dancing.rotation-table.header.missed">Hit Target</Trans>,
		accessor: 'missed',
	}

	constructor(opts: HitTargetEvaluatorOpts) {
		super()

		this.missedDanceWindowStarts = opts.missedDanceWindowStarts
		this.suggestionIcon = opts.suggestionIcon
		this.finishIds = opts.finishIds
		this.errorIndex = opts.errorIndex
	}

	override passesRule(window: HistoryEntry<EvaluatedAction[]>) {
		if (!this.finishIds.includes(window.data[window.data.length-1].action.id)) {
			return undefined
		}
		if (this.missedDanceWindowStarts.includes(window.start)) {
			if (!this.errorIndex.includes(window.start)) {
				this.errorIndex.push(window.start)
			}
			return false
		}
		return true
	}

	override suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const missedDances = this.failedRuleCount(windows)
		return new TieredSuggestion({
			icon: this.suggestionIcon,
			content: <Trans id="dnc.dirty-dancing.suggestions.missed-finishers.content">
				<DataLink action="TECHNICAL_FINISH" /> and <DataLink action="STANDARD_FINISH" /> are a significant source of damage. Make sure you're in range when finishing a dance.
			</Trans>,
			tiers: DEFAULT_SEVERITY_TIERS,
			value: missedDances,
			why: <Trans id="dnc.dirty-dancing.suggestions.missed-finishers.why">
				<Plural value={missedDances} one="# finish" other="# finishes"/> missed.
			</Trans>,
		})
	}
}
