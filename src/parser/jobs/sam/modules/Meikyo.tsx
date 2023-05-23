import {t, Trans} from '@lingui/macro'
import {ActionLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {dependency} from 'parser/core/Injectable'
import {AllowedGcdsOnlyEvaluator, BuffWindow, EvaluatedAction, ExpectedGcdCountEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

// Set for stuff to ignore TODO: revisit this and get it to show iaijutsu properly
// const IGNORE_THIS = new Set([ACTIONS.MIDARE_SETSUGEKKA.id, ACTIONS.TENKA_GOKEN.id, ACTIONS.HIGANBANA.id, ACTIONS.KAESHI_SETSUGEKKA.id, ACTIONS.KAESHI_GOKEN.id, ACTIONS.KAESHI_HIGANBANA])
const ONLY_SHOW: ActionKey[] = [
	'HAKAZE',
	'JINPU',
	'SHIFU',
	'FUKO',
	'GEKKO',
	'MANGETSU',
	'KASHA',
	'OKA',
	'YUKIKAZE',
]

const SEN_GCDS = 3

// A set const for SAM speed with 0 speed and shifu up, not sure I like this idea tbh but Aza requested it.
// GCD = 2.18
const SAM_BASE_GCD_SPEED_BUFFED = 2180

export class Meikyo extends BuffWindow {
	static override displayOrder = DISPLAY_ORDER.MEIKYO
	static override handle = 'Meikyo'
	static override title = t('sam.ms.title')`Meikyo Shisui Windows`

	@dependency globalCooldown!: GlobalCooldown

	override buffStatus = this.data.statuses.MEIKYO_SHISUI

	override initialise() {
		super.initialise()

		this.trackOnlyActions(ONLY_SHOW.map(k => this.data.actions[k].id))

		const suggestionIcon = this.data.actions.MEIKYO_SHISUI.icon
		const suggestionWindowName = <ActionLink action="MEIKYO_SHISUI" showIcon={false}/>
		this.addEvaluator(
			new ExpectedGcdCountEvaluator({
				expectedGcds: SEN_GCDS,
				globalCooldown: this.globalCooldown,
				hasStacks: true,
				suggestionIcon,
				suggestionContent: <Trans id="sam.ms.suggestions.missedgcd.content">
					Try to land 3 GCDs during every <ActionLink action="MEIKYO_SHISUI" /> window.
				</Trans>,
				suggestionWindowName,
				severityTiers: {
					1: SEVERITY.MEDIUM,
					2: SEVERITY.MAJOR,
				},
				adjustCount: this.adjustExpectedGcdCount.bind(this),
			}))
		this.addEvaluator(
			new AllowedGcdsOnlyEvaluator({
				expectedGcdCount: SEN_GCDS,
				allowedGcds: [
					// Single Target
					this.data.actions.GEKKO.id,
					this.data.actions.KASHA.id,
					this.data.actions.YUKIKAZE.id,

					// AoE
					this.data.actions.OKA.id,
					this.data.actions.MANGETSU.id,
				],
				globalCooldown: this.globalCooldown,
				suggestionIcon,
				suggestionContent: <Trans id="sam.ms.suggestions.badgcd.content">
					GCDs used during <ActionLink action="MEIKYO_SHISUI"/> should be limited to sen building skills.
				</Trans>,
				suggestionWindowName,
				severityTiers: {
					1: SEVERITY.MAJOR,
				},
				adjustCount: this.adjustExpectedGcdCount.bind(this),
			}))
	}

	private adjustExpectedGcdCount(window: HistoryEntry<EvaluatedAction[]>) {
		if (this.isRushedEndOfPullWindow(window)) {
			const defaultEoFValue = Math.ceil(((window.end ?? window.start) - window.start) / this.globalCooldown.getDuration())

			// This is using floor instead of ceiling to grant some forgiveness to first weave slot casts at the cost of 2nd weaves might be too forgiven
			const fightTimeRemaining = (this.parser.pull.timestamp + this.parser.pull.duration) - window.start
			const possibleGCDs = Math.floor(fightTimeRemaining / SAM_BASE_GCD_SPEED_BUFFED)

			// No Samurai, you can not slash so fast you bend space-time and get 2 GCDs for the price of 1
			if (possibleGCDs < SEN_GCDS) {
				return possibleGCDs - defaultEoFValue
			}
		}

		return 0
	}
}
