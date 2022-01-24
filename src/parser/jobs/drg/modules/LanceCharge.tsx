import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, EvaluatedAction, ExpectedActionsEvaluator, ExpectedGcdCountEvaluator, TrackedAction} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Cooldowns} from 'parser/core/modules/Cooldowns'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export default class LanceCharge extends BuffWindow {
	static override handle: string = 'lancecharge'
	static override title = t('drg.lancecharge.title')`Lance Charge`
	static override displayOrder = DISPLAY_ORDER.LANCE_CHARGE

	@dependency globalCooldown!: GlobalCooldown
	@dependency cooldowns!: Cooldowns

	override buffStatus = this.data.statuses.LANCE_CHARGE

	override initialise() {
		super.initialise()

		const suggestionIcon = this.data.actions.LANCE_CHARGE.icon
		const suggestionWindowName = <ActionLink action="LANCE_CHARGE" showIcon={false}/>
		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: 8,
			globalCooldown: this.globalCooldown,
			suggestionIcon,
			suggestionContent: <Trans id="drg.lc.suggestions.missedgcd.content">
				Try to land at least 8 GCDs during every <ActionLink action="LANCE_CHARGE" /> window.
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
				{
					action: this.data.actions.HIGH_JUMP,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.GEIRSKOGUL,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.DRAGONFIRE_DIVE,
					expectedPerWindow: 0,
				},
				{
					action: this.data.actions.MIRAGE_DIVE,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.LIFE_SURGE,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.SPINESHATTER_DIVE,
					expectedPerWindow: 1,
				},
			],
			suggestionIcon,
			suggestionContent: <Trans id="drg.lc.suggestions.missedaction.content">Try to use as many of your oGCDs as possible during <ActionLink action="LANCE_CHARGE" />. Remember to keep your abilities on cooldown, when possible, to prevent them from drifting outside of your buff windows.</Trans>,
			suggestionWindowName,
			severityTiers: {
				1: SEVERITY.MINOR,
				6: SEVERITY.MEDIUM,
				12: SEVERITY.MAJOR,
			},
			adjustCount: this.adjustExpectedActionCount.bind(this),
		}))
	}

	private adjustExpectedActionCount(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) {
		// so if a drg is rushing we don't really have expectations of specific actions that get fit in the window, we just want the buff used.
		if (this.isRushedEndOfPullWindow(window)) {
			return -1
		}

		// SSD: if a buff window didn't have a SSD but the next one actually contained two SSDs, we correct
		// this window to expect 0 (this is due to SSD having charges and it's optimal to use both during the 2 minute windows)
		// note that this _only_ happens if two SSDs were actually used in the next window.
		if (action.action.id === this.data.actions.SPINESHATTER_DIVE.id) {
			// ok quick eject if there's only actually one SSD here because in that case this check isn't relevant
			// this is just to avoid flagging an error if someone does hold charges correctly
			const currentWindowSsd = window.data.filter(d => d.action.id === this.data.actions.SPINESHATTER_DIVE.id)
			if (currentWindowSsd.length === 1) {
				return 0
			}

			if (window.next == null) {
				return 0
			}

			const nextWindowSsd = window.next.data.filter(d => d.action.id === this.data.actions.SPINESHATTER_DIVE.id)

			// if the next window has two and this one has 0, adjust accordingly
			if (currentWindowSsd.length === 0 && nextWindowSsd.length === 2) {
				return -1
			}

			// if this window has two and the _previous_ window had 0, adjust accordingly
			if (window.prev == null) {
				return 0
			}

			const prevWindowSsd = window.prev.data.filter(d => d.action.id === this.data.actions.SPINESHATTER_DIVE.id)

			if (currentWindowSsd.length === 2 && prevWindowSsd.length === 0) {
				// expect two
				return 1
			}
		}

		return 0
	}
}
