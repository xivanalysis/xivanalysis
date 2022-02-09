import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, EvaluatedAction, ExpectedActionsEvaluator, ExpectedGcdCountEvaluator, TrackedAction} from 'parser/core/modules/ActionWindow'
import {DisplayedActionEvaluator} from 'parser/core/modules/ActionWindow/evaluators/DisplayedActionEvaluator'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Cooldowns} from 'parser/core/modules/Cooldowns'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import {Message} from 'semantic-ui-react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

interface SsdDelayTracker {
	nextWindowHoldSuccess: boolean
	ssdHeld: boolean
	expectsTwo: boolean
	ssdUseCount: number
	start: number
}

export default class LanceCharge extends BuffWindow {
	static override handle: string = 'lancecharge'
	static override title = t('drg.lancecharge.title')`Lance Charge`
	static override displayOrder = DISPLAY_ORDER.LANCE_CHARGE

	@dependency globalCooldown!: GlobalCooldown
	@dependency cooldowns!: Cooldowns

	override buffStatus = this.data.statuses.LANCE_CHARGE

	override prependMessages = <Message info>
		<Trans id="drg.lc.prepend-message"><ActionLink action="SPINESHATTER_DIVE" /> may be held (not used) during a buff window if you are instead able to use both charges during the next window. We do our best in this module to avoid marking windows where <ActionLink action="SPINESHATTER_DIVE" showIcon={false} /> was correctly held as errors. <ActionLink action="DRAGONFIRE_DIVE" /> should be used in every other window.</Trans>
	</Message>

	private ssdDelays: SsdDelayTracker[] = []
	private currentSsdWindow?: SsdDelayTracker
	private previousSsdWindow?: SsdDelayTracker

	override initialise() {
		super.initialise()

		const lcStatusFilter = filter<Event>()
			.source(this.parser.actor.id)
			.status(this.data.statuses.LANCE_CHARGE.id)

		const ssdActionFilter = filter<Event>().source(this.parser.actor.id).type('action')
			.action(this.data.actions.SPINESHATTER_DIVE.id)

		this.addEventHook(lcStatusFilter.type('statusApply'), this.onLcStatusApply)
		this.addEventHook(ssdActionFilter, this.onSsd)
		this.addEventHook(lcStatusFilter.type('statusRemove'), this.onLcStatusRemove)

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

		this.addEvaluator(new DisplayedActionEvaluator([this.data.actions.DRAGONFIRE_DIVE]))
	}

	private onLcStatusApply(event: Events['statusApply']) {
		// construct current
		this.currentSsdWindow = {
			nextWindowHoldSuccess: false,
			ssdHeld: false,
			ssdUseCount: 0,
			start: event.timestamp,
			expectsTwo: this.previousSsdWindow?.ssdHeld ?? false,
		}

		this.ssdDelays.push(this.currentSsdWindow)
	}

	private onSsd() {
		if (this.currentSsdWindow != null) {
			this.currentSsdWindow.ssdUseCount += 1
		}
	}

	private onLcStatusRemove() {
		// little bit of analysis
		if (this.currentSsdWindow != null) {
			const ssdCharges = this.cooldowns.charges('SPINESHATTER_DIVE')

			if (ssdCharges >= 1) {
				this.currentSsdWindow.ssdHeld = true
			}

			if (this.previousSsdWindow) {
				if (this.currentSsdWindow.ssdUseCount === 2 && this.previousSsdWindow.ssdHeld) {
					this.previousSsdWindow.nextWindowHoldSuccess = true
				}
			}

			this.previousSsdWindow = this.currentSsdWindow
			this.currentSsdWindow = undefined
		}
	}

	private adjustExpectedActionCount(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) {
		// so if a drg is rushing we don't really have expectations of specific actions that get fit in the window, we just want the buff used.
		if (this.isRushedEndOfPullWindow(window) && action.action.id !== this.data.actions.DRAGONFIRE_DIVE.id) {
			return -1
		}

		// SSD: if a buff window didn't have a SSD but the next one actually contained two SSDs, we correct
		// this window to expect 0 (this is due to SSD having charges and it's optimal to use both during the 2 minute windows)
		if (action.action.id === this.data.actions.SPINESHATTER_DIVE.id) {
			// ok quick eject if there's only actually one SSD here because in that case this check isn't relevant
			// this is just to avoid flagging an error if someone does hold charges correctly
			const currentWindowSsd = window.data.filter(d => d.action.id === this.data.actions.SPINESHATTER_DIVE.id)
			if (currentWindowSsd.length === 1) {
				return 0
			}

			// find the window extra data
			const ssdDelay = this.ssdDelays.find(d => d.start === window.start)

			if (ssdDelay) {
				if (ssdDelay.ssdHeld && ssdDelay.nextWindowHoldSuccess) {
					return -1
				}
				if (ssdDelay.expectsTwo) {
					return 1
				}

				// if we weren't expecting two but got two anyway, sure give it to them
				// this should only happen on the first window or after a downtime reset
				if (!ssdDelay.expectsTwo && currentWindowSsd.length === 2) {
					return 1
				}
			}
		}

		return 0
	}
}
