import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Action, ActionKey} from 'data/ACTIONS'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, EvaluatedAction, EvaluationOutput, ExpectedGcdCountEvaluator, LimitedActionsEvaluator, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
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
}

const EXPECTED_GCDS = 11

const SUPPORT_ACTIONS: ActionKey[] = [
	'FEINT',
	'MANTRA',
	'THUNDERCLAP',
	'RIDDLE_OF_EARTH',
	'SECOND_WIND',
	'LEG_SWEEP',
	'BLOODBATH',
	'ARMS_LENGTH',
	'TRUE_NORTH',
	'SPRINT',
]

interface MasterfulBlitzEvaluatorOpts {
	blitzSkills: Array<Action['id']>,
}

class MasterfulBlitzEvaluator implements WindowEvaluator {
	private blitzSkills: Array<Action['id']>

	constructor(opts: MasterfulBlitzEvaluatorOpts) {
		this.blitzSkills = opts.blitzSkills
	}

	suggest() {
		return undefined
	}

	output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput {
		return {
			format: 'table',
			header: {
				header: <ActionLink showName={false} action="MASTERFUL_BLITZ"/>,
				accessor: 'masterfulblitz',
			},
			rows: windows.map(window => {
				return {
					actual: this.countBlitzSkills(window),
					expected: undefined,
				}
			}),
		}
	}

	private countBlitzSkills(window: HistoryEntry<EvaluatedAction[]>): number {
		return window.data.filter(value => this.blitzSkills.includes(value.action.id)).length
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

		this.ignoreActions(fillActions(SUPPORT_ACTIONS, this.data))

		this.addEvaluator(new MasterfulBlitzEvaluator({
			blitzSkills: this.blitzSkills,
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
			suggestionIcon: this.data.actions.RIDDLE_OF_FIRE.icon,
			suggestionContent: <Trans id="mnk.rof.suggestions.meditation.content">
				Avoid using <ActionLink action="MEDITATION"/>, <ActionLink action="ANATMAN"/> or <ActionLink action="FORM_SHIFT"/> under <ActionLink action="RIDDLE_OF_FIRE"/> as this is essentially wasting a GCD.
			</Trans>,
			suggestionWindowName,
			severityTiers: SEVERITIES.BAD_GCDS,
		}))
	}
}
