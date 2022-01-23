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
					expectedPerWindow: 1,
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

		// couple of special cases
		// DFD: if it's on CD during the window, expect 0, otherwise, expect 1
		if (action.action.id === this.data.actions.DRAGONFIRE_DIVE.id) {
			// cd history
			const dfdCds = this.cooldowns.cooldownHistory('DRAGONFIRE_DIVE')

			// if the end of one of these cd history items is within the window expect 1
			// else 0. this is somewhat more forgiving than we might want...
			const end = window.end ?? this.parser.pull.timestamp + this.parser.pull.duration

			for (let i = 0; i < dfdCds.length; i++) {
				const current = dfdCds[i]
				const next = i + 1 < dfdCds.length ? dfdCds[i + 1] : undefined

				// special case for first
				if (i === 0) {
					if (window.start <= current.start && current.start < end) {
						return 0
					}
				}

				// check if it comes off cd in this window
				// if it did, return no adjustment
				if (window.start <= current.end && current.end < end) {
					return 0
				}

				if (next) {
					// did if come off cd before this window
					// and did the next come off cd after the end of this window
					// if yes we expect one here and you missed it rip
					if (current.end < window.start && next.start > end) {
						return 0
					}
				}
			}

			// on cd
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

			if (!window.next) {
				return 0
			}

			const nextWindowSsd = window.next.data.filter(d => d.action.id === this.data.actions.SPINESHATTER_DIVE.id)

			// if the next window has two and this one has 0, adjust accordingly
			if (currentWindowSsd.length === 0 && nextWindowSsd.length === 2) {
				return -1
			}

			// if this window has two and the _previous_ window had 0, adjust accordingly
			if (!window.prev) {
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
