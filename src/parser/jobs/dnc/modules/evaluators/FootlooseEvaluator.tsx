import {Plural, Trans} from '@lingui/react'
import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {RulePassedEvaluator} from 'parser/core/modules/ActionWindow/evaluators/RulePassedEvaluator'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {DEFAULT_SEVERITY_TIERS} from '../../CommonData'

export interface FootlooseEvaluatorOpts {
	expectedDanceMoves: {[key: number]: number}
	suggestionIcon: string
	errorIndex: number[]
}

export class FootlooseEvaluator extends RulePassedEvaluator {
	private expectedDanceMoves: {[key: number]: number}
	private suggestionIcon: string
	private errorIndex: number[]

	override header = {
		header: <Trans id="dnc.dirty-dancing.rotation-table.header.footloose">No Extra Moves</Trans>,
		accessor: 'footloose',
	}

	constructor(opts: FootlooseEvaluatorOpts) {
		super()

		this.expectedDanceMoves = opts.expectedDanceMoves
		this.suggestionIcon = opts.suggestionIcon
		this.errorIndex = opts.errorIndex
	}

	passesRule(window: HistoryEntry<EvaluatedAction[]>) {
		const openerId = window.data[0].action.id
		const actual = window.data.length - 2
		const expected = this.expectedDanceMoves[openerId]
		if (actual === expected) { return true }
		if (actual > expected) {
			if (!this.errorIndex.includes(window.start)) {
				this.errorIndex.push(window.start)
			}
			return false
		}
		return undefined
	}

	override suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const footlooseDances = this.failedRuleCount(windows)
		return new TieredSuggestion({
			icon: this.suggestionIcon,
			content: <Trans id="dnc.dirty-dancing.suggestions.footloose.content">
				Performing the wrong steps makes your dance take longer and leads to a loss of DPS uptime. Make sure to perform your dances correctly.
			</Trans>,
			tiers: DEFAULT_SEVERITY_TIERS,
			value: footlooseDances,
			why: <Trans id="dnc.dirty-dancing.suggestions.footloose.why">
				<Plural value={footlooseDances} one="# dance" other="# dances"/> finished with extra steps.
			</Trans>,
		})
	}
}
