import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {RotationTargetOutcome} from 'components/ui/RotationTable'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {DeathEvent} from 'fflogs'
import {BuffWindowModule, BuffWindowState} from 'parser/core/modules/BuffWindow'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import {isDefined} from 'utilities'
import DISPLAY_ORDER from './DISPLAY_ORDER'

// give it a gcd for marking as truncated window
const SHORT_WINDOW_BUFFER: number = 2500

// indicator for why the window was short (did you die or did your partner)
const SHORT_WINDOW_FAULT = {
	NONE: 0,			// everything's fine, no one's at fault
	PARTNER: 1,
	DRG: 2,
}

export default class DragonSight extends BuffWindowModule {
	static override handle = 'dragonsight'
	static override title = t('drg.dragonsight.title')`Dragon Sight`
	static override displayOrder = DISPLAY_ORDER.DRAGON_SIGHT

	buffAction = ACTIONS.DRAGON_SIGHT
	buffStatus = STATUSES.RIGHT_EYE
	secondaryBuffStatus = STATUSES.RIGHT_EYE_SOLO

	deathTimes: number[] = []

	override expectedGCDs = {
		expectedPerWindow: 8,
		suggestionContent: <Trans id="drg.ds.suggestions.missedgcd.content">
			Try to land at least 8 GCDs during every <ActionLink {...ACTIONS.DRAGON_SIGHT} /> window.
		</Trans>,
		severityTiers: {
			1: SEVERITY.MINOR,
			2: SEVERITY.MEDIUM,
			4: SEVERITY.MAJOR,
		},
	}

	override trackedActions = {
		icon: ACTIONS.DRAGON_SIGHT.icon,
		actions: [
			{
				action: ACTIONS.CHAOS_THRUST,
				expectedPerWindow: 1,
			},
			{
				action: ACTIONS.FULL_THRUST,
				expectedPerWindow: 1,
			},
			{
				action: ACTIONS.FANG_AND_CLAW,
				expectedPerWindow: 1,
			},
			{
				action: ACTIONS.WHEELING_THRUST,
				expectedPerWindow: 1,
			},
		],
		suggestionContent: <Trans id="drg.ds.suggestions.trackedactions.content">
			Each <ActionLink {...ACTIONS.DRAGON_SIGHT} /> window should contain at least one use each of <ActionLink {...ACTIONS.CHAOS_THRUST} />, <ActionLink {...ACTIONS.FULL_THRUST} />, <ActionLink {...ACTIONS.FANG_AND_CLAW} />, and <ActionLink {...ACTIONS.WHEELING_THRUST} />. In order to ensure that these actions fall within the buff window, try to avoid using <ActionLink {...ACTIONS.DRAGON_SIGHT} /> after <ActionLink {...ACTIONS.CHAOS_THRUST} /> or <ActionLink {...ACTIONS.FULL_THRUST} />.
		</Trans>,
		severityTiers: {
			1: SEVERITY.MINOR,
			3: SEVERITY.MEDIUM,
			5: SEVERITY.MAJOR,
		},
	}

	protected override init() {
		super.init()

		this.addEventHook('death', {to: 'player'}, this.onDeath)
	}

	private onDeath(event: DeathEvent) {
		this.deathTimes.push(event.timestamp)
	}

	protected override reduceTrackedActionsEndOfFight(buffWindow: BuffWindowState): number {
		const windowDurationMillis = this.buffStatus.duration
		const fightTimeRemaining = this.parser.pull.duration - (buffWindow.start - this.parser.eventTimeOffset)

		// so if a drg is rushing we don't really have expectations of specific actions that get fit in the window, we just want the buff used.
		if (windowDurationMillis >= fightTimeRemaining) {
			return 1
		}

		return 0
	}

	// ok so we don't want to penalize people for when their buff ends early because their partner died
	protected override getBaselineExpectedGCDs(buffWindow: BuffWindowState): number {
		if (this.buffTargetDied(buffWindow) === SHORT_WINDOW_FAULT.PARTNER) {
			// you get what you get and that's ok in this case
			return buffWindow.gcds
		}

		// as parent
		// note that if the drg died we don't reduce gcds because that's something you personally can fix
		if (this.expectedGCDs) {
			return this.expectedGCDs.expectedPerWindow
		}

		return 0
	}

	// adjust expected tracked gcds for partner dying
	protected override changeExpectedTrackedActionClassLogic(buffWindow: BuffWindowState): number {
		if (this.buffTargetDied(buffWindow) === SHORT_WINDOW_FAULT.PARTNER) {
			return -1
		}

		return 0
	}

	// adjust highlighting for partner dying
	// if partner dies, we reduce expected to 0 but still highlight a 0 in the table
	protected override changeComparisonClassLogic(buffWindow: BuffWindowState) {
		if (this.buffTargetDied(buffWindow) === SHORT_WINDOW_FAULT.PARTNER) {
			return (actual: number, expected?: number) => {
				if (!isDefined(expected) || actual <= expected) {
					return RotationTargetOutcome.NEGATIVE
				}
				return RotationTargetOutcome.POSITIVE
			}
		}
	}

	// check for a truncated window if not rushing, which would indicate that the tether partner (or the DRG) died
	protected override getBuffWindowNotes(buffWindow: BuffWindowState): JSX.Element | undefined {
		const fault = this.buffTargetDied(buffWindow)
		if (fault === SHORT_WINDOW_FAULT.PARTNER) {
			return <Trans id="drg.ds.notes.partnerdied">Partner Died</Trans>
		}

		if (fault === SHORT_WINDOW_FAULT.DRG) {
			return <Trans id="drg.ds.notes.drgdied">You Died</Trans>
		}

		return undefined
	}

	// pulled into a helper due to use in multiple spots
	// returns true if:
	// - the buff ended early during the fight
	private buffTargetDied(buffWindow: BuffWindowState): number {
		const windowDurationMillis = this.buffStatus.duration
		const fightTimeRemaining = this.parser.pull.duration - (buffWindow.start - this.parser.eventTimeOffset)
		const actualWindowDuration = (buffWindow?.end ?? buffWindow.start) - buffWindow.start

		// first check if the window would go past the end, and then check if the actual buff duration was
		// shorter than expected
		if (windowDurationMillis >= fightTimeRemaining && actualWindowDuration < fightTimeRemaining) {
			return SHORT_WINDOW_FAULT.NONE
		}

		// if the window duration does not match the actual time (within a reasonable threshold)
		// mark it
		if (actualWindowDuration < (windowDurationMillis - SHORT_WINDOW_BUFFER)) {
			// activate the header because something's up
			this.rotationTableNotesColumnHeader = <Trans id="drg.ds.notes.header">Short Window Cause</Trans>

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
