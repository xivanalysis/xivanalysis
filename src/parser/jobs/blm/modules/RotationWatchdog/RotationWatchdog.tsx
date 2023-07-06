import {t, Trans} from '@lingui/macro'
import {DataLink} from 'components/ui/DbLink'
import {RotationTargetOutcome} from 'components/ui/RotationTable'
import {ActionKey} from 'data/ACTIONS'
import {Events} from 'event'
import {dependency} from 'parser/core/Injectable'
import {EvaluatedAction, RestartWindow, TrackedAction} from 'parser/core/modules/ActionWindow'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Actors} from 'parser/core/modules/Actors'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import {UnableToAct} from 'parser/core/modules/UnableToAct'
import React, {Fragment, ReactNode} from 'react'
import {Icon, Message} from 'semantic-ui-react'
import {ensureRecord} from 'utilities'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
import {FIRE_SPELLS} from '../Elements'
import {ASTRAL_UMBRAL_DURATION, BLMGaugeState, Gauge, UMBRAL_HEARTS_MAX_STACKS} from '../Gauge'
import Leylines from '../Leylines'
import Procs from '../Procs'
import {assignErrorCode, getMetadataForWindow} from './EvaluatorUtilities'
import {ExpectedFireSpellsEvaluator} from './ExpectedFireSpellsEvaluator'
import {ExtraF1Evaluator} from './ExtraF1Evaluator'
import {ExtraHardT3Evaluator} from './ExtraHardT3Evaluator'
import {IceMageEvaluator} from './IceMageEvaluator'
import {ManafontTimingEvaluator} from './ManafontTimingEvaluator'
import {MissedIceParadoxEvaluator} from './MissedIceParadoxEvaluator'
import {RotationErrorNotesEvaluator} from './RotationErrorNotesEvaluator'
import {SkipB4Evaluator} from './SkipB4Evaluator'
import {SkipT3Evaluator} from './SkipT3Evaluator'
import {UptimeSoulsEvaluator} from './UptimeSoulsEvaluator'

const DEBUG_SHOW_ALL = false && process.env.NODE_ENV !== 'production'

const MAX_POSSIBLE_FIRE4 = 6
export const NO_UH_EXPECTED_FIRE4 = 4
const FIRE4_FROM_MANAFONT = 1

const EXTRA_F4_COP_THRESHOLD = 0.5 // Feelycraft

export const DEFAULT_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	3: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}

export const ENHANCED_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}

const ROTATION_ENDPOINTS: ActionKey[] = [
	'BLIZZARD_III',
	'TRANSPOSE',
	'BLIZZARD_II',
	'HIGH_BLIZZARD_II',
]

// This is feelycraft at the moment. Rotations shorter than this won't be processed for errors.
export const MIN_ROTATION_LENGTH = 3

export interface RotationErrorCode {priority: number, message: ReactNode}
export const DEATH_PRIORITY = 101 // Define this const here so we can reference it in both classes
export const HIDDEN_PRIORITY_THRESHOLD = 2 // Same as ^
/**
 * Error type codes, higher values indicate higher priority errors. If you add more, adjust the IDs to ensure correct priorities.
 * Only the highest priority error will be displayed in the 'Reason' column.
 * NOTE: Rotations with values at or below HIDDEN_PRIORITY_THRESHOLD will be filtered out of the RotationTable display
 * unless the DEBUG_SHOW_ALL_ROTATIONS variable is set to true
 */
export const ROTATION_ERRORS = ensureRecord<RotationErrorCode>()({
	NO_ERROR: {priority: 0, message: 'No errors'},
	FINAL_OR_DOWNTIME: {priority: 1, message: 'Ended with downtime, or last rotation'},
	SHORT: {priority: HIDDEN_PRIORITY_THRESHOLD, message: 'Too short, won\'t process'},
	// Messages below should be Trans objects since they'll be displayed to end users
	SHOULD_SKIP_T3: {priority: 8, message: <Trans id="blm.rotation-watchdog.error-messages.should-skip-t3">Should skip hardcast <DataLink action="THUNDER_III"/></Trans>},
	SHOULD_SKIP_B4: {priority: 9, message: <Trans id="blm.rotation-watchdog.error-messages.should-skip-b4">Should skip <DataLink action="BLIZZARD_IV"/></Trans>},
	MISSING_FIRE4S: {priority: 10, message: <Trans id="blm.rotation-watchdog.error-messages.missing-fire4s">Missing one or more <DataLink action="FIRE_IV"/>s</Trans>}, // These two errors are lower priority since they can be determined by looking at the
	MISSED_ICE_PARADOX: {priority: 15, message: <Trans id="blm.rotation-watchdog.error-messages.missed-ice-paradox">Missed <DataLink action="PARADOX"/> in Umbral Ice</Trans>},
	MISSING_DESPAIRS: {priority: 20, message: <Trans id="blm.rotation-watchdog.error-messages.missing-despair">Missing one or more <DataLink action="DESPAIR"/>s</Trans>}, // target columns in the table, so we want to tell players about other errors first
	MANAFONT_BEFORE_DESPAIR: {priority: 40, message: <Trans id="blm.rotation-watchdog.error-messages.manafont-before-despair"><DataLink action="MANAFONT"/> used before <DataLink action="DESPAIR"/></Trans>},
	EXTRA_T3: {priority: 59, message: <Trans id="blm.rotation-watchdog.error-messages.extra-t3">Extra <DataLink action="THUNDER_III"/>s</Trans>}, // Extra T3 and Extra F1 are *very* similar in terms of per-GCD potency loss
	EXTRA_F1: {priority: 60, message: <Trans id="blm.rotation-watchdog.error-messages.extra-f1">Extra <DataLink action="FIRE_I"/></Trans>}, // These two codes should stay close to each other
	NO_FIRE_SPELLS: {priority: 80, message: <Trans id="blm.rotation-watchdog.error-messages.no-fire-spells">Rotation included no Fire spells</Trans>},
	DROPPED_AF_UI: {priority: 100, message: <Trans id="blm.rotation-watchdog.error-messages.dropped-astral-umbral">Dropped Astral Fire or Umbral Ice</Trans>},
	DIED: {priority: DEATH_PRIORITY, message: <Trans id="blm.rotation-watchdog.error-messages.died"><DataLink showName={false} action="RAISE"/> Died</Trans>},
})

export interface RotationMetadata {
	errorCode: RotationErrorCode
	finalOrDowntime: boolean
	missingDespairs: boolean
	missingFire4s: boolean
	expectedFire4sBeforeDespair: number
	hardT3sInFireCount: number
	icePhaseMetadata: PhaseMetadata
	firePhaseMetadata: PhaseMetadata
}

export interface PhaseMetadata {
	startIndex: number
	startTime: number
	initialMP: number
	circleOfPowerPct: number
	initialGaugeState: BLMGaugeState
}

export class RotationWatchdog extends RestartWindow {
	static override handle = 'RotationWatchdog'
	static override title = t('blm.rotation-watchdog.title')`Rotation Outliers`
	static override displayOrder = DISPLAY_ORDER.ROTATION

	@dependency private actors!: Actors
	@dependency private gauge!: Gauge
	@dependency private invulnerability!: Invulnerability
	@dependency private leylines!: Leylines
	@dependency private procs!: Procs
	@dependency private unableToAct!: UnableToAct

	override startAction = ROTATION_ENDPOINTS
	override prependMessages = <Fragment>
		<Message>
			<Trans id="blm.rotation-watchdog.rotation-table.message">
				The core of BLM consists of six casts of <DataLink action="FIRE_IV"/>, two casts of <DataLink action="PARADOX"/> and one cast <DataLink action="DESPAIR"/> per rotation.<br/>
				With <DataLink action="MANAFONT"/>, an extra cast each of <DataLink action="FIRE_IV"/> and <DataLink action="DESPAIR"/> are expected.<br/>
				Avoid missing <DataLink action="FIRE_IV" showIcon={false} /> casts where possible.
			</Trans>
		</Message>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<Trans id="blm.rotation-watchdog.rotation-table.disclaimer">This module assumes you are following the standard BLM playstyle.<br/>
					If you are following a non-standard playstyle, this report and many of the suggestions may not be applicable.
				</Trans>
			</Message.Content>
		</Message>
	</Fragment>

	private fireSpellIds = FIRE_SPELLS.map(key => this.data.actions[key].id)

	private currentGaugeState: BLMGaugeState = {
		astralFire: 0,
		umbralIce: 0,
		umbralHearts: 0,
		polyglot: 0,
		enochian: false,
		paradox: 0,
	}

	private metadataHistory = new History<RotationMetadata>(() => ({
		errorCode: ROTATION_ERRORS.NO_ERROR,
		finalOrDowntime: false,
		missingDespairs: false,
		missingFire4s: false,
		expectedFire4sBeforeDespair: 0,
		hardT3sInFireCount: 0,
		icePhaseMetadata: {
			startIndex: -1,
			startTime: 0,
			initialMP: 0,
			circleOfPowerPct: 0,
			initialGaugeState: this.currentGaugeState,
		},
		firePhaseMetadata: {
			startIndex: -1,
			startTime: 0,
			initialMP: 0,
			circleOfPowerPct: 0,
			initialGaugeState: this.currentGaugeState,
		}}))

	override initialise() {
		super.initialise()

		this.ignoreActions([this.data.actions.ATTACK.id])

		this.addEventHook('blmgauge', this.onGaugeEvent)
		this.addEventHook({
			type: 'death',
			actor: this.parser.actor.id,
		}, this.onDeath)

		//#region Evaluators that apply to all windows

		// The ExpectedFireSpellsEvaluator must go before any others, since it will assign metadata about the
		// expected fire spell counts that other evaluators may depend on
		this.addEvaluator(new ExpectedFireSpellsEvaluator({
			parser: this.parser,
			data: this.data,
			invulnerability: this.invulnerability,
			metadataHistory: this.metadataHistory,
			// Expected counts per window will be calculated in the adjustExpectedActionsCount function
			expectedActions: [
				{
					action: this.data.actions.FIRE_IV,
					expectedPerWindow: 0,
				},
				{
					action: this.data.actions.DESPAIR,
					expectedPerWindow: 0,
				},
			],
			suggestionIcon: '', // This evaluator skips the normal ExpectedActionsEvaluator suggestion, so just pass empty stuff here...
			suggestionContent: <></>,
			suggestionWindowName: <></>,
			severityTiers: {},
			adjustCount: this.adjustExpectedActionsCount.bind(this),
			adjustOutcome: this.adjustExpectedActionsOutcome.bind(this),
		}))

		this.addEvaluator(new MissedIceParadoxEvaluator(this.metadataHistory))

		this.addEvaluator(new ManafontTimingEvaluator({
			data: this.data,
			metadataHistory: this.metadataHistory,
		}))

		this.addEvaluator(new ExtraF1Evaluator({
			data: this.data,
			metadataHistory: this.metadataHistory,
			fireSpellIds: this.fireSpellIds,
		}))

		// This was previously only for normal mid-fight windows but it probably should've been for everything...
		// Also needs to be sequenced before the SkipT3Evaluator
		this.addEvaluator(new ExtraHardT3Evaluator({
			data: this.data,
			metadataHistory: this.metadataHistory,
			procs: this.procs,
			fireSpellIds: this.fireSpellIds,
		}))

		this.addEvaluator(new UptimeSoulsEvaluator({
			data: this.data,
			invulnerability: this.invulnerability,
		}))
		//#endregion

		//#region Evaluators that only apply to normal mid-fight windows

		this.addEvaluator(new IceMageEvaluator({
			data: this.data,
			metadataHistory: this.metadataHistory,
			fireSpellIds: this.fireSpellIds,
		}))
		//#endregion

		//#region Evaluators that only apply to windows that ended in downtime

		this.addEvaluator(new SkipT3Evaluator({
			data: this.data,
			metadataHistory: this.metadataHistory,
		}))

		this.addEvaluator(new SkipB4Evaluator({
			data: this.data,
			metadataHistory: this.metadataHistory,
		}))
		//#endregion

		// This should be the last evaluator added, since it is the one that will actually output the contents of the "Why Outlier" column
		this.addEvaluator(new RotationErrorNotesEvaluator(this.metadataHistory))

		this.onWindowStart(this.parser.pull.timestamp)
	}

	private onDeath() {
		const metadata = this.metadataHistory.getCurrent()?.data
		if (metadata != null) {
			metadata.errorCode = ROTATION_ERRORS.DIED
		}
	}

	// Handle events coming from BLM's Gauge module
	private onGaugeEvent(event: Events['blmgauge']) {
		const nextGaugeState = this.gauge.getGaugeState(event.timestamp)

		const metadata = this.metadataHistory.getCurrent()?.data
		const window = this.history.getCurrent()?.data
		if (!(metadata == null || window == null)) {
			// If we're entering the ice or fire phase of this rotation, note it and save some data
			let phaseMetadata = null
			if (this.currentGaugeState.astralFire === 0 && nextGaugeState.astralFire > 0) {
				phaseMetadata = metadata.firePhaseMetadata
			} else if (this.currentGaugeState.umbralIce === 0 && nextGaugeState.umbralIce > 0) {
				phaseMetadata = metadata.icePhaseMetadata
			}
			if (phaseMetadata != null) {
				phaseMetadata.startIndex = window.length -1
				phaseMetadata.startTime = event.timestamp
				phaseMetadata.initialMP = this.actors.current.mp.current

				// Spread the current gauge state into the phase metadata for future reference
				phaseMetadata.initialGaugeState = {...this.currentGaugeState}
			}

			// If we no longer have enochian, flag it for display
			if (this.currentGaugeState.enochian && !nextGaugeState.enochian) {
				assignErrorCode(metadata, ROTATION_ERRORS.DROPPED_AF_UI)
			}
		}

		// Retrieve the GaugeState from the event
		this.currentGaugeState = {...nextGaugeState}
	}

	override onWindowStart(timestamp: number) {
		super.onWindowStart(timestamp)
		this.metadataHistory.getCurrentOrOpenNew(timestamp)
	}

	override onWindowEnd(timestamp: number) {
		const metadata = this.metadataHistory.getCurrent()
		if (metadata != null) {
			metadata.data.firePhaseMetadata.circleOfPowerPct =
				this.leylines.getStatusDurationInRange(this.data.statuses.CIRCLE_OF_POWER.id, metadata.data.firePhaseMetadata.startTime, timestamp) /
				(timestamp - metadata.data.firePhaseMetadata.startTime)

			// If the window ended while the boss was untargetable, mark it as a downtime window
			if (this.invulnerability.isActive({
				timestamp: timestamp,
				types: ['untargetable'],
			})) {
				metadata.data.finalOrDowntime = true
				assignErrorCode(metadata.data, ROTATION_ERRORS.FINAL_OR_DOWNTIME)
			}

			// If the rotation was shorter than we'll bother processing, mark it as such
			if ((this.history.getCurrent()?.data.length ?? 0) <= MIN_ROTATION_LENGTH) {
				assignErrorCode(metadata.data, ROTATION_ERRORS.SHORT)
			}
		}

		// Close the windows
		super.onWindowEnd(timestamp)
		this.metadataHistory.closeCurrent(timestamp)
	}

	override onWindowRestart(event: Events['action']) {
		// Do not start a new window if transposing from Ice to Fire
		if (event.action === this.data.actions.TRANSPOSE.id && this.currentGaugeState.umbralIce > 0) {
			return
		}
		super.onWindowRestart(event)
	}

	override onComplete() {
		const currentMetadata = this.metadataHistory.getCurrent()
		if (currentMetadata != null) {
			currentMetadata.data.finalOrDowntime = true
		}

		// Override the error code for rotations that dropped enochian, when the rotation contained an unabletoact time long enough to kill it.
		// Couldn't do this at the time of DROPPED_AF_UI code assignment, since the downtime data wasn't fully available yet
		this.mapHistoryActions().forEach(window => {
			const windowMetadata = getMetadataForWindow(window, this.metadataHistory)
			if (windowMetadata == null) { return }
			if (windowMetadata.errorCode !== ROTATION_ERRORS.DROPPED_AF_UI) { return }

			const utaWindows = this.unableToAct
				.getWindows({
					start: window.start,
					end: window.end ?? (this.parser.pull.timestamp + this.parser.pull.duration),
				})
				.filter(utaWindow => Math.max(0, utaWindow.end - utaWindow.start) >= ASTRAL_UMBRAL_DURATION)

			if (utaWindows.length > 0) {
				windowMetadata.errorCode = ROTATION_ERRORS.FINAL_OR_DOWNTIME
			}
		})

		super.onComplete()
	}

	private adjustExpectedActionsCount(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction): number {
		let adjustment = 0
		const windowMetadata = getMetadataForWindow(window, this.metadataHistory)
		if (windowMetadata == null) { return 0 }
		const windowEnd = window.end ?? this.parser.pull.timestamp + this.parser.pull.duration
		const firePhaseDuration = windowEnd - windowMetadata.firePhaseMetadata.startTime
		const fireInvulnDuration = this.invulnerability.getDuration({
			start: windowMetadata.firePhaseMetadata.startTime,
			end: windowEnd,
		})

		// If the whole fire phase happened during downtime (ie. Transpose spamming to get a paradox marker), don't expect fire spells
		if (fireInvulnDuration === firePhaseDuration) { return 0 }

		if (action.action.id === this.data.actions.FIRE_IV.id) {
			if (windowMetadata.finalOrDowntime) { return window.data.filter(event => event.action.id === this.data.actions.FIRE_IV.id).length }

			adjustment = NO_UH_EXPECTED_FIRE4

			// Rotations with at least one heart get an extra F4 (5x F4 + F1 with 1 heart is the same MP cost as the standard 6F4 + F1 with 3)
			// Note that two hearts does not give any extra F4s, though it'll hardly ever come up in practice
			if (windowMetadata.firePhaseMetadata.initialGaugeState.umbralHearts > 0) {
				adjustment++
			}

			// Rotations with full hearts get two extra F4s
			if (windowMetadata.firePhaseMetadata.initialGaugeState.umbralHearts === UMBRAL_HEARTS_MAX_STACKS) {
				adjustment++
			}

			/**
			 * IF this rotation's Astral Fire phase began with no Umbral Hearts (either no-B4-opener, or a midfight alternate playstyle rotation),
			 * AND it is not an opener that begins with Fire 3 (ie, the rotation includes an ice phase)
			 * AND we have leylines for long enough to squeeze in an extra F4
			 * THEN we increase the expected count by one
			 */
			if (
				adjustment === NO_UH_EXPECTED_FIRE4 &&
				windowMetadata.icePhaseMetadata.startIndex > -1 &&
				windowMetadata.firePhaseMetadata.circleOfPowerPct >= EXTRA_F4_COP_THRESHOLD
			) {
				adjustment++
			}

			// Make sure we don't go wild and return a larger expected count than is actually possible, in case the above logic misbehaves...
			adjustment = Math.min(adjustment, MAX_POSSIBLE_FIRE4)
			windowMetadata.expectedFire4sBeforeDespair = adjustment
		}

		if (action.action.id === this.data.actions.DESPAIR.id) {
			adjustment++
		}

		if (window.data.find(event => event.action.id === this.data.actions.MANAFONT.id) != null) {
			adjustment += FIRE4_FROM_MANAFONT
		}

		return adjustment
	}

	private adjustExpectedActionsOutcome(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) {
		const windowMetadata = this.metadataHistory.entries.find(entry => entry.start === window.start)
		if (action.action.id === this.data.actions.FIRE_IV.id && (windowMetadata?.data.finalOrDowntime || false)) {
			return (_actual: number, _expected?: number) => {
				return RotationTargetOutcome.NEUTRAL
			}
		}
	}

	// Filter out the too-short windows from inclusion in suggestions
	override filterForSuggestions(window: HistoryEntry<EvaluatedAction[]>): boolean {
		const windowMetadata = getMetadataForWindow(window, this.metadataHistory)
		if (windowMetadata == null) { return false }

		return windowMetadata.errorCode.priority !== ROTATION_ERRORS.SHORT.priority
	}

	// Filter out the windows we don't want to show in the output, unless we're showing everything
	override filterForOutput(window: HistoryEntry<EvaluatedAction[]>): boolean {
		const windowMetadata = getMetadataForWindow(window, this.metadataHistory)
		if (windowMetadata == null) { return false }

		return windowMetadata.errorCode.priority > HIDDEN_PRIORITY_THRESHOLD || DEBUG_SHOW_ALL
	}

	// Include whether the event was a proc so we get the proc outline in the output Rotation column
	override getRotationOutputForEvent(event: Events['action']) {
		return {action: event.action, isProc: this.procs.checkEventWasProc(event)}
	}
}
