import {t, Trans} from '@lingui/macro'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
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

const MANAFICATION_GCDS = 6

export class Manafication extends BuffWindow {
	static override displayOrder = DISPLAY_ORDER.MANAFICATION
	static override handle = 'Manafication'
	static override title = t('rdm.manafication.title')`Manafication Windows`

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
					Ensure you consume all stacks of <StatusLink status="MANAFICATION" /> so you don't lose out on <ActionLink action="PREFULGENCE" /> your single most powerful action.
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

					// Casted skills for rushing
					// Tested with this 7.05 Log: https://www.fflogs.com/reports/K7TyWcQwvpGH1B8X#fight=20&type=damage-done
					this.data.actions.VERAERO_III.id,
					this.data.actions.VERSTONE.id,
					this.data.actions.VERTHUNDER_III.id,
					this.data.actions.VERFIRE.id,
					this.data.actions.GRAND_IMPACT.id,
					this.data.actions.JOLT_III.id,

					//While this action isn't optimal in any sense of the word it does consume stacks, and during movement away might be warranted
					this.data.actions.ENCHANTED_REPRISE.id,
					//There are very very very niche situations where it's reasonable to use VerCure to consume stacks so I was asked to allow it.
					this.data.actions.VERCURE.id,
				],
				globalCooldown: this.globalCooldown,
				suggestionIcon,
				suggestionContent: <Trans id="rdm.manafication.suggestions.badgcd.content">
					GCDs used during <StatusLink status="MANAFICATION"/> should be limited to actions that consume <StatusLink status="MANAFICATION"/>
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
