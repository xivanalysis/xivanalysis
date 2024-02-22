import {Plural, Trans} from '@lingui/react'
import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {RulePassedEvaluator} from 'parser/core/modules/ActionWindow/evaluators/RulePassedEvaluator'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {DEFAULT_SEVERITY_TIERS} from '../../CommonData'

export interface DanceExpectations {
	expectedFinisherId: number,
	expectedDuration: number
}

export interface CleanDanceEvaluatorOpts {
	danceExpectations: {[key: number]: DanceExpectations}
	invulnerability: Invulnerability
	pullEnd: number
	suggestionIcon: string
	finishIds: number[]
	errorIndex: number[]
}

export class CleanDanceEvaluator extends RulePassedEvaluator {
	private danceExpectations: {[key: number]: DanceExpectations}
	private invulnerability: Invulnerability
	private pullEnd: number
	private suggestionIcon: string
	private finishIds: number[]
	private errorIndex: number[]

	override header = {
		header: <Trans id="dnc.dirty-dancing.rotation-table.header.dirty">Correct Finish</Trans>,
		accessor: 'dirty',
	}

	constructor(opts: CleanDanceEvaluatorOpts) {
		super()

		this.danceExpectations = opts.danceExpectations
		this.invulnerability = opts.invulnerability
		this.pullEnd = opts.pullEnd
		this.suggestionIcon = opts.suggestionIcon
		this.finishIds = opts.finishIds
		this.errorIndex = opts.errorIndex
	}

	passesRule(window: HistoryEntry<EvaluatedAction[]>) {
		const openerId = window.data[0].action.id
		const finisherId = window.data[window.data.length-1].action.id

		// If the last action of the window isn't one of the known finishers (ie. they died), bail
		if (!this.finishIds.includes(finisherId)) {
			return undefined
		}

		if (finisherId === this.danceExpectations[openerId].expectedFinisherId) {
			return true
		}

		const expectedEndTime = window.start + this.danceExpectations[openerId].expectedDuration
		// It's not the right finisher, but the fight was going to end so we won't fail it
		if (window.start + this.danceExpectations[openerId].expectedDuration > this.pullEnd) {
			return undefined
		}

		// Similarly, if the boss was going to be invulnerable at the expected end time, don't fail them
		if (this.invulnerability.isActive({timestamp: expectedEndTime, types: ['invulnerable']})) {
			return undefined
		}

		if (!this.errorIndex.includes(window.start)) {
			this.errorIndex.push(window.start)
		}
		return false
	}

	override suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const dirtyDances = this.failedRuleCount(windows)
		return new TieredSuggestion({
			icon: this.suggestionIcon,
			content: <Trans id="dnc.dirty-dancing.suggestions.dirty-dances.content">
				Performing fewer steps than expected reduces the damage of your finishes. Make sure you perform the expected number of steps.
			</Trans>,
			tiers: DEFAULT_SEVERITY_TIERS,
			value: dirtyDances,
			why: <Trans id="dnc.dirty-dancing.suggestions.dirty-dances.why">
				<Plural value={dirtyDances} one="# dance" other="# dances"/> finished with missing steps.
			</Trans>,
		})
	}
}
