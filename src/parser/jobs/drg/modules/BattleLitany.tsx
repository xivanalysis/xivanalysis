import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {EvaluatedAction, ExpectedActionsEvaluator, ExpectedGcdCountEvaluator, RaidBuffWindow, TrackedAction} from 'parser/core/modules/ActionWindow'
import {DisplayedActionEvaluator} from 'parser/core/modules/ActionWindow/evaluators/DisplayedActionEvaluator'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const BL_GCD_TARGET = 8
const NASTRONDS_PER_WINDOW = 3

export class BattleLitany extends RaidBuffWindow {
	static override handle = 'battlelitany'
	static override title = t('drg.battlelitany.title')`Battle Litany`
	static override displayOrder = DISPLAY_ORDER.BATTLE_LITANY

	@dependency private globalCooldown!: GlobalCooldown

	buffAction = this.data.actions.BATTLE_LITANY
	buffStatus = this.data.statuses.BATTLE_LITANY

	override initialise() {
		super.initialise()

		const suggestionIcon = this.data.actions.BATTLE_LITANY.icon
		const suggestionWindowName = <ActionLink action="BATTLE_LITANY" showIcon={false} />
		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: BL_GCD_TARGET,
			globalCooldown: this.globalCooldown,
			hasStacks: false,
			suggestionIcon,
			suggestionContent: <Trans id="drg.bl.suggestions.missedgcd.content">
				Try to land at least 8 GCDs during every <ActionLink action="BATTLE_LITANY" /> window.
			</Trans>,
			suggestionWindowName,
			severityTiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				4: SEVERITY.MAJOR,
			},
		}))

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				// let's do... jumps then life actions
				{
					action: this.data.actions.HIGH_JUMP,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.MIRAGE_DIVE,
					expectedPerWindow: 1,
				},
				// due to the CD of DFD, we do expect it to always be used inside of BL
				{
					action: this.data.actions.DRAGONFIRE_DIVE,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.RISE_OF_THE_DRAGON,
					expectedPerWindow: 1,
				},
				// life actions
				{
					action: this.data.actions.GEIRSKOGUL,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.NASTROND,
					expectedPerWindow: NASTRONDS_PER_WINDOW,
				},
				{
					action: this.data.actions.STARDIVER,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.STARCROSS,
					expectedPerWindow: 1,
				},
			],
			suggestionIcon,
			suggestionContent: <Trans id="drg.bl.suggestions.missedaction.content">Try to use as many of your oGCDs as possible during <ActionLink action="BATTLE_LITANY" />. Remember to keep your abilities on cooldown, when possible, to prevent them from drifting outside of your buff windows.</Trans>,
			suggestionWindowName,
			severityTiers: {
				// there are 10 total CDs expected, we'll say missing half is major
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
			adjustCount: this.adjustExpectedActionCount.bind(this),
		}))

		// and then life surge is just a trainwreck still (40s so you don't want to overcap but you also want to use it
		// as much as possible in buff windows)
		this.addEvaluator(new DisplayedActionEvaluator([this.data.actions.LIFE_SURGE]))
	}

	private adjustExpectedActionCount(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) {
		// so if a drg is rushing we don't really have expectations of specific actions that get fit in the window, we just want the buff used.
		if (this.isRushedEndOfPullWindow(window)) {
			if (action.action.id === this.data.actions.NASTROND.id) {
				// we expect 3 nastronds. while we could try to normalize for window duration left there might be other oGCDs that
				// had higher priority depending on fight specifics
				return -NASTRONDS_PER_WINDOW
			}

			return -1
		}
		return 0
	}
}
