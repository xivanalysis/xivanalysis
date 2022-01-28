import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {RotationTargetOutcome} from 'components/ui/RotationTable'
import {Events} from 'event'
import _ from 'lodash'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, calculateExpectedGcdsForTime, EvaluatedAction, EvaluationOutput, ExpectedActionsEvaluator, ExpectedGcdCountEvaluator, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import {ensureArray, isDefined} from 'utilities'
import DISPLAY_ORDER from './DISPLAY_ORDER'

// give it a gcd for marking as truncated window
const SHORT_WINDOW_BUFFER: number = 2500

const EXPECTED_GCD_COUNT = 8

// indicator for why the window was short (did you die or did your partner)
const SHORT_WINDOW_FAULT = {
	NONE: 0,			// everything's fine, no one's at fault
	PARTNER: 1,
	DRG: 2,
}

// Override WindowEvaluator directly to allow the column to not show if all windows
// have None status.
class ShortWindowEvaluator implements WindowEvaluator {

	private shortWindowReason: (window: HistoryEntry<EvaluatedAction[]>) => number

	constructor(shortWindowReason: (window: HistoryEntry<EvaluatedAction[]>) => number) {
		this.shortWindowReason = shortWindowReason
	}

	public suggest()  { return undefined }

	public output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput | undefined {
		const faults = windows.map(window => this.shortWindowReason(window))
		if (faults.every(fault => fault === SHORT_WINDOW_FAULT.NONE)) {
			return undefined
		}
		return {
			format: 'notes',
			header: {
				header: <Trans id="drg.ds.notes.header">Short Window Cause</Trans>,
				accessor: 'shortwindow',
			},
			rows: faults.map(fault => {
				// check for a truncated window if not rushing, which would indicate that the tether partner (or the DRG) died
				if (fault === SHORT_WINDOW_FAULT.PARTNER) {
					return <Trans id="drg.ds.notes.partnerdied">Partner Died</Trans>
				}

				if (fault === SHORT_WINDOW_FAULT.DRG) {
					return <Trans id="drg.ds.notes.drgdied">You Died</Trans>
				}

				return <></>
			}),
		}

	}
}

export default class DragonSight extends BuffWindow {
	static override handle = 'dragonsight'
	static override title = t('drg.dragonsight.title')`Dragon Sight`
	static override displayOrder = DISPLAY_ORDER.DRAGON_SIGHT

	@dependency globalCooldown!: GlobalCooldown

	buffAction = this.data.actions.DRAGON_SIGHT
	override buffStatus = [this.data.statuses.RIGHT_EYE, this.data.statuses.RIGHT_EYE_SOLO]

	deathTimes: number[] = []

	override initialise() {
		super.initialise()

		this.addEventHook({type: 'death', actor: this.parser.actor.id}, this.onDeath)

		const suggestionIcon = this.data.actions.DRAGON_SIGHT.icon
		const suggestionWindowName = <ActionLink action="DRAGON_SIGHT" showIcon={false}/>
		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: EXPECTED_GCD_COUNT,
			globalCooldown: this.globalCooldown,
			suggestionIcon,
			suggestionContent: <Trans id="drg.ds.suggestions.missedgcd.content">
				Try to land at least 8 GCDs during every <ActionLink action="DRAGON_SIGHT" /> window.
			</Trans>,
			suggestionWindowName,
			severityTiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				4: SEVERITY.MAJOR,
			},
			adjustCount: this.adjustExpectedGcdCount.bind(this),
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
				{
					action: this.data.actions.DRAGONFIRE_DIVE,
					expectedPerWindow: 1,
				},
			],
			suggestionIcon,
			suggestionContent: <Trans id="drg.lc.suggestions.missedaction.content">Try to use as many of your oGCDs as possible during <ActionLink action="DRAGON_SIGHT" />. Remember to keep your abilities on cooldown, when possible, to prevent them from drifting outside of your buff windows.</Trans>,
			suggestionWindowName,
			severityTiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				6: SEVERITY.MAJOR,
			},
			adjustCount: this.adjustExpectedActionCount.bind(this),
			adjustOutcome: this.adjustExpectedActionOutcome.bind(this),
		}))

		this.addEvaluator(new ShortWindowEvaluator(this.buffTargetDied.bind(this)))
	}

	private onDeath(event: Events['death']) {
		this.deathTimes.push(event.timestamp)
	}

	private adjustExpectedGcdCount(window: HistoryEntry<EvaluatedAction[]>) {
		// ok so we don't want to penalize people for when their buff ends early because their partner died
		if (this.buffTargetDied(window) === SHORT_WINDOW_FAULT.PARTNER) {
			// you get what you get and that's ok in this case
			return -calculateExpectedGcdsForTime(EXPECTED_GCD_COUNT, this.globalCooldown.getDuration(), window.start, window.end)
		}

		// note that if the drg died we don't reduce gcds because that's something you personally can fix
		// if neither player died, there is also no adjustment to make
		return 0
	}

	private adjustExpectedActionCount(window: HistoryEntry<EvaluatedAction[]>) {
		// so if a drg is rushing we don't really have expectations of specific actions that get fit in the window, we just want the buff used.
		// also adjust expected tracked gcds for partner dying
		if (this.isRushedEndOfPullWindow(window) ||
			this.buffTargetDied(window) === SHORT_WINDOW_FAULT.PARTNER) {
			return -1
		}

		// unlike lance charge, there are no adjustments expected here due to DS being a two minute CD
		return 0
	}

	private adjustExpectedActionOutcome(window: HistoryEntry<EvaluatedAction[]>) {
		// adjust highlighting for partner dying
		// if partner dies, we reduce expected to 0 but still highlight a 0 in the table
		if (this.buffTargetDied(window) === SHORT_WINDOW_FAULT.PARTNER) {
			return (actual: number, expected?: number) => {
				if (!isDefined(expected) || actual <= expected) {
					return RotationTargetOutcome.NEGATIVE
				}
				return RotationTargetOutcome.POSITIVE
			}
		}
	}

	// pulled into a helper due to use in multiple spots
	// returns true if:
	// - the buff ended early during the fight
	private buffTargetDied(buffWindow: HistoryEntry<EvaluatedAction[]>): number {
		const windowDurationMillis = _.max(ensureArray(this.buffStatus).map(s => s.duration)) ?? 0
		const actualWindowDuration = (buffWindow?.end ?? buffWindow.start) - buffWindow.start

		// first check if the window would go past the end, and then check if the actual buff duration was
		// shorter than expected
		if (this.isRushedEndOfPullWindow(buffWindow)) {
			return SHORT_WINDOW_FAULT.NONE
		}

		// if the window duration does not match the actual time (within a reasonable threshold)
		// mark it
		if (actualWindowDuration < (windowDurationMillis - SHORT_WINDOW_BUFFER)) {
			// ok now check to see if a player death happened within the expected window.
			const playerDeath = this.deathTimes.filter(deathTime => {
				// check if time is within reasonable distance of the window end
				return (buffWindow.start < deathTime && deathTime < buffWindow.start + (actualWindowDuration + SHORT_WINDOW_BUFFER))
			})

			// if there was a player death, oops it's your fault now
			if (playerDeath.length > 0) {
				return SHORT_WINDOW_FAULT.DRG
			}

			// otherwise it's your partner and you're off the hook
			return SHORT_WINDOW_FAULT.PARTNER
		}

		return SHORT_WINDOW_FAULT.NONE
	}
}
