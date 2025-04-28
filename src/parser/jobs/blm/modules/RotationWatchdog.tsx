import {msg} from '@lingui/core/macro'
import {Trans} from '@lingui/react/macro'
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
import {Fragment} from 'react'
import {Message} from 'semantic-ui-react'
import {fillActionIds} from 'utilities/fillArrays'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'
import {FIRE_SPELLS, ICE_SPELLS, THUNDER_SPELLS} from './Elements'
import {ASTRAL_SOUL_MAX_STACKS, ASTRAL_UMBRAL_DURATION, ASTRAL_UMBRAL_MAX_STACKS, BLMGaugeState, FLARE_SOUL_GENERATION, Gauge, UMBRAL_HEARTS_MAX_STACKS} from './Gauge'
import {Procs} from './Procs'
import {ColdF3Evaluator} from './RotationWatchdog/ColdF3Evaluator'
import {assignErrorCode, getMetadataForWindow} from './RotationWatchdog/EvaluatorUtilities'
import {ExpectedFireSpellsEvaluator} from './RotationWatchdog/ExpectedFireSpellsEvaluator'
import {ExtraF1Evaluator} from './RotationWatchdog/ExtraF1Evaluator'
import {FirestarterUsageEvaluator} from './RotationWatchdog/FirestarterUsageEvaluator'
import {FlareStarUsageEvaluator} from './RotationWatchdog/FlareStarUsageEvaluator'
import {IceMageEvaluator} from './RotationWatchdog/IceMageEvaluator'
import {ManafontTimingEvaluator} from './RotationWatchdog/ManafontTimingEvaluator'
import {MissedIceParadoxEvaluator} from './RotationWatchdog/MissedIceParadoxEvaluator'
import {RotationErrorNotesEvaluator} from './RotationWatchdog/RotationErrorNotesEvaluator'
import {SkipThunderEvaluator} from './RotationWatchdog/SkipThunderEvaluator'
import {UptimeSoulsEvaluator} from './RotationWatchdog/UptimeSoulsEvaluator'
import {CycleMetadata, ROTATION_ERRORS, HIDDEN_PRIORITY_THRESHOLD, NO_DENOMINATOR_CODE} from './RotationWatchdog/WatchdogConstants'

// eslint-disable-next-line no-constant-binary-expression
const DEBUG_SHOW_ALL = false && process.env.NODE_ENV !== 'production'

const NO_UH_EXPECTED_FIRE4 = 4
const MAX_MP = 10000

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
	static override title = msg({id: 'blm.rotation-watchdog.title', message: 'Rotation Outliers'})
	static override displayOrder = DISPLAY_ORDER.ROTATION

	@dependency private actors!: Actors
	@dependency private invulnerability!: Invulnerability
	@dependency private procs!: Procs
	@dependency private unableToAct!: UnableToAct
	@dependency private gauge!: Gauge

	override startAction = ROTATION_ENDPOINTS
	override prependMessages = <Fragment>
		<Message>
			<Trans id="blm.rotation-watchdog.rotation-table.message">
				The core of BLM consists of six casts of <DataLink action="FIRE_IV"/>, two casts of <DataLink action="PARADOX"/>, and one cast each of <DataLink action="DESPAIR"/>, and <DataLink action="FLARE_STAR" /> per rotation.<br/>
				Avoid missing <DataLink action="FIRE_IV" showIcon={false} /> casts where possible, since that will prevent you from using <DataLink showIcon={false} action="FLARE_STAR" />.
			</Trans>
		</Message>
	</Fragment>

	private fireSpellIds = fillActionIds(FIRE_SPELLS, this.data)
	private iceSpellIds = fillActionIds(ICE_SPELLS, this.data)
	private thunderSpellIds = fillActionIds(THUNDER_SPELLS, this.data)

	private currentGaugeState = {...EMPTY_GAUGE_STATE}

	private metadataHistory = new History<CycleMetadata>(() => ({
		errorCode: ROTATION_ERRORS.NO_ERROR,
		finalOrDowntime: false,
		missingDespairs: false,
		missingFire4s: false,
		missingFlareStars: false,
		expectedFire4s: -1,
		expectedDespairs: -1,
		expectedFlareStars: -1,
		firePhaseMetadata: {
			startTime: 0,
			gaugeStateBeforeFire: {...EMPTY_GAUGE_STATE},
			fireEntryGaugeState: {...EMPTY_GAUGE_STATE},
			fullElementTime: 0,
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
			flareStarAction: this.data.actions.FLARE_STAR,
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
				{
					action: this.data.actions.FLARE_STAR,
					expectedPerWindow: 0,
				},
			],
			adjustCount: this.adjustExpectedActionsCount.bind(this),
			adjustOutcome: this.adjustExpectedActionsOutcome.bind(this),
		}))

		// Patch 7.05 re-added Ice Paradox, only load the evaluator when necessary
		if (!this.parser.patch.before('7.05')) {
			this.addEvaluator(new MissedIceParadoxEvaluator(this.metadataHistory))
		}

		this.addEvaluator(new FlareStarUsageEvaluator({
			suggestionIcon: this.data.actions.FLARE_STAR.icon,
			metadataHistory: this.metadataHistory,
		}))

		this.addEvaluator(new ManafontTimingEvaluator({
			manafontAction: this.data.actions.MANAFONT,
			despairId: this.data.actions.DESPAIR.id,
			metadataHistory: this.metadataHistory,
			requiredMP: this.data.actions.FIRE_IV.mpCost,
			flareId: this.data.actions.FLARE.id,
			gauge: this.gauge,
			actors: this.actors,
		}))

		this.addEvaluator(new ExtraF1Evaluator({
			suggestionIcon: this.data.actions.FIRE_I.icon,
			metadataHistory: this.metadataHistory,
			fire1Id: this.data.actions.FIRE_I.id,
		}))

		this.addEvaluator(new UptimeSoulsEvaluator({
			umbralSoulAction: this.data.actions.UMBRAL_SOUL,
			invulnerability: this.invulnerability,
		}))

		// Since timer considerations are no longer relevant for 7.2+, we can swap the minor "you probably should hold Firestarter" suggestion
		// for a more stringent tiered one. Transpose AF1 PD F3P is basically free now, so it should be the default if an F3P is not held over
		// from the previous phase
		if (this.parser.patch.before('7.2')) {
			this.addEvaluator(new FirestarterUsageEvaluator({
				manafontId: this.data.actions.MANAFONT.id,
				paradoxId: this.data.actions.PARADOX.id,
				fire3Id: this.data.actions.FIRE_III.id,
				metadataHistory: this.metadataHistory,
			}))
		} else {
			this.addEvaluator(new ColdF3Evaluator({
				fire3Action: this.data.actions.FIRE_III,
				gauge: this.gauge,
				metadataHistory: this.metadataHistory,
			}))
		}
		//#endregion

		//#region Evaluators that only apply to normal mid-fight windows

		this.addEvaluator(new IceMageEvaluator({
			suggestionIcon: this.data.actions.HIGH_BLIZZARD_II.icon,
			metadataHistory: this.metadataHistory,
			fireSpellIds: this.fireSpellIds,
			icespellIds: this.iceSpellIds,
		}))
		//#endregion

		//#region Evaluators that only apply to windows that ended in downtime

		this.addEvaluator(new SkipThunderEvaluator({
			suggestionIcon: this.data.actions.HIGH_THUNDER.icon,
			thunderSpellIds: this.thunderSpellIds,
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
				metadata.firePhaseMetadata.gaugeStateBeforeFire = {...this.currentGaugeState}

				// Also spread the incoming gauge state
				metadata.firePhaseMetadata.fireEntryGaugeState = {...event.gaugeState}
			}

			// Tranpose -> Paradox -> F1 is a thing in non-standard scenarios, so only store the initial MP once we actually reach full AF
			if (this.currentGaugeState.astralFire < ASTRAL_UMBRAL_MAX_STACKS && event.gaugeState.astralFire === ASTRAL_UMBRAL_MAX_STACKS) {
				metadata.firePhaseMetadata.fullElementTime = event.timestamp
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
		// Don't start a new window if we hadn't actually put any data in the current window yet (ie. opening with raw B3)
		if (this.history.getCurrent()?.data.length === 0) { return }

		// Do not start a new window if transposing from Ice to Fire
		if (event.action === this.data.actions.TRANSPOSE.id && this.currentGaugeState.umbralIce > 0) {
			return
		}

		// Do not start a new window if we're using B3 to go from partial UI to full
		// Tranpose > instant B3 is a minor gain over hardcast hot B3
		if (this.currentGaugeState.umbralIce > 0 && this.currentGaugeState.umbralIce < ASTRAL_UMBRAL_MAX_STACKS) {
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

		// If the whole fire phase happened during downtime (ie. Transpose spamming to get/keep Thunderhead or Paradox), don't expect fire spells
		if (fireInvulnDuration === firePhaseDuration) { return 0 }

		const actualCount = window.data.filter(event => event.action.id === action.action.id).length

		let adjustment = 0
		if (action.action.id === this.data.actions.FIRE_IV.id) {
			// Let the player rush the Despair if they need to before a downtime/end of fight
			if (windowMetadata.finalOrDowntime) { return window.data.filter(event => event.action.id === this.data.actions.FIRE_IV.id).length }

			// We definitely reached full MP if an ice spell was cast while already at UI3, or we Umbral Souled three times
			const definitelyFullMP = window.data.find(event => this.iceSpellIds.includes(event.action.id) &&
					this.gauge.getGaugeState(event.timestamp - 1).umbralIce === ASTRAL_UMBRAL_MAX_STACKS) != null ||
				window.data.filter(event => event.action.id === this.data.actions.UMBRAL_SOUL.id).length === UMBRAL_HEARTS_MAX_STACKS

			let afterUHMP = definitelyFullMP ? MAX_MP : 0

			// If we don't know for sure that the player reached full MP for this window, try to figure out how much MP they had from their resources
			// This is less reliable, since the resource update events don't always come through at the times they should with respect to game behavior
			if (!definitelyFullMP) {
				// If Manafont was used to reach AF3, we shouldn't expect F4s, since you generally don't want to cast Fire spells below AF3
				const beforeFullAFManafontEvent = window.data.some((event) => event.action.id === this.data.actions.MANAFONT.id && event.timestamp <= windowMetadata.firePhaseMetadata.fullElementTime)
				if (!beforeFullAFManafontEvent) {
					// Figure out when the player entered Astral Fire, and reached Astral Fire 3 (these may be different)
					const firstGCDInAFTimestamp = window.data.find((event) => event.timestamp > windowMetadata.firePhaseMetadata.startTime && event.action.onGcd)?.timestamp
					const firstGCDInFullAFTimestamp  = window.data.find((event) => event.timestamp > windowMetadata.firePhaseMetadata.fullElementTime && event.action.onGcd)?.timestamp

					// This shouldn't happen, but to be safe...
					if (firstGCDInAFTimestamp == null || firstGCDInFullAFTimestamp == null) {
						windowMetadata.expectedFire4s = NO_DENOMINATOR_CODE
						return windowMetadata.expectedFire4s
					}

					// Start with the MP we think they had on entering Astral Fire, by looking for the maximum of the MP values before the entry and AF3 reached times
					afterUHMP = Math.max(this.actors.current.at(firstGCDInAFTimestamp - 1).mp.current, this.actors.current.at(firstGCDInFullAFTimestamp - 1).mp.current)
				}
			}

			for (let i = 0; i < windowMetadata.firePhaseMetadata.fireEntryGaugeState.umbralHearts; i++) {
				// If we have enough MP to cast F4 while maintaining a reserve for Despair (which requires at least the base cost of an F4 to use), we should count it
				if (afterUHMP > this.data.actions.FIRE_IV.mpCost * 2) {
					// Add the Umbral Heart casts of F4 to the adjustment total
					adjustment++
					// Reduce the amount of MP
					afterUHMP -= this.data.actions.FIRE_IV.mpCost
				}
			}
			// Count the number of remaining F4 casts they can afford with the MP left after spending all of their hearts
			let fullMPCasts = Math.floor(afterUHMP / (this.data.actions.FIRE_IV.mpCost * 2))

			// If the player had a Paradox marker when they entered AF, we expect them to spend it
			if (windowMetadata.firePhaseMetadata.fireEntryGaugeState.paradox > 0 && fullMPCasts > 0) {
				fullMPCasts--
			}

			// Prior to patch 7.2, expecting more than the baseline of 4 F4s without a Paradox available means needing to Despair to refresh the timer. Dock one expected cast
			if (this.parser.patch.before('7.2') && adjustment + fullMPCasts > NO_UH_EXPECTED_FIRE4 && windowMetadata.firePhaseMetadata.fireEntryGaugeState.paradox === 0) {
				fullMPCasts--
			}

			// Add the full MP casts of F4 to the adjustment total
			adjustment += fullMPCasts

			// Make sure we don't go wild and return a larger expected count than is actually possible, in case the above logic misbehaves...
			//adjustment = Math.min(adjustment, MAX_POSSIBLE_FIRE4)

			// If the player used Manafont in this window, we expect them to use enough F4s to get another Flare Star
			if (window.data.some(event => event.action.id === this.data.actions.MANAFONT.id)) {
				adjustment += ASTRAL_SOUL_MAX_STACKS
				// If using the Manafont Paradox would leave the player one Soul short of a second Flare Star, they should skip it and use F4 instead
				if (adjustment === (ASTRAL_SOUL_MAX_STACKS * 2 - 1)) {
					adjustment++
				}
			}

			// If the player needed to AoE, credit them for the souls that Flare generated
			adjustment -= window.data.filter(event => event.action.id === this.data.actions.FLARE.id).length * FLARE_SOUL_GENERATION
		}

		if (action.action.id === this.data.actions.DESPAIR.id) {
			const manafontIndex = window.data.findIndex(event => event.action.id === this.data.actions.MANAFONT.id)
			const lastFlareIndex = window.data.findLastIndex(event => event.action.id === this.data.actions.FLARE.id)
			if (lastFlareIndex >= 0) {
				const priorGaugeState = this.gauge.getGaugeState(window.data[lastFlareIndex].timestamp - 1)
				// If player had no Umbral Hearts, Flare eats all remaining MP the way Despair does. We're going to assume they knew why they were doing that...
				if (priorGaugeState.umbralHearts === 0) {
					// If they didn't Manafont this window, we shouldn't expect a Despair, and we can bail out
					if (manafontIndex < 0) {
						windowMetadata.expectedDespairs = NO_DENOMINATOR_CODE
						return windowMetadata.expectedDespairs
					}
				} else {
					// If they had Hearts remaining at the time they Flared, we should also see a Despair
					adjustment++
				}
			} else {
				// If they did not Flare, we should see a Despair
				adjustment++
			}
			if (manafontIndex >= 0) {
				const manafontFlareIndex = window.data.findLastIndex((event, index) => event.action.id === this.data.actions.FLARE.id && index < manafontIndex)
				if (manafontFlareIndex >= 0) {
					const priorGaugeState = this.gauge.getGaugeState(window.data[lastFlareIndex].timestamp - 1)
					// If they Flared at 0 Hearts before Manafont, similarly assume no Despair from that half the phase
					if (priorGaugeState.umbralHearts === 0) {
						// If we didn't expect a Despair from the post-Manafont window either, indicate as such
						if (adjustment === 0) {
							windowMetadata.expectedDespairs = NO_DENOMINATOR_CODE
							return windowMetadata.expectedDespairs
						}
					} else {
						// If they had Hearts remaining at the time they Flared before Manafont, we should also see a Despair
						adjustment++
					}
				}
			}
		}

		if (action.action.id === this.data.actions.FLARE_STAR.id) {
			// We should only expect a Flare Star if we're also expected to get all 6 F4s in during a full uptime window
			if (windowMetadata.finalOrDowntime || windowMetadata.expectedFire4s < 0) {
				windowMetadata.expectedFlareStars = NO_DENOMINATOR_CODE
				return windowMetadata.expectedFlareStars
			}

			adjustment = Math.floor(windowMetadata.expectedFire4s / ASTRAL_SOUL_MAX_STACKS)
		}

		// Give them credit if we were overly pessimistic
		adjustment = Math.max(adjustment, actualCount)

		switch (action.action.id) {
		case this.data.actions.FIRE_IV.id:
			windowMetadata.expectedFire4s = adjustment
			break
		case this.data.actions.DESPAIR.id:
			windowMetadata.expectedDespairs = adjustment
			break
		case this.data.actions.FLARE_STAR.id:
			windowMetadata.expectedFlareStars = adjustment
			break
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
