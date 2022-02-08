import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
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

const EXPECTED_GCDS = 11

const SEVERITIES = {
	TOTAL_GCDS: {
		10: SEVERITY.MINOR,
		9: SEVERITY.MEDIUM,
		6: SEVERITY.MAJOR,
	},
	BAD_GCDS: {
		1: SEVERITY.MEDIUM,
		2: SEVERITY.MAJOR,
	},
}

const IGNORED_ACTIONS: ActionKey[] = [
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

interface BlitzEvaluatorOpts {
	blitzActions: Array<Action['id']>,
}

class BlitzEvaluator implements WindowEvaluator {
	private blitzActions: Array<Action['id']>

	constructor(opts: BlitzEvaluatorOpts) {
		this.blitzActions = opts.blitzActions
	}

	suggest() {
		return undefined
	}

	output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput {
		return {
			format: 'table',
			header: {
				header: <DataLink showName={false} action="MASTERFUL_BLITZ"/>,
				accessor: 'masterfulblitz',
			},
			rows: windows.map(window => {
				return {
					actual: this.countBlitzes(window),
					expected: undefined,
				}
			}),
		}
	}

	private countBlitzes(window: HistoryEntry<EvaluatedAction[]>): number {
		return window.data.filter(value => this.blitzActions.includes(value.action.id)).length
	}
}

export class RiddleOfFire extends BuffWindow {
	static override handle = 'riddleoffire'
	static override title = t('mnk.rof.title')`Riddle of Fire`
	static override displayOrder = DISPLAY_ORDER.RIDDLE_OF_FIRE

	@dependency globalCooldown!: GlobalCooldown

	private blitzActions = fillActions(BLITZ_SKILLS, this.data)
	buffStatus = this.data.statuses.RIDDLE_OF_FIRE

	override initialise() {
		super.initialise()

		const suggestionWindowName = <DataLink action="RIDDLE_OF_FIRE"/>

		this.ignoreActions(fillActions(IGNORED_ACTIONS, this.data))

		this.addEvaluator(new BlitzEvaluator({
			blitzSkills: this.blitzSkills,
		}))

		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: EXPECTED_GCDS,
			globalCooldown: this.globalCooldown,
			suggestionIcon: this.data.actions.RIDDLE_OF_FIRE.icon,
			severityTiers: SEVERITIES.TOTAL_GCDS,
			suggestionWindowName: suggestionWindowName,
			suggestionContent: <Trans id="mnk.rof.suggestions.gcd.content">
				Aim to hit {EXPECTED_GCDS} GCDs during each <DataLink action="RIDDLE_OF_FIRE"/> window.
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
			suggestionContent: <Trans id="mnk.rof.suggestions.wasted.content">
				Avoid using <DataLink action="MEDITATION"/>, <DataLink action="ANATMAN"/>, or <DataLink action="FORM_SHIFT"/> under <DataLink status="RIDDLE_OF_FIRE"/> as this is essentially wasting a GCD.
			</Trans>,
			suggestionWindowName: suggestionWindowName,
			severityTiers: SEVERITIES.BAD_GCDS,
		}))
	}
}
