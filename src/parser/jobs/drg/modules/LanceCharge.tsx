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

const LC_DURATION = 20000
const EXPECTED_NASTRONDS_PER_WINDOW = 3

export interface DfdTracker {
	start: number
	expected: boolean
	used: boolean
}

export default class LanceCharge extends BuffWindow {
	static override handle: string = 'lancecharge'
	static override title = t('drg.lancecharge.title')`Lance Charge`
	static override displayOrder = DISPLAY_ORDER.LANCE_CHARGE

	@dependency globalCooldown!: GlobalCooldown
	@dependency cooldowns!: Cooldowns

	override buffStatus = this.data.statuses.LANCE_CHARGE

	override prependMessages = <Message info>
		<Trans id="drg.lc.prepend-message"><ActionLink action="DRAGONFIRE_DIVE" /> has a two minute cooldown and should be used in every other window under optimal circumstances. We do our best in this module to avoid marking windows where <ActionLink action="DRAGONFIRE_DIVE" /> was not available as errors.</Trans>
	</Message>

	private dfdTrackers: DfdTracker[] = []
	private currentDfdWindow?: DfdTracker
	private previousDfdWindow?: DfdTracker

	override initialise() {
		super.initialise()

		const lcStatusFilter = filter<Event>()
			.source(this.parser.actor.id)
			.status(this.data.statuses.LANCE_CHARGE.id)

		const dfdActionFilter = filter<Event>().source(this.parser.actor.id).type('action')
			.action(this.data.actions.DRAGONFIRE_DIVE.id)

		this.addEventHook(lcStatusFilter.type('statusApply'), this.onLcStatusApply)
		this.addEventHook(dfdActionFilter, this.onDfd)
		this.addEventHook(lcStatusFilter.type('statusRemove'), this.onLcStatusRemove)

		const suggestionIcon = this.data.actions.LANCE_CHARGE.icon
		const suggestionWindowName = <ActionLink action="LANCE_CHARGE" showIcon={false}/>
		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: 8,
			globalCooldown: this.globalCooldown,
			hasStacks: false,
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
			suggestionContent: <Trans id="drg.lc.suggestions.missedaction.content">Try to use as many of your oGCDs as possible during <ActionLink action="LANCE_CHARGE" />. Remember to keep your abilities on cooldown, when possible, to prevent them from drifting outside of your buff windows.</Trans>,
			suggestionWindowName,
			severityTiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
			adjustCount: this.adjustExpectedActionCount.bind(this),
		}))

		this.addEvaluator(new DisplayedActionEvaluator([this.data.actions.LIFE_SURGE]))
	}

	private onLcStatusApply(event: Events['statusApply']) {
		// couple cases to enumerate here
		// is DFD off-cooldown at any point during this window
		const willBeOffCd = this.cooldowns.remaining('DRAGONFIRE_DIVE') < LC_DURATION

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
	}

	private onDfd() {
		if (this.currentDfdWindow != null) {
			this.currentDfdWindow.used = true
		}
	}

	private onLcStatusRemove() {
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

		// attempt to adjust DFD and therefore ROTD expected uses
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
