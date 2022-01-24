import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Action, ActionRoot} from 'data/ACTIONS'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, EvaluatedAction, EvaluationOutput, ExpectedGcdCountEvaluator, LimitedActionsEvaluator, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {BLITZ_SKILLS} from './constants'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'
import {fillActions} from './utilities'

const SEVERITIES = {
	TOTAL_GCD: {
		10: SEVERITY.MINOR,
		9: SEVERITY.MEDIUM,
		6: SEVERITY.MAJOR,
	},
	BAD_GCDS: {
		1: SEVERITY.MEDIUM,
		2: SEVERITY.MAJOR,
	},
	CR_USAGE: {
		1: SEVERITY.MAJOR,
	},
}

const EXPECTED_GCDS = 11

interface MasterfulBlitzEvaluatorOpts {
	blitzSkills: Array<Action['id']>,
	celestialRevolution: Action,
	perfectBalance: ActionRoot['PERFECT_BALANCE'],
}

class MasterfulBlitzEvaluator implements WindowEvaluator {
	private blitzSkills: Array<Action['id']>
	private celestialRevolution: Action
	private perfectBalance: ActionRoot['PERFECT_BALANCE']

	constructor(opts: MasterfulBlitzEvaluatorOpts) {
		this.blitzSkills = opts.blitzSkills
		this.celestialRevolution = opts.celestialRevolution
		this.perfectBalance = opts.perfectBalance
	}

	suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const celestialRevolutionUsages = windows.map(previousValue => previousValue.data)
			.reduce((previousValue, currentValue) => previousValue.concat(currentValue))
			.filter(value => value.action === this.celestialRevolution)
			.length

		return new TieredSuggestion({
			icon: this.celestialRevolution.icon,
			content: <Trans id="mnk.rof.suggestions.celestialrevolution.content">
				Avoid using <ActionLink action="CELESTIAL_REVOLUTION"/>.
			</Trans>,
			tiers: SEVERITIES.CR_USAGE,
			value: celestialRevolutionUsages,
			why: <Trans id="mnk.rof.suggestions.celestialrevolution.why">
				<ActionLink action="RISING_PHOENIX"/> and <ActionLink action="ELIXIR_FIELD"/> do more potency along with AoE.
			</Trans>,
		})
	}

	output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput {
		return {
			format: 'table',
			header: {
				header: <ActionLink showName={false} action="MASTERFUL_BLITZ"/>,
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

		// If the time between the last RoF window is greater than double the CD of PB, then expect all PBs to be used
		if (this.timeBetweenLastWindowInSeconds(windowIndex, windows) > (this.perfectBalance.cooldown * 2)) {
			return 2
		}

		// Determined by the last window
		const blitzSkillsInLastWindow = this.numberOfBlitzExpectedInWindow(windowIndex - 1, windows)
		if (blitzSkillsInLastWindow === 2) {
			return 1
		}
		return 2
	}

	private timeBetweenLastWindowInSeconds(windowIndex: number, windows: Array<HistoryEntry<EvaluatedAction[]>>): number {
		if (windowIndex === 0) {
			return 0
		}
		return (windows[windowIndex].start - windows[windowIndex - 1].start) / 1000
	}
}

export class RiddleOfFire extends BuffWindow {
	static override handle = 'riddleoffire'
	static override title = t('mnk.rof.title')`Riddle of Fire`
	static override displayOrder = DISPLAY_ORDER.RIDDLE_OF_FIRE

	@dependency globalCooldown!: GlobalCooldown

	private blitzSkills = fillActions(BLITZ_SKILLS, this.data)
	buffStatus = this.data.statuses.RIDDLE_OF_FIRE

	override initialise() {
		super.initialise()

		const suggestionWindowName = <ActionLink action="RIDDLE_OF_FIRE"/>

		this.addEvaluator(new MasterfulBlitzEvaluator({
			blitzSkills: this.blitzSkills,
			celestialRevolution: this.data.actions.CELESTIAL_REVOLUTION,
			perfectBalance: this.data.actions.PERFECT_BALANCE,
		}))
		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: EXPECTED_GCDS,
			globalCooldown: this.globalCooldown,
			suggestionIcon: this.data.actions.RIDDLE_OF_FIRE.icon,
			severityTiers: SEVERITIES.TOTAL_GCD,
			suggestionWindowName: suggestionWindowName,
			suggestionContent: <Trans id="mnk.rof.suggestions.gcd.content">
				Aim to hit {EXPECTED_GCDS} GCDs during each <ActionLink action="RIDDLE_OF_FIRE"/> window.
			</Trans>,
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
				Avoid using <ActionLink action="MEDITATION"/>, <ActionLink action="MEDITATION"/> or <ActionLink action="FORM_SHIFT"/> under <ActionLink action="RIDDLE_OF_FIRE"/> as this is essentially wasting a GCD.
			</Trans>,
			suggestionWindowName,
			severityTiers: SEVERITIES.BAD_GCDS,
		}))
	}
}
