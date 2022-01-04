import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {dependency} from 'parser/core/Injectable'
import {
	BuffWindow,
	EvaluatedAction,
	EvaluationOutput,
	ExpectedGcdCountEvaluator,
	LimitedActionsEvaluator,
	WindowEvaluator,
} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY, Suggestion, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {BLITZ_SKILLS} from './constants'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'
import {fillActions} from './utilities'

const TOTAL_GCD_DURING_ROF_SEVERITY = {
	10: SEVERITY.MINOR,
	9: SEVERITY.MEDIUM,
	6: SEVERITY.MAJOR,
}

const BROTHERHOOD_OUTSIDE_ROF_SEVERITY = {
	1: SEVERITY.MEDIUM,
	2: SEVERITY.MAJOR,
}

const BAD_GCD_DURING_ROF_SEVERITY = {
	1: SEVERITY.MEDIUM,
	2: SEVERITY.MAJOR,
}

const EXPECTED_GCDS = 11

class MasterfulBlitzEvaluator implements WindowEvaluator {
	private blitzSkills: Array<Action['id']>
	private celestialRevolution: Action
	private masterfulBlitz: Action

	constructor(blitzSkills: Array<Action['id']>, celestialRevolution: Action, masterfulBlitz: Action) {
		this.blitzSkills = blitzSkills
		this.celestialRevolution = celestialRevolution
		this.masterfulBlitz = masterfulBlitz
	}

	suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const celestialRevolutionUsages = windows.map(previousValue => previousValue.data)
			.reduce((previousValue, currentValue) => previousValue.concat(currentValue))
			.filter(value => value.action === this.celestialRevolution)
			.length

		if (celestialRevolutionUsages > 0) {
			return new Suggestion({
				icon: this.celestialRevolution.icon,
				content: <Trans id="mnk.rof.suggestions.celestialrevolution.content">Avoid using <ActionLink
					action="CELESTIAL_REVOLUTION"/>.</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="mnk.rof.suggestions.celestialrevolution.why"><ActionLink
					action="RISING_PHOENIX"/> and <ActionLink action="ELIXIR_FIELD"/> do more potency along with
					AoE.</Trans>,
			})
		}
	}

	output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput {
		return {
			format: 'table',
			header: {
				header: <ActionLink showName={false} action={'MASTERFUL_BLITZ'}/>,
				accessor: 'masterfulblitz',
			},
			rows: windows.map((window, i) => {
				return {
					actual: this.countBlitzSkills(window),
					expected: this.numberOfBlitzExpectedInWindow(i, windows),
				}
			}),
		}
	}

	private countBlitzSkills(window: HistoryEntry<EvaluatedAction[]>): number {
		return window.data.filter(value => this.blitzSkills.includes(value.action.id)).length
	}

	private numberOfBlitzExpectedInWindow(windowIndex: number, windows: Array<HistoryEntry<EvaluatedAction[]>>): number {
		// First window should always contain 2 blitz
		if (windowIndex === 0) {
			return 2
		}

		const blitzSkillsInLastWindow = this.countBlitzSkills(windows[windowIndex - 1])
		if (blitzSkillsInLastWindow === 2) {
			return 1
		}
		return 2
	}
}

class BrotherhoodEvaluator implements WindowEvaluator {
	private brotherhood: Action

	constructor(brotherhood: Action) {
		this.brotherhood = brotherhood
	}

	suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const missedBrotherhoodUsages = windows.filter((value, index) => index % 2 === 0)
			.map(previousValue => previousValue.data.filter(value => value.action === this.brotherhood))
			.filter(value => value.length === 0).length

		return new TieredSuggestion({
			icon: this.brotherhood.icon,
			tiers: BROTHERHOOD_OUTSIDE_ROF_SEVERITY,
			value: missedBrotherhoodUsages,
			content: <Trans id="mnk.rof.suggestions.brotherhood.content">Missed {missedBrotherhoodUsages} <ActionLink
				action="BROTHERHOOD"/> <Plural
				value={missedBrotherhoodUsages} one="usage" other="usages"/> in <ActionLink
				action="RIDDLE_OF_FIRE"/> window.
			</Trans>,
			why: <Trans id="mnk.rof.suggestions.brotherhood.why"><ActionLink
				action="BROTHERHOOD"/> has a shorter duration than <ActionLink action="RIDDLE_OF_FIRE"/>.</Trans>,
		})
	}

	output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput {
		return {
			format: 'table',
			header: {
				header: <ActionLink showName={false} action={'BROTHERHOOD'}/>,
				accessor: 'brotherhood',
			},
			rows: windows.map((window, i) => {
				return {
					actual: this.countBrotherhood(window),
					expected: this.numberOfBrotherhoodsExpectedInWindow(i),
				}
			}),
		}
	}

	private countBrotherhood(window: HistoryEntry<EvaluatedAction[]>): number {
		return window.data.filter(value => this.brotherhood === value.action).length
	}

	private numberOfBrotherhoodsExpectedInWindow(windowIndex: number): number {
		// 1 on odds and 0 on evens
		return 1 - windowIndex % 2
	}
}

export class RiddleOfFire extends BuffWindow {
	static override handle = 'riddleoffire'
	static override title = t('mnk.rof.title')`Riddle of Fire`
	static override displayOrder = DISPLAY_ORDER.RIDDLE_OF_FIRE

	@dependency globalCooldown!: GlobalCooldown

	blitzSkills = fillActions(BLITZ_SKILLS, this.data)

	buffStatus = this.data.statuses.RIDDLE_OF_FIRE

	override initialise() {
		super.initialise()

		const suggestionWindowName = <ActionLink action="RIDDLE_OF_FIRE"/>

		this.addEvaluator(new MasterfulBlitzEvaluator(this.blitzSkills, this.data.actions.CELESTIAL_REVOLUTION, this.data.actions.MASTERFUL_BLITZ))
		this.addEvaluator(new BrotherhoodEvaluator(this.data.actions.BROTHERHOOD))
		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: EXPECTED_GCDS,
			globalCooldown: this.globalCooldown,
			suggestionIcon: this.data.actions.RIDDLE_OF_FIRE.icon,
			severityTiers: TOTAL_GCD_DURING_ROF_SEVERITY,
			suggestionWindowName: suggestionWindowName,
			suggestionContent: <Trans id="mnk.rof.suggestions.gcd.content">Aim to hit {EXPECTED_GCDS} GCDs during
				each <ActionLink action="RIDDLE_OF_FIRE"/> window.</Trans>,
			adjustCount: window => {
				// 6SS counts as 2 GCDs
				return -this.numberOfSixSidedStarInWindow(window)
			},
		}))
		this.addEvaluator(new LimitedActionsEvaluator({
			expectedActions: [
				{
					action: this.data.actions.MEDITATION,
					expectedPerWindow: 0,
				},
				{
					action: this.data.actions.ANATMAN,
					expectedPerWindow: 0,
				},
				{
					action: this.data.actions.FORM_SHIFT,
					expectedPerWindow: 0,
				},
			],
			suggestionIcon: this.data.actions.MEDITATION.icon,
			suggestionContent: <Trans id="mnk.rof.suggestions.meditation.content">
				Avoid using <ActionLink action="MEDITATION"/> under <ActionLink action="RIDDLE_OF_FIRE"/> as this is
				essentially wasting a GCD.
			</Trans>,
			suggestionWindowName,
			severityTiers: BAD_GCD_DURING_ROF_SEVERITY,
		}))
	}

	private numberOfSixSidedStarInWindow(window: HistoryEntry<EvaluatedAction[]>): number {
		return window.data.filter(value => value.action.id === this.data.actions.SIX_SIDED_STAR.id).length
	}
}
