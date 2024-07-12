import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {EvaluatedAction, ExpectedActionsEvaluator, ExpectedGcdCountEvaluator, TimedWindow, TrackedAction} from 'parser/core/modules/ActionWindow'
import {DisplayedActionEvaluator} from 'parser/core/modules/ActionWindow/evaluators/DisplayedActionEvaluator'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {ActionSpecifier, Cooldowns} from 'parser/core/modules/Cooldowns'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'
import {DfdTracker} from './LanceCharge'

const DRAGON_DURATION_MILLIS = 20000
const EXPECTED_NASTRONDS_PER_WINDOW = 3

// we can massively simplify this analyzer from Endwalker. It now functions like a standard timed window
// and we fold in all the analysis of what actions were missed and what were expected into standard formats.
// there is also now no expected delay tech except for holding buffs for fight downtime, so we'll rely
// on core for that as well
export class BloodOfTheDragon extends TimedWindow {
	static override handle = 'bloodOfTheDragon'
	static override title = t('drg.blood.title')`Life of the Dragon`
	static override displayOrder = DISPLAY_ORDER.LIFE_OF_THE_DRAGON

	@dependency globalCooldown!: GlobalCooldown
	@dependency cooldowns!: Cooldowns

	override startAction: ActionSpecifier = 'GEIRSKOGUL'
	override duration = DRAGON_DURATION_MILLIS

	private dfdTrackers: DfdTracker[] = []
	private currentDfdWindow?: DfdTracker
	private previousDfdWindow?: DfdTracker

	override initialise(): void {
		super.initialise()

		// copying this from LC, might want to have like a shared thing for these two windows (they are both
		// 60s windows)
		const lotdStartFilter = filter<Event>().source(this.parser.actor.id).action(this.data.actions.GEIRSKOGUL.id)
			.type('action')

		const dfdActionFilter = filter<Event>().source(this.parser.actor.id).type('action')
			.action(this.data.actions.DRAGONFIRE_DIVE.id)

		this.addEventHook(lotdStartFilter, this.onLotdStart)
		this.addEventHook(dfdActionFilter, this.onDfd)

		// do we uhhhh have a lotd icon??? in the game anymore???
		const suggestionIcon = this.data.actions.NASTROND.icon
		const suggestionWindowName = <Trans id="drg.lotd.suggestions.window-name">Life of the Dragon</Trans>
		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: 8,
			globalCooldown: this.globalCooldown,
			hasStacks: false,
			suggestionIcon,
			suggestionContent: <Trans id="drg.lotd.suggestions.missedgcd.content">
				Try to land at least 8 GCDs during every Life of the Dragon window.
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
					expectedPerWindow: EXPECTED_NASTRONDS_PER_WINDOW,
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
			suggestionContent: <Trans id="drg.lotd.suggestions.missedaction.content">Try to use as many of your oGCDs as possible during Life of the Dragon. Remember to keep your abilities on cooldown, when possible, to prevent them from drifting outside of your buff windows.</Trans>,
			suggestionWindowName,
			severityTiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
			adjustCount: this.adjustExpectedActionCount.bind(this),
		}))

		// and... life surge I guess
		// the rules for holding this are pretty annoying. I could probably figure it out but will wait until
		// post-dawntrail launch to get that settled. Until then we'll keep it as a displayed action eval in all drg window
		// modules
		this.addEvaluator(new DisplayedActionEvaluator([this.data.actions.LIFE_SURGE]))
	}

	private onLotdStart(event: Events['action']) {
		// couple cases to enumerate here
		// is DFD off-cooldown at any point during this window
		const willBeOffCd = this.cooldowns.remaining('DRAGONFIRE_DIVE') < DRAGON_DURATION_MILLIS

		// if DFD is on CD, is that ok?
		// i think this just comes down to if it was used in the previous window? if it was, we don't expect it
		// if it wasn't we do
		const expectedInThisWindow = !(this.previousDfdWindow?.used ?? false)

		// are there other cases? what if someone's not using it on CD

		// construct current
		this.currentDfdWindow = {
			start: event.timestamp,
			expected: willBeOffCd || expectedInThisWindow,
			used: false,
		}

		this.dfdTrackers.push(this.currentDfdWindow)

		this.addTimestampHook(event.timestamp + this.duration, () => this.onBotdEnd())
	}

	private onDfd() {
		if (this.currentDfdWindow != null) {
			this.currentDfdWindow.used = true
		}
	}

	private onBotdEnd() {
		// little bit of analysis
		if (this.currentDfdWindow != null) {
			this.previousDfdWindow = this.currentDfdWindow
			this.currentDfdWindow = undefined
		}
	}

	private adjustExpectedActionCount(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) {
		// so if a drg is rushing we don't really have expectations of specific actions that get fit in the window, we just want the buff used.
		if (this.isRushedEndOfPullWindow(window) && action.action.id !== this.data.actions.DRAGONFIRE_DIVE.id) {
			return -1
		}

		// attempt to adjust DFD expected uses
		if (action.action.id === this.data.actions.DRAGONFIRE_DIVE.id || action.action.id === this.data.actions.RISE_OF_THE_DRAGON.id) {
			// ok quick eject if there's only actually one DFD here because in that case this check isn't relevant
			// this is just to avoid flagging an error if someone doesn't use it because it's on CD during the window
			// and has been previously using it correctly
			const currentWindowDfd = window.data.filter(d => d.action.id === this.data.actions.DRAGONFIRE_DIVE.id)
			if (currentWindowDfd.length === 1) {
				return 0
			}

			// find the window extra data
			const dfdData = this.dfdTrackers.find(d => d.start === window.start)

			if (dfdData) {
				if (!dfdData.expected) {
					return -1
				}
			}
		}

		return 0
	}

}
