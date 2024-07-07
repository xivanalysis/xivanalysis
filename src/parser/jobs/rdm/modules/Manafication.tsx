import {t, Trans} from '@lingui/macro'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {dependency} from 'parser/core/Injectable'
import {AllowedGcdsOnlyEvaluator, BuffWindow, EvaluatedAction, ExpectedGcdCountEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {EndOfWindowHandlingMode} from 'parser/core/modules/ActionWindow/windows/BuffWindow'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import {DISPLAY_ORDER} from 'parser/jobs/rdm/modules/DISPLAY_ORDER'

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

const MANAFICATION_GCDS = 6

export class Manafication extends BuffWindow {
	static override displayOrder = DISPLAY_ORDER.MANAFICATION
	static override handle = 'Manafication'
	static override title = t('rdm.ms.title')`Manafication Windows`

	@dependency globalCooldown!: GlobalCooldown

	override buffStatus = this.data.statuses.MANAFICATION
	override endOfWindowHandlingMode: EndOfWindowHandlingMode = 'SAME-TIMESTAMP'

	override initialise() {
		super.initialise()

		this.trackOnlyActions(ONLY_SHOW.map(k => this.data.actions[k].id))

		const suggestionIcon = this.data.statuses.MANAFICATION.icon
		const suggestionWindowName = <StatusLink status="MANAFICATION" showIcon={false}/>
		this.addEvaluator(
			new ExpectedGcdCountEvaluator({
				expectedGcds: MANAFICATION_GCDS,
				globalCooldown: this.globalCooldown,
				hasStacks: true,
				suggestionIcon,
				suggestionContent: <Trans id="rdm.manafication.suggestions.missedgcd.content">
					Try to land a full enchanted combo and combo finisher during every <StatusLink status="MANAFICATION" /> window.
				</Trans>,
				suggestionWindowName,
				severityTiers: {
					1: SEVERITY.MAJOR,
				},
				adjustCount: this.adjustExpectedGcdCount.bind(this),
			}))
		this.addEvaluator(
			new AllowedGcdsOnlyEvaluator({
				expectedGcdCount: MANAFICATION_GCDS,
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
				suggestionContent: <Trans id="rdm.manafication.suggestions.badgcd.content">
					GCDs used during <StatusLink status="MANAFICATION"/> should be limited to enchanted combo and combo finisher skills.
				</Trans>,
				suggestionWindowName,
				severityTiers: {
                    1: SEVERITY.MEDIUM,
					2: SEVERITY.MAJOR,
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
			if (possibleGCDs < MANAFICATION_GCDS) {
				return possibleGCDs - defaultEoFValue
			}
		}

		return 0
	}
}
