import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {RotationEvent} from 'components/ui/Rotation'
import {RotationTargetOutcome} from 'components/ui/RotationTable'
import {ActionKey} from 'data/ACTIONS'
import {Events} from 'event'
import {dependency} from 'parser/core/Injectable'
import {EvaluatedAction, RestartWindow, TrackedAction} from 'parser/core/modules/ActionWindow'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {HistoryEntryPredicate} from 'parser/core/modules/ActionWindow/windows/ActionWindow'
import {Actors} from 'parser/core/modules/Actors'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {UnableToAct} from 'parser/core/modules/UnableToAct'
import React, {Fragment} from 'react'
import {Message} from 'semantic-ui-react'
import DISPLAY_ORDER from './DISPLAY_ORDER'
import {FIRE_SPELLS, ICE_SPELLS} from './Elements'
import {ASTRAL_UMBRAL_DURATION, ASTRAL_UMBRAL_MAX_STACKS, BLMGaugeState, UMBRAL_HEARTS_MAX_STACKS} from './Gauge'
import Leylines from './Leylines'
import Procs from './Procs'
import {assignErrorCode, getMetadataForWindow} from './RotationWatchdog/EvaluatorUtilities'
import {ExpectedFireSpellsEvaluator} from './RotationWatchdog/ExpectedFireSpellsEvaluator'
import {ExtraF1Evaluator} from './RotationWatchdog/ExtraF1Evaluator'
import {IceMageEvaluator} from './RotationWatchdog/IceMageEvaluator'
import {ManafontTimingEvaluator} from './RotationWatchdog/ManafontTimingEvaluator'
import {MissedIceParadoxEvaluator} from './RotationWatchdog/MissedIceParadoxEvaluator'
import {RotationErrorNotesEvaluator} from './RotationWatchdog/RotationErrorNotesEvaluator'
import {SkipB4Evaluator} from './RotationWatchdog/SkipB4Evaluator'
import {SkipT3Evaluator} from './RotationWatchdog/SkipT3Evaluator'
import {UptimeSoulsEvaluator} from './RotationWatchdog/UptimeSoulsEvaluator'
import {CycleMetadata, ROTATION_ERRORS, HIDDEN_PRIORITY_THRESHOLD} from './RotationWatchdog/WatchdogConstants'

const DEBUG_SHOW_ALL = false && process.env.NODE_ENV !== 'production'

const MAX_POSSIBLE_FIRE4 = 6
const NO_UH_EXPECTED_FIRE4 = 4
const MAX_MP = 10000
const EXTRA_CASTS_FROM_MANAFONT = 1

const EXTRA_F4_COP_THRESHOLD = 0.5 // Feelycraft

const ROTATION_ENDPOINTS: ActionKey[] = [
	'BLIZZARD_III',
	'TRANSPOSE',
	'BLIZZARD_II',
	'HIGH_BLIZZARD_II',
]

// This is feelycraft at the moment. Rotations shorter than this won't be processed for errors.
const MIN_ROTATION_LENGTH = 3

const EMPTY_GAUGE_STATE: BLMGaugeState = {
	astralFire: 0,
	umbralIce: 0,
	umbralHearts: 0,
	polyglot: 0,
	enochian: false,
	paradox: 0,
	astralSoul: 0,
}

export class RotationWatchdog extends RestartWindow {
	static override handle = 'RotationWatchdog'
	static override title = t('blm.rotation-watchdog.title')`Rotation Outliers`
	static override displayOrder = DISPLAY_ORDER.ROTATION

	@dependency private actors!: Actors
	@dependency private invulnerability!: Invulnerability
	@dependency private leylines!: Leylines
	@dependency private procs!: Procs
	@dependency private unableToAct!: UnableToAct

	override startAction = ROTATION_ENDPOINTS
	override prependMessages = <Fragment>
		<Message>
			<Trans id="blm.rotation-watchdog.rotation-table.message">
				The core of BLM consists of six casts of <DataLink action="FIRE_IV"/>, and one cast each of <DataLink action="PARADOX"/>, <DataLink action="DESPAIR"/>, and <DataLink action="FLARE_STAR" /> per rotation.<br/>
				Avoid missing <DataLink action="FIRE_IV" showIcon={false} /> casts where possible. since that will prevent you from using <DataLink showIcon={false} action="FLARE_STAR" />.
			</Trans>
		</Message>
	</Fragment>

	private fireSpellIds = FIRE_SPELLS.map(key => this.data.actions[key].id)
	private iceSpellIds = ICE_SPELLS.map(key => this.data.actions[key].id)

	private currentGaugeState = {...EMPTY_GAUGE_STATE}

	private metadataHistory = new History<CycleMetadata>(() => ({
		errorCode: ROTATION_ERRORS.NO_ERROR,
		finalOrDowntime: false,
		missingDespairs: false,
		missingFire4s: false,
		wasTPF1: false,
		expectedFire4sBeforeDespair: 0,
		expectedFire4s: -1,
		expectedDespairs: -1,
		hardT3sInFireCount: 0,
		firePhaseMetadata: {
			startTime: 0,
			initialMP: 0,
			initialGaugeState: {...EMPTY_GAUGE_STATE},
			fullElementTime: 0,
			fullElementMP: 0,
			fullElementGaugeState: {...EMPTY_GAUGE_STATE},
			circleOfPowerPct: 0,
		}}
	))

	override initialise() {
		super.initialise()

		this.setHistorySuggestionFilter(this.filterForSuggestions)
		this.setHistoryOutputFilter(this.filterForOutput)

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
			pullEnd: this.parser.pull.timestamp + this.parser.pull.duration,
			despairAction: this.data.actions.DESPAIR,
			fire4Action: this.data.actions.FIRE_IV,
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
			adjustCount: this.adjustExpectedActionsCount.bind(this),
			adjustOutcome: this.adjustExpectedActionsOutcome.bind(this),
		}))

		this.addEvaluator(new MissedIceParadoxEvaluator(this.metadataHistory))

		this.addEvaluator(new ManafontTimingEvaluator({
			manafontAction: this.data.actions.MANAFONT,
			despairId: this.data.actions.DESPAIR.id,
			metadataHistory: this.metadataHistory,
		}))

		this.addEvaluator(new ExtraF1Evaluator({
			suggestionIcon: this.data.actions.FIRE_I.icon,
			metadataHistory: this.metadataHistory,
			limitedFireSpellIds: [this.data.actions.FIRE_I.id, this.data.actions.PARADOX.id],
		}))

		this.addEvaluator(new UptimeSoulsEvaluator({
			umbralSoulAction: this.data.actions.UMBRAL_SOUL,
			invulnerability: this.invulnerability,
		}))
		//#endregion

		//#region Evaluators that only apply to normal mid-fight windows

		this.addEvaluator(new IceMageEvaluator({
			suggestionIcon: this.data.actions.HIGH_BLIZZARD_II.icon,
			metadataHistory: this.metadataHistory,
			fireSpellIds: this.fireSpellIds,
		}))
		//#endregion

		//#region Evaluators that only apply to windows that ended in downtime

		this.addEvaluator(new SkipT3Evaluator({
			suggestionIcon: this.data.actions.FIRE_IV.icon,
			metadataHistory: this.metadataHistory,
		}))

		this.addEvaluator(new SkipB4Evaluator({
			blizzard4Id: this.data.actions.BLIZZARD_IV.id,
			fire4action: this.data.actions.FIRE_IV,
			minExpectedF4s: NO_UH_EXPECTED_FIRE4,
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
		const metadata = this.metadataHistory.getCurrent()?.data
		const window = this.history.getCurrent()?.data
		if (!(metadata == null || window == null)) {
			// If we're entering the fire phase of this rotation, note it and save some data
			if (this.currentGaugeState.astralFire === 0 && event.gaugeState.astralFire > 0) {
				metadata.firePhaseMetadata.startTime = event.timestamp

				// Spread the current gauge state into the phase metadata for future reference (technically the final state of the gauge before it changes to Fire)
				metadata.firePhaseMetadata.initialGaugeState = {...this.currentGaugeState}
			}

			// Tranpose -> Paradox -> F1 is a thing in non-standard scenarios, so only store the initial MP once we actually reach full AF
			if (this.currentGaugeState.astralFire < ASTRAL_UMBRAL_MAX_STACKS && event.gaugeState.astralFire === ASTRAL_UMBRAL_MAX_STACKS) {
				metadata.firePhaseMetadata.fullElementTime = event.timestamp
				metadata.firePhaseMetadata.fullElementGaugeState = {...event.gaugeState}
				metadata.firePhaseMetadata.fullElementMP = this.actors.current.mp.current
			}

			// If we no longer have enochian, flag it for display
			if (this.currentGaugeState.enochian && !event.gaugeState.enochian) {
				assignErrorCode(metadata, ROTATION_ERRORS.DROPPED_AF_UI)
			}
		}

		// Retrieve the GaugeState from the event
		this.currentGaugeState = {...event.gaugeState}
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
		const windowMetadata = getMetadataForWindow(window, this.metadataHistory)

		const windowEnd = window.end ?? (this.parser.pull.timestamp + this.parser.pull.duration)
		const firePhaseDuration = windowEnd - windowMetadata.firePhaseMetadata.startTime
		const fireInvulnDuration = this.invulnerability.getDuration({
			start: windowMetadata.firePhaseMetadata.startTime,
			end: windowEnd,
		})

		// If the whole fire phase happened during downtime (ie. Transpose spamming to get a paradox marker), don't expect fire spells
		if (fireInvulnDuration === firePhaseDuration) { return 0 }

		let adjustment = 0
		if (action.action.id === this.data.actions.FIRE_IV.id) {
			// Let the player rush the Despair if they need to before a downtime/end of fight
			if (windowMetadata.finalOrDowntime) { return window.data.filter(event => event.action.id === this.data.actions.FIRE_IV.id).length }

			// Start off with the baseline assumption they've reached full MP in Umbral Ice, since MP events from the log source aren't reliably timed
			adjustment = NO_UH_EXPECTED_FIRE4

			// Rotations with at least one heart get an extra F4 (5x F4 + F1 with 1 heart is the same MP cost as the standard 6F4 + F1 with 3)
			// Note that two hearts does not give any extra F4s, though it'll hardly ever come up in practice
			if (windowMetadata.firePhaseMetadata.fullElementGaugeState.umbralHearts > 0) {
				adjustment++
			}

			// Rotations with full hearts get two extra F4s
			if (windowMetadata.firePhaseMetadata.fullElementGaugeState.umbralHearts === UMBRAL_HEARTS_MAX_STACKS) {
				adjustment++
			}

			const buildAstralFireEvents = window.data.filter(event => event.timestamp >= windowMetadata.firePhaseMetadata.startTime && event.timestamp <= windowMetadata.firePhaseMetadata.fullElementTime)
			// Transpose -> Paradox -> F1 to build Astral Fire costs enough MP to remove the use of F4 they would have gained from 2 umbral hearts
			const transposeParaF1 = [this.data.actions.TRANSPOSE.id, this.data.actions.PARADOX.id, this.data.actions.FIRE_I.id]
			const filteredBuildEvents = buildAstralFireEvents.filter(event => transposeParaF1.includes(event.action.id)).map(event => event.action.id)
			if (filteredBuildEvents.length === transposeParaF1.length && filteredBuildEvents.every((actionId, index) => actionId === transposeParaF1[index])) {
				adjustment--
				windowMetadata.wasTPF1 = true
			}

			// No Umbral hearts -> Tranpose -> Raw F3 loses an F4 due to MP, or F3P due to time (unless very speedy, in which case you're probably not going non-standard...)
			if (windowMetadata.firePhaseMetadata.initialGaugeState.umbralHearts === 0 && (buildAstralFireEvents.length >= 1 && buildAstralFireEvents[0].action.id === this.data.actions.TRANSPOSE.id &&
					buildAstralFireEvents[buildAstralFireEvents.length - 1].action.id === this.data.actions.FIRE_III.id)) {
				adjustment--
			}

			/**
			 * IF this rotation's Astral Fire phase began with no Umbral Hearts (either no-B4-opener, or a midfight alternate playstyle rotation),
			 * AND it begins with a cost-less Fire 3 (ie, the rotation includes an ice phase and they didn't Transpose -> hardcast F3)
			 * AND we have leylines for long enough to squeeze in an extra F4
			 * AND we actually have enough MP for it
			 * THEN we increase the expected count by one
			 */
			if (
				windowMetadata.firePhaseMetadata.initialGaugeState.umbralHearts === 0 &&
				window.data.some(event => this.iceSpellIds.includes(event.action.id)) &&
				(buildAstralFireEvents.length === 1 || // Did the window either start via UI F3 or a Transpose F3P?
					(buildAstralFireEvents.length > 1 && buildAstralFireEvents[0].action.id === this.data.actions.TRANSPOSE.id && buildAstralFireEvents[buildAstralFireEvents.length - 1].action.id === this.data.actions.FIRE_III.id &&
						this.procs.checkActionWasProc(this.data.actions.FIRE_III.id, buildAstralFireEvents[buildAstralFireEvents.length - 1].timestamp))) &&
				windowMetadata.firePhaseMetadata.circleOfPowerPct >= EXTRA_F4_COP_THRESHOLD &&
				((adjustment + 1) * 2 + 1) * this.data.actions.FIRE_IV.mpCost < MAX_MP
			) {
				adjustment++
			}

			// Make sure we don't go wild and return a larger expected count than is actually possible, in case the above logic misbehaves...
			adjustment = Math.min(adjustment, MAX_POSSIBLE_FIRE4)
			const despairTime = window.data.find(event => event.action.id === this.data.actions.DESPAIR.id)?.timestamp

			// Give them credit if we were overly pessimistic
			adjustment = Math.max(adjustment, window.data.filter(event => event.action.id === action.action.id && (!despairTime || event.timestamp < despairTime)).length)
			windowMetadata.expectedFire4sBeforeDespair = adjustment
		}

		if (action.action.id === this.data.actions.DESPAIR.id) {
			adjustment++
		}

		if (window.data.find(event => event.action.id === this.data.actions.MANAFONT.id) != null) {
			adjustment += EXTRA_CASTS_FROM_MANAFONT
		}

		switch (action.action.id) {
		case this.data.actions.FIRE_IV.id:
			windowMetadata.expectedFire4s = adjustment
			break
		case this.data.actions.DESPAIR.id:
			windowMetadata.expectedDespairs = adjustment
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
	private filterForSuggestions: HistoryEntryPredicate = (window: HistoryEntry<EvaluatedAction[]>) => {
		const windowMetadata = getMetadataForWindow(window, this.metadataHistory)

		return windowMetadata.errorCode.priority !== ROTATION_ERRORS.SHORT.priority
	}

	// Filter out the windows we don't want to show in the output, unless we're showing everything
	private filterForOutput: HistoryEntryPredicate = (window: HistoryEntry<EvaluatedAction[]>) => {
		const windowMetadata = getMetadataForWindow(window, this.metadataHistory)

		return windowMetadata.errorCode.priority > HIDDEN_PRIORITY_THRESHOLD || DEBUG_SHOW_ALL
	}

	// Include whether the event was a proc so we get the proc outline in the output Rotation column
	override getRotationOutputForAction(action: EvaluatedAction): RotationEvent {
		return {action: action.action.id, isProc: this.procs.checkActionWasProc(action.action.id, action.timestamp)}
	}
}
