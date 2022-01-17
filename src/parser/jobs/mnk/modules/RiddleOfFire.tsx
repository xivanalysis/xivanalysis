import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Action, ActionRoot} from 'data/ACTIONS'
import {BASE_GCD} from 'data/CONSTANTS'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
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

const SEVERITIES = {
	TOTAL_GCD_DURING_ROF_SEVERITY: {
		10: SEVERITY.MINOR,
		9: SEVERITY.MEDIUM,
		6: SEVERITY.MAJOR,
	},
	BROTHERHOOD_OUTSIDE_ROF_SEVERITY: {
		1: SEVERITY.MEDIUM,
		2: SEVERITY.MAJOR,
	},
	BAD_GCD_DURING_ROF_SEVERITY: {
		1: SEVERITY.MEDIUM,
		2: SEVERITY.MAJOR,
	},
}

const DOUBLE_PERFECT_BALANCE_IN_SECONDS = 80

const EXPECTED_GCDS = 11

class MasterfulBlitzEvaluator implements WindowEvaluator {
	private blitzSkills: Array<Action['id']>
	private celestialRevolution: Action
	private brotherhood: Action

	constructor(blitzSkills: Array<Action['id']>, celestialRevolution: Action, brotherhood: Action) {
		this.blitzSkills = blitzSkills
		this.celestialRevolution = celestialRevolution
		this.brotherhood = brotherhood
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

		// If brotherhood was used we always want 2 blitz skills
		const isBrotherhoodInWindow = windows[windowIndex].data.filter(value => value.action.id === this.brotherhood.id).length > 0
		if (isBrotherhoodInWindow) {
			return 2
		}

		if (this.timeBetweenLastWindowInSeconds(windowIndex, windows) > DOUBLE_PERFECT_BALANCE_IN_SECONDS) {
			return 2
		}

		const blitzSkillsInLastWindow = this.countBlitzSkills(windows[windowIndex - 1])
		if (blitzSkillsInLastWindow === 2) {
			return 1
		}
		return 2
	}

	private timeBetweenLastWindowInSeconds(windowIndex: number, windows: Array<HistoryEntry<EvaluatedAction[]>>): number {
		if (windowIndex === 0) {
			return 0
		}
		return (windows[windowIndex].start - windows[windowIndex].start) / 1000
	}
}

class BrotherhoodEvaluator implements WindowEvaluator {
	private brotherhood: ActionRoot['BROTHERHOOD']
	private brotherhoodStartHistory: number[]

	constructor(brotherhood: ActionRoot['BROTHERHOOD'], brotherhoodStartHistory: number[]) {
		this.brotherhood = brotherhood
		this.brotherhoodStartHistory = brotherhoodStartHistory
	}

	suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const possibleNumberOfBrotherhoods = Math.ceil(windows.length / 2)
		const brotherhoodUsagesInsideRof = windows.map(previousValue => previousValue.data.filter(value => value.action === this.brotherhood))
			.filter(value => value.length > 0).length
		const missedBhInsideRof = possibleNumberOfBrotherhoods - brotherhoodUsagesInsideRof

		return new TieredSuggestion({
			icon: this.brotherhood.icon,
			tiers: SEVERITIES.BROTHERHOOD_OUTSIDE_ROF_SEVERITY,
			value: missedBhInsideRof,
			content: <Trans id="mnk.rof.suggestions.brotherhood.content">Missed {missedBhInsideRof} <ActionLink
				action="BROTHERHOOD"/> inside <ActionLink action="RIDDLE_OF_FIRE"/> window.
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
					actual: this.countBrotherhoodNearWindow(window),
					expected: this.numberOfBrotherhoodsExpectedInWindow(i, windows),
				}
			}),
		}
	}

	private countBrotherhoodNearWindow(window: HistoryEntry<EvaluatedAction[]>): number {
		// Check if Brotherhood was used in a 2 GCD window of RoF
		return this.brotherhoodStartHistory.filter(brotherhoodStartTimestamp => Math.abs(window.start - brotherhoodStartTimestamp) < (BASE_GCD * 2)).length
	}

	private numberOfBrotherhoodsExpectedInWindow(windowIndex: number, windows: Array<HistoryEntry<EvaluatedAction[]>>): number {
		// The first window should always have a Brotherhood
		if (windowIndex === 0) {
			return 1
		}

		if (this.lastBrotherhoodActionIsGreaterThanCooldown(windowIndex, windows)) {
			return 1
		}

		return 0
	}

	private lastBrotherhoodActionIsGreaterThanCooldown(windowIndex: number, windows: Array<HistoryEntry<EvaluatedAction[]>>): boolean {
		for (let i = windowIndex - 1; i >= 0; --i) {
			if (this.countBrotherhoodNearWindow(windows[i]) > 0) {
				return (windows[windowIndex].start - windows[i].start) > this.brotherhood.cooldown
			}
		}

		return false
	}
}

export class RiddleOfFire extends BuffWindow {
	static override handle = 'riddleoffire'
	static override title = t('mnk.rof.title')`Riddle of Fire`
	static override displayOrder = DISPLAY_ORDER.RIDDLE_OF_FIRE

	@dependency globalCooldown!: GlobalCooldown

	private blitzSkills = fillActions(BLITZ_SKILLS, this.data)
	private brotherhoodStartHistory: number[] = []
	buffStatus = this.data.statuses.RIDDLE_OF_FIRE

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>()
			.source(this.parser.actor.id)
		const buffFilter = playerFilter.action(this.data.actions.BROTHERHOOD.id)
		this.addEventHook(buffFilter.type('action'), this.onBrotherhoodAction)

		const suggestionWindowName = <ActionLink action="RIDDLE_OF_FIRE"/>

		this.addEvaluator(new MasterfulBlitzEvaluator(this.blitzSkills, this.data.actions.CELESTIAL_REVOLUTION, this.data.actions.BROTHERHOOD))
		this.addEvaluator(new BrotherhoodEvaluator(this.data.actions.BROTHERHOOD, this.brotherhoodStartHistory))
		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: EXPECTED_GCDS,
			globalCooldown: this.globalCooldown,
			suggestionIcon: this.data.actions.RIDDLE_OF_FIRE.icon,
			severityTiers: SEVERITIES.TOTAL_GCD_DURING_ROF_SEVERITY,
			suggestionWindowName: suggestionWindowName,
			suggestionContent: <Trans id="mnk.rof.suggestions.gcd.content">Aim to hit {EXPECTED_GCDS} GCDs during
				each <ActionLink action="RIDDLE_OF_FIRE"/> window.</Trans>,
			adjustCount: window => {
				// 6SS counts as 2 GCDs
				return -window.data.filter(value => value.action.id === this.data.actions.SIX_SIDED_STAR.id).length
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
			severityTiers: SEVERITIES.BAD_GCD_DURING_ROF_SEVERITY,
		}))
	}

	private onBrotherhoodAction(event: Events['action']) {
		this.brotherhoodStartHistory.push(event.timestamp)
	}
}
