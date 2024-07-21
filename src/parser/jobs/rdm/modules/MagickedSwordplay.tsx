import {t, Trans} from '@lingui/macro'
import {StatusLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {dependency} from 'parser/core/Injectable'
import {AllowedGcdsOnlyEvaluator, BuffWindow, EvaluatedAction, ExpectedGcdCountEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {EndOfWindowHandlingMode} from 'parser/core/modules/ActionWindow/windows/BuffWindow'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import {DISPLAY_ORDER} from 'parser/jobs/rdm/modules/DISPLAY_ORDER'
import React from 'react'

const ONLY_SHOW: ActionKey[] = [
	'ENCHANTED_RIPOSTE',
	'ENCHANTED_ZWERCHHAU',
	'ENCHANTED_REDOUBLEMENT',
	'ENCHANTED_MOULINET',
	'ENCHANTED_MOULINET_DEUX',
	'ENCHANTED_MOULINET_TROIS',
	'ENCHANTED_REPRISE',
	'JOLT_III',
	'VERTHUNDER_III',
	'VERAERO_III',
	'VERSTONE',
	'VERFIRE',
	'IMPACT',
	'VERCURE',
	'VERRAISE',
	'VERFLARE',
	'VERHOLY',
	'SCORCH',
	'RESOLUTION',
	'GRAND_IMPACT',
]

const MAGICK_GCDS = 3

export class MagickedSwordplay extends BuffWindow {
	static override displayOrder = DISPLAY_ORDER.MAGICKED_SWORDPLAY
	static override handle = 'MagickedSwordplay'
	static override title = t('rdm.ms.title')`Magicked Swordplay Windows`

	@dependency globalCooldown!: GlobalCooldown

	override buffStatus = this.data.statuses.MAGICKED_SWORDPLAY
	override endOfWindowHandlingMode: EndOfWindowHandlingMode = 'SAME-TIMESTAMP'

	override initialise() {
		super.initialise()

		this.trackOnlyActions(ONLY_SHOW.map(k => this.data.actions[k].id))

		const suggestionIcon = this.data.statuses.MAGICKED_SWORDPLAY.icon
		const suggestionWindowName = <StatusLink status="MAGICKED_SWORDPLAY" showIcon={false}/>
		this.addEvaluator(
			new ExpectedGcdCountEvaluator({
				expectedGcds: MAGICK_GCDS,
				globalCooldown: this.globalCooldown,
				hasStacks: true,
				suggestionIcon,
				suggestionContent: <Trans id="rdm.ms.suggestions.missedgcd.content">
					Try to land a full Enchanted Single Target or Enchanted AE combo during every <StatusLink status="MAGICKED_SWORDPLAY" /> window.
				</Trans>,
				suggestionWindowName,
				severityTiers: {
					1: SEVERITY.MAJOR,
				},
				adjustCount: this.adjustExpectedGcdCount.bind(this),
			}))
		this.addEvaluator(
			new AllowedGcdsOnlyEvaluator({
				expectedGcdCount: MAGICK_GCDS,
				allowedGcds: [
					// Single Target
					this.data.actions.ENCHANTED_RIPOSTE.id,
					this.data.actions.ENCHANTED_ZWERCHHAU.id,
					this.data.actions.ENCHANTED_REDOUBLEMENT.id,

					// AoE
					this.data.actions.ENCHANTED_MOULINET.id,
					this.data.actions.ENCHANTED_MOULINET_DEUX.id,
					this.data.actions.ENCHANTED_MOULINET_TROIS.id,

					// Finishers
					this.data.actions.VERHOLY.id,
					this.data.actions.VERFLARE.id,
					this.data.actions.SCORCH.id,
					this.data.actions.RESOLUTION.id,
				],
				globalCooldown: this.globalCooldown,
				suggestionIcon,
				suggestionContent: <Trans id="rdm.ms.suggestions.badgcd.content">
					GCDs used during <StatusLink status="MAGICKED_SWORDPLAY"/> should be limited to combo skills.
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
			const possibleGCDs = Math.floor(fightTimeRemaining / this.globalCooldown.getDuration())

			//No magic will give you 2 GCDs for the price of 1
			if (possibleGCDs < MAGICK_GCDS) {
				return possibleGCDs - defaultEoFValue
			}
		}

		return 0
	}
}
