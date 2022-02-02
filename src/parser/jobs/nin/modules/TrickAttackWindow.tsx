import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, EvaluatedAction, ExpectedActionsEvaluator, ExpectedGcdCountEvaluator, LimitedActionsEvaluator, NotesEvaluator, TrackedAction} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

// TCJ windows should have 5-6 Ninjutsu + 2-3 (or 3-4, with good ping) weaponskills, non-TCJ windows should have 3 Ninjutsu + 4 weaponskills
const BASE_GCDS_PER_WINDOW = 7

// For opener detection - first Trick should be 8-9s into the fight, with a bit of wiggle room for late starts
const FIRST_TRICK_BUFFER = 12000

const MUDRAS: ActionKey[] = [
	'TEN',
	'TEN_KASSATSU',
	'CHI',
	'CHI_KASSATSU',
	'JIN',
	'JIN_KASSATSU',
]

class TCJEvaluator extends NotesEvaluator {

	// Because this class is not an Analyser, it cannot use Data directly
	// to get the id for Ten Chi Jin, so it has to take it in here.
	private tcjId: number

	constructor(tcjId: number) {
		super()
		this.tcjId = tcjId
	}

	header = {
		header: <Trans id ="nin.taWindow.chart.notes.header">TCJ Used</Trans>,
		accessor: 'tcjused',
	}

	override generateNotes(window: HistoryEntry<EvaluatedAction[]>) {
		// TODO - Add a note in here about Meisui-buffed Bhava, maybe?
		return window.data.find(cast => cast.action.id === this.tcjId) ?
			<Trans id="nin.taWindow.chart.notes.yes">Yes</Trans> :
			<Trans id="nin.taWindow.chart.notes.no">No</Trans>
	}
}

export class TrickAttackWindow extends BuffWindow {
	static override handle = 'taWindow'
	static override title = t('nin.taWindow.title')`Trick Attack Windows`

	@dependency globalCooldown!: GlobalCooldown

	override buffStatus = this.data.statuses.TRICK_ATTACK_VULNERABILITY_UP

	override initialise() {
		super.initialise()

		this.ignoreActions(MUDRAS.map(k => this.data.actions[k].id))

		const suggestionIcon = this.data.actions.TRICK_ATTACK.icon
		const suggestionWindowName = <ActionLink action="TRICK_ATTACK" showIcon={false}/>
		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: BASE_GCDS_PER_WINDOW,
			globalCooldown: this.globalCooldown,
			suggestionIcon,
			suggestionContent: <Trans id="nin.taWindow.suggestions.gcds.content">
				While the exact number of GCDs per window will vary depending on whether <ActionLink action="TEN_CHI_JIN"/> is up, every <ActionLink action="TRICK_ATTACK"/> window should contain at least <Plural value={BASE_GCDS_PER_WINDOW} one="# GCD" other="# GCDs" />.
			</Trans>,
			suggestionWindowName,
			severityTiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			adjustCount: this.adjustExpectedGcdCount.bind(this),
		}))

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{
					action: this.data.actions.HYOSHO_RANRYU,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.RAITON,
					expectedPerWindow: 2,
				},
				{
					action: this.data.actions.DREAM_WITHIN_A_DREAM,
					expectedPerWindow: 1,
				},
			],
			suggestionIcon,
			suggestionContent: <Trans id="nin.taWindow.suggestions.trackedactions.content">
				Every <ActionLink action="TRICK_ATTACK"/> window should contain <ActionLink action="HYOSHO_RANRYU"/>, 2 <ActionLink action="RAITON"/> casts, and <ActionLink action="DREAM_WITHIN_A_DREAM"/> in order to maximize damage.
			</Trans>,
			suggestionWindowName,
			severityTiers: {
				1: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			adjustCount: this.adjustExpectedRaitonCount.bind(this),
		}))

		this.addEvaluator(new LimitedActionsEvaluator({
			expectedActions: [
				{
					action: this.data.actions.ARMOR_CRUSH,
					expectedPerWindow: 0,
				},
			],
			suggestionIcon: this.data.actions.ARMOR_CRUSH.icon,
			suggestionContent: <Trans id="nin.taWindow.suggestions.badtrackedactions.content">
				Avoid using <ActionLink action="ARMOR_CRUSH"/> under <ActionLink action="TRICK_ATTACK"/> unless <ActionLink action="HUTON"/> is about to fall off or you can only hit the flank positional, as <ActionLink action="AEOLIAN_EDGE"/> is otherwise a higher potency finisher.
			</Trans>,
			suggestionWindowName,
			severityTiers: {
				1: SEVERITY.MINOR,
			},
		}))

		this.addEvaluator(new TCJEvaluator(this.data.actions.TEN_CHI_JIN.id))
	}

	private adjustExpectedGcdCount(window: HistoryEntry<EvaluatedAction[]>) {
		return window.data.find(cast => cast.action.id === this.data.actions.TEN_CHI_JIN.id) ? 1 : 0
	}

	private adjustExpectedRaitonCount(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) {
		const bufferedWindowStart = window.start - FIRST_TRICK_BUFFER

		if (action.action.id === this.data.actions.RAITON.id) {
			// We push one Raiton outside the Trick window in the opener to fit an extra Bhava
			if (bufferedWindowStart <= this.parser.pull.timestamp) {
				return -1
			}
		}

		return 0
	}
}
