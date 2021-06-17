import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import ACTIONS from 'data/ACTIONS'
import {Event, Events, FieldsTargeted} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import Suggestions, {SEVERITY, Suggestion, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import {UnableToAct} from 'parser/core/modules/UnableToAct'
import React, {Fragment, ReactNode} from 'react'
import {Icon, Message} from 'semantic-ui-react'
import DISPLAY_ORDER from './DISPLAY_ORDER'
import {FIRE_SPELLS} from './Elements'
import Gauge, {BLMGaugeState} from './Gauge'
import Procs from './Procs'

const DEBUG_SHOW_ALL_CYCLES = false && process.env.NODE_ENV !== 'production'

const EXPECTED_FIRE4 = 6
const NO_UH_EXPECTED_FIRE4 = 5
const FIRE4_FROM_MANAFONT = 1

const MIN_MP_FOR_FULL_ROTATION = 9600
const ASTRAL_UMBRAL_DURATION = 15000

const AF_UI_BUFF_MAX_STACK = 3

const ISSUE_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	3: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}

const CYCLE_ENDPOINTS = [
	ACTIONS.BLIZZARD_III.id,
	ACTIONS.TRANSPOSE.id,
	ACTIONS.FREEZE.id,
]

// This is feelycraft at the moment. Rotations shorter than this won't be processed for errors.
const MIN_ROTATION_LENGTH = 3

/**
 * Error type codes, higher values indicate higher priority errors. If you add more, adjust the IDs to ensure correct priorities.
 * Only the highest priority error will be displayed in the 'Reason' column.
 * NOTE: Cycles with values below ERROR_CODES.SHORT will be filtered out of the RotationTable display
 * unless the DEBUG_SHOW_ALL_CYCLES variable is set to true
 */
interface CycleErrorCode {priority: number, message: ReactNode}
const CYCLE_ERRORS: {[key: string]: CycleErrorCode } = {
	NONE: {priority: 0, message: 'No errors'},
	FINAL_OR_DOWNTIME: {priority: 1, message: 'Ended with downtime, or last cycle'},
	SHORT: {priority: 2, message: 'Too short, won\'t process'},
	// Messages below should be Trans objects since they'll be displayed to end users
	SHOULD_SKIP_T3: {priority: 8, message: <Trans id="blm.rotation-watchdog.error-messages.should-skip-t3">Should skip hardcast <ActionLink {...ACTIONS.THUNDER_III}/></Trans>},
	SHOULD_SKIP_B4: {priority: 9, message: <Trans id="blm.rotation-watchdog.error-messages.should-skip-b4">Should skip <ActionLink {...ACTIONS.BLIZZARD_IV}/></Trans>},
	MISSING_FIRE4S: {priority: 10, message: <Trans id="blm.rotation-watchdog.error-messages.missing-fire4s">Missing one or more <ActionLink {...ACTIONS.FIRE_IV}/>s</Trans>}, // These two errors are lower priority since they can be determined by looking at the
	MISSING_DESPAIRS: {priority: 15, message: <Trans id="blm.rotation-watchdog.error-messages.missing-despair">Missing one or more <ActionLink {...ACTIONS.DESPAIR}/>s</Trans>}, // target columns in the table, so we want to tell players about other errors first
	MANAFONT_BEFORE_DESPAIR: {priority: 30, message: <Trans id="blm.rotation-watchdog.error-messages.manafont-before-despair"><ActionLink {...ACTIONS.MANAFONT}/> used before <ActionLink {...ACTIONS.DESPAIR}/></Trans>},
	EXTRA_T3: {priority: 49, message: <Trans id="blm.rotation-watchdog.error-messages.extra-t3">Extra <ActionLink {...ACTIONS.THUNDER_III}/>s</Trans>}, // Extra T3 and Extra F1 are *very* similar in terms of per-GCD potency loss
	EXTRA_F1: {priority: 50, message: <Trans id="blm.rotation-watchdog.error-messages.extra-f1">Extra <ActionLink {...ACTIONS.FIRE_I}/></Trans>}, // These two codes should stay close to each other
	NO_FIRE_SPELLS: {priority: 75, message: <Trans id="blm.rotation-watchdog.error-messages.no-fire-spells">Rotation included no Fire spells</Trans>},
	DROPPED_ENOCHIAN: {priority: 100, message: <Trans id="blm.rotation-watchdog.error-messages.dropped-enochian">Dropped <ActionLink {...ACTIONS.ENOCHIAN}/></Trans>},
	DIED: {priority: 101, message: <Trans id="blm.rotation-watchdog.error-messages.died"><ActionLink showName={false} {...ACTIONS.RAISE} /> Died</Trans>},
}

interface EventActionProcable extends FieldsTargeted {
	action: number,
	isProc?: boolean
}

class Cycle {
	events: EventActionProcable[] = []
	startTime: number
	endTime?: number

	inFirePhase: boolean = false
	atypicalAFStart: boolean = false
	firePhaseStartMP: number = 0

	finalOrDowntime: boolean = false

	gaugeStateBeforeFire: BLMGaugeState = {
		astralFire: 0,
		umbralIce: 0,
		umbralHearts: 0,
		polyglot: 0,
		enochian: false,
	}

	_errorCode: CycleErrorCode = CYCLE_ERRORS.NONE
	public set errorCode(code) {
		if (code.priority > this._errorCode.priority) {
			this._errorCode = code
		}
	}
	public get errorCode(): CycleErrorCode {
		return this._errorCode
	}

	/**
	 * Greatly simplified from the pre-Shadowbringers version of this function. Because Umbral Soul gives us
	 * a proper downtime action to build UH/UI, it should be possible to enter every fire phase with a normal
	 * gauge state, so we're no longer going to reduce the expected count based on the actual gauge state on
	 * entering fire phase. We're still tracking the data necessary to do this again in the future if there is
	 * value in doing so.
	 */
	public get expectedFire4s(): number | undefined {
		if (this.finalOrDowntime) {
			return
		}

		// Account for the no-UH opener/LeyLines optimization when determining the expected count of Fire 4s
		let expectedCount = (this.gaugeStateBeforeFire.umbralHearts === 0 && !this.events.some(event => event.action === ACTIONS.FIRE_I.id))
			? NO_UH_EXPECTED_FIRE4 : EXPECTED_FIRE4

		/**
		 * A bit hacky but, when we are in the opener and start with F3 it will be the only cycle that doesn't include any B3, Freeze, US.
		 * Since we are in the opener, and specifically opening with F3, we are doing the (mod) Jp Opener, which drops the expected count by 1
		 */
		expectedCount -= !this.events.some(event => CYCLE_ENDPOINTS.includes(event.action)) ? 1 : 0
		// Adjust expected count if the cycle included manafont
		expectedCount += this.hasManafont ? FIRE4_FROM_MANAFONT : 0

		return expectedCount
	}
	public get actualFire4s(): number {
		return this.events.filter(event => event.action === ACTIONS.FIRE_IV.id).length
	}
	public get missingFire4s(): number | undefined {
		if (!this.expectedFire4s) { return }
		return Math.max(this.expectedFire4s - this.actualFire4s, 0)
	}

	public get hasManafont(): boolean {
		return this.events.some(event => event.action === ACTIONS.MANAFONT.id)
	}
	public get expectedDespairs(): number {
		return this.hasManafont ? 2 : 1
	}
	public get actualDespairs(): number {
		return this.events.filter(event => event.action === ACTIONS.DESPAIR.id).length
	}
	public get missingDespairs(): number {
		return Math.max(this.expectedDespairs - this.actualDespairs, 0)
	}

	public get extraF1s(): number {
		return Math.max(this.events.filter(event => event.action === ACTIONS.FIRE_I.id).length - 1, 0)
	}

	public get hardT3Count(): number {
		return this.events.filter(event => event.action === ACTIONS.THUNDER_III.id && !event.isProc).length
	}
	// TODO: Need to find a way to distinguish which AF/UI element the thunders were cast in, and filter out the hardcasts that happened in Ice phase...
	// Also probably want to better calculate how many T3 hardcasts could happen without sacrificing a fire (ie, one before and after manafont, with enough starting MP) and refund that many instead of a flat one (in case of multitarget bosses)
	public get extraT3s(): number {
		if (!(this.missingFire4s || this.missingDespairs)) { // By definition, if you didn't miss any expected casts, you couldn't have hardcast an extra T3
			return 0
		}
		if (this.firePhaseStartMP < MIN_MP_FOR_FULL_ROTATION) {
			return this.hardT3Count
		}
		return Math.max(this.hardT3Count - 1, 0)
	}

	public get manafontBeforeDespair(): boolean {
		return this.hasManafont && this.actualDespairs > 0 &&
			this.events.findIndex(event => event.action === ACTIONS.MANAFONT.id) <
			this.events.findIndex(event => event.action === ACTIONS.DESPAIR.id)
	}

	public get isMissingFire(): boolean {
		return !this.events.some(event => FIRE_SPELLS.includes(event.action))
	}

	public get shouldSkipB4(): boolean {
		return this.finalOrDowntime && this.gaugeStateBeforeFire.umbralHearts > 0 && this.missingFire4s === 2
	}
	public get shouldSkipT3(): boolean {
		return this.finalOrDowntime && this.hardT3Count > 0
	}

	constructor(start: number, gaugeState?: BLMGaugeState) {
		this.startTime = start
		if (gaugeState) {
			this.gaugeStateBeforeFire = {...gaugeState}
		}
	}

	public overrideErrorCode(code: CycleErrorCode): void {
		this._errorCode = code
	}
}
export default class RotationWatchdog extends Analyser {
	static override handle = 'RotationWatchdog'
	static override title = t('blm.rotation-watchdog.title')`Rotation Outliers`
	static override displayOrder = DISPLAY_ORDER.ROTATION

	@dependency private suggestions!: Suggestions
	@dependency private invulnerability!: Invulnerability
	@dependency private timeline!: Timeline
	@dependency private unableToAct!: UnableToAct
	@dependency private actors!: Actors
	@dependency private gauge!: Gauge
	@dependency private data!: Data
	@dependency private procs!: Procs

	private currentGaugeState: BLMGaugeState = {
		astralFire: 0,
		umbralIce: 0,
		umbralHearts: 0,
		polyglot: 0,
		enochian: false,
	}

	private currentRotation: Cycle = new Cycle(this.parser.pull.timestamp)
	private history: Cycle[] = []

	private firstEvent: boolean = true
	// counters for suggestions
	private uptimeSouls: number = 0

	override initialise() {
		this.addEventHook(filter<Event>().source(this.parser.actor.id).type('action'), this.onCast)
		this.addEventHook('complete', this.onComplete)
		this.addEventHook('blmgauge', this.onGaugeEvent)
		this.addEventHook({
			type: 'death',
			actor: this.parser.actor.id,
		}, this.onDeath)
	}

	// Handle events coming from BLM's Gauge module
	private onGaugeEvent(event: Events['blmgauge']) {
		const nextGaugeState = this.gauge.getGaugeState(event.timestamp)
		if (!nextGaugeState) { return }

		// If we're beginning the fire phase of this cycle, note it and save some data
		if (this.currentGaugeState.astralFire === 0 && nextGaugeState.astralFire > 0) {
			this.currentRotation.inFirePhase = true
			this.currentRotation.firePhaseStartMP = this.actors.current.mp.current

			// If we didn't enter fire phase with a normal gauge state of 3 UI/UH stacks, note it
			if (this.currentRotation.gaugeStateBeforeFire.umbralIce !== AF_UI_BUFF_MAX_STACK ||
				this.currentRotation.gaugeStateBeforeFire.umbralHearts !== AF_UI_BUFF_MAX_STACK) {
				this.currentRotation.atypicalAFStart = true
			}
		}

		// If we no longer have enochian, flag it for display
		if (this.currentGaugeState.enochian && !nextGaugeState.enochian) {
			this.currentRotation.errorCode = CYCLE_ERRORS.DROPPED_ENOCHIAN
		}

		// Retrieve the GaugeState from the event
		this.currentGaugeState = {...nextGaugeState}

		// If we're in fire phase, stop processing
		if (this.currentRotation.inFirePhase) {
			return
		}

		// If we're in ice phase, spread the current gauge state into the pre-fire cache for later recording
		this.currentRotation.gaugeStateBeforeFire = {...this.currentGaugeState}
	}

	// Handle cast events and updated recording data accordingly
	private onCast(event: Events['action']) {
		const actionId = event.action

		// If this action is signifies the beginning of a new cycle, unless this is the first
		// cast of the log, stop the current cycle, and begin a new one. If Transposing from ice
		// to fire, keep this cycle going
		if (CYCLE_ENDPOINTS.includes(actionId) && !this.firstEvent &&
			!(actionId === this.data.actions.TRANSPOSE.id && this.currentGaugeState.umbralIce > 0)) {
			this.startRecording(event)
		}

		// Add actions other than auto-attacks to the rotation cast list
		const action = this.data.getAction(actionId)

		if (!action  || action.autoAttack) {
			return
		}

		// Note that we've recorded our first damage event once we have one
		if (this.firstEvent && action.onGcd) { this.firstEvent = false }

		this.currentRotation.events.push({...event, isProc: this.procs.checkEventWasProc(event)})

		if (actionId === this.data.actions.UMBRAL_SOUL.id && !this.invulnerability.isActive({types: ['invulnerable']})) {
			this.uptimeSouls++
		}
	}

	private onDeath() {
		this.currentRotation.errorCode = CYCLE_ERRORS.DIED
	}

	// Finish this parse and add the suggestions and checklist items
	private onComplete() {
		this.stopRecording(undefined)

		// Override the error code for cycles that dropped enochian, when the cycle contained an unabletoact time long enough to kill it.
		// Couldn't do this at the time of code assignment, since the downtime data wasn't fully available yet
		for (const cycle of this.history) {
			if (cycle.errorCode !== CYCLE_ERRORS.DROPPED_ENOCHIAN) { continue }

			const windows = this.unableToAct
				.getWindows({
					start: cycle.startTime,
					end: cycle.endTime,
				})
				.filter(window => Math.max(0, window.end - window.start) >= ASTRAL_UMBRAL_DURATION)

			if (windows.length > 0) {
				cycle.overrideErrorCode(CYCLE_ERRORS.FINAL_OR_DOWNTIME)
			}
		}

		// Re-check to see if any of the cycles that were tagged as missing Fire 4s were actually right before a downtime but the boss
		// became invunlnerable before another Fire 4 could've been cast. If so, mark it as a finalOrDowntime cycle, clear the error code
		// and reprocess it to see if there were any other errors
		this.history.forEach(cycle => {
			if (cycle.errorCode !== CYCLE_ERRORS.MISSING_FIRE4S) { return }
			const cycleEnd = cycle.endTime ?? (this.parser.pull.timestamp + this.parser.pull.duration)
			if (this.invulnerability.isActive({
				timestamp: cycleEnd + this.data.actions.FIRE_IV.castTime,
				types: ['invulnerable'],
			})) {
				cycle.finalOrDowntime = true
				cycle.overrideErrorCode(CYCLE_ERRORS.NONE)
				this.processCycle(cycle)
			}
		})

		// Suggestion for skipping B4 on rotations that are cut short by the end of the parse or downtime
		const shouldSkipB4s = this.history.filter(cycle => cycle.shouldSkipB4).length
		if (shouldSkipB4s > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.FIRE_IV.icon,
				content: <Trans id="blm.rotation-watchdog.suggestions.should-skip-b4.content">
					You lost at least one <ActionLink {...this.data.actions.FIRE_IV}/> by not skipping <ActionLink {...this.data.actions.BLIZZARD_IV}/> in an Umbral Ice phase before the fight finished or a phase transition occurred.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="blm.rotation-watchdog.suggestions.should-skip-b4.why">
					You should have skipped <ActionLink showIcon={false} {...this.data.actions.BLIZZARD_IV} /> <Plural value={shouldSkipB4s} one="# time" other="# times"/>.
				</Trans>,
			}))
		}

		// Suggestion for skipping T3 on rotations that are cut short by the end of the parse or downtime
		const shouldSkipT3s = this.history.filter(cycle => cycle.shouldSkipT3).reduce<number>((sum, cycle) => sum + cycle.hardT3Count, 0)
		if (shouldSkipT3s > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.FIRE_IV.icon,
				content: <Trans id="blm.rotation-watchdog.suggestions.should-skip-t3.content">
					You lost at least one <ActionLink {...this.data.actions.FIRE_IV}/> by hard casting <ActionLink {...this.data.actions.THUNDER_III} /> before the fight finished or a phase transition occurred.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="blm.rotation-watchdog.suggestions.should-skip-t3.why">
					You should have skipped <ActionLink showIcon={false} {...this.data.actions.THUNDER_III} /> <Plural value={shouldSkipT3s} one="# time" other="# times"/>.
				</Trans>,
			}))
		}

		// Suggestion for unneccessary extra F1s
		const extraF1s = this.history.reduce<number>((sum, cycle) => sum + cycle.extraF1s, 0)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.FIRE_I.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.extra-f1s.content">
				Casting more than one <ActionLink {...this.data.actions.FIRE_I}/> per Astral Fire cycle is a crutch that should be avoided by better pre-planning of the encounter.
			</Trans>,
			tiers: ISSUE_SEVERITY_TIERS,
			value: extraF1s,
			why: <Trans id="blm.rotation-watchdog.suggestions.extra-f1s.why">
				You cast an extra <ActionLink showIcon={false} {...this.data.actions.FIRE_I} /> <Plural value={extraF1s} one="# time" other="# times"/>.
			</Trans>,
		}))

		// Suggestion to end Astral Fires with Despair
		const astralFiresMissingDespairs = this.history.filter(cycle => cycle.missingDespairs).length
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.DESPAIR.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.end-with-despair.content">
				Once you can no longer cast another spell in Astral Fire and remain above 800 MP, you should use your remaining MP by casting <ActionLink {...this.data.actions.DESPAIR} />.
			</Trans>,
			tiers: ISSUE_SEVERITY_TIERS,
			value: astralFiresMissingDespairs,
			why: <Trans id="blm.rotation-watchdog.suggestions.end-with-despair.why">
				<Plural value={astralFiresMissingDespairs} one="# Astral Fire phase was" other="# Astral Fire phases were"/> missing at least one <ActionLink showIcon={false} {...this.data.actions.DESPAIR} />.
			</Trans>,
		}))

		// Suggestion to not use Manafont before Despair
		const manafontsBeforeDespair = this.history.filter(cycle => cycle.manafontBeforeDespair).length
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.MANAFONT.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.mf-before-despair.content">
				Using <ActionLink {...this.data.actions.MANAFONT} /> before <ActionLink {...this.data.actions.DESPAIR} /> leads to fewer <ActionLink showIcon={false} {...this.data.actions.DESPAIR} />s than possible being cast. Try to avoid that since <ActionLink showIcon={false} {...this.data.actions.DESPAIR} /> is stronger than <ActionLink {...this.data.actions.FIRE_IV} />.
			</Trans>,
			tiers: { // Special severity tiers, since there's only so many times manafont can be used in a fight
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: manafontsBeforeDespair,
			why: <Trans id="blm.rotation-watchdog.suggestions.mf-before-despair.why">
				<ActionLink showIcon={false} {...this.data.actions.MANAFONT} /> was used before <ActionLink {...this.data.actions.DESPAIR} /> <Plural value={manafontsBeforeDespair} one="# time" other="# times"/>.
			</Trans>,
		}))

		// Suggestion for hard T3s under AF. Should only have one per cycle
		const extraT3s = this.history.reduce<number>((sum, cycle) => sum + cycle.extraT3s, 0)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.THUNDER_III_FALSE.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.wrong-t3.content">
				Don't hard cast more than one <ActionLink {...this.data.actions.THUNDER_III}/> in your Astral Fire phase, since that costs MP which could be used for more <ActionLink {...this.data.actions.FIRE_IV}/>s.
			</Trans>,
			tiers: ISSUE_SEVERITY_TIERS,
			value: extraT3s,
			why: <Trans id="blm.rotation-watchdog.suggestions.wrong-t3.why">
				<ActionLink showIcon={false} {...this.data.actions.THUNDER_III} /> was hard casted under Astral Fire <Plural value={extraT3s} one="# extra time" other="# extra times"/>.
			</Trans>,
		}))

		// Suggestion not to icemage, but don't double-count it if they got cut short or we otherwise weren't showing it in the errors table
		const rotationsWithoutFire = this.history.filter(cycle => cycle.isMissingFire && cycle.errorCode < CYCLE_ERRORS.DIED && cycle.errorCode.priority > CYCLE_ERRORS.SHORT.priority).length
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.BLIZZARD_II.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.icemage.content">
				Avoid spending significant amounts of time in Umbral Ice. The majority of your damage comes from your Astral Fire phase, so you should maximize the number of <ActionLink {...this.data.actions.FIRE_IV}/>s cast during the fight.
			</Trans>,
			tiers: ISSUE_SEVERITY_TIERS,
			value: rotationsWithoutFire,
			why: <Trans id="blm.rotation-watchdog.suggestions.icemage.why">
				<Plural value={rotationsWithoutFire} one="# rotation was" other="# rotations were"/> performed with no fire spells.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.UMBRAL_SOUL.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.uptime-souls.content">
				Avoid using <ActionLink {...this.data.actions.UMBRAL_SOUL} /> when there is a target available to hit with a damaging ability. <ActionLink showIcon={false} {...this.data.actions.UMBRAL_SOUL} /> does no damage and prevents you from using other GCD skills. It should be reserved for downtime.
			</Trans>,
			tiers: ISSUE_SEVERITY_TIERS,
			value: this.uptimeSouls,
			why: <Trans id="blm.rotation-watchdog.suggestions.uptime-souls.why">
				<ActionLink showIcon={false} {...this.data.actions.UMBRAL_SOUL} /> was performed during uptime <Plural value={this.uptimeSouls} one="# time" other="# times"/>.
			</Trans>,
		}))
	}

	// Complete the previous cycle and start a new one
	private startRecording(event: Events['action']) {
		this.stopRecording(event)
		// Pass in whether we've seen the first cycle endpoint to account for pre-pull buff executions (mainly Sharpcast)
		this.currentRotation = new Cycle(event.timestamp, this.currentGaugeState)
	}

	// End the current cycle, send it off to error processing, and add it to the history list
	private stopRecording(event: Events['action'] | undefined) {
		this.currentRotation.endTime = this.parser.currentEpochTimestamp

		// If an event object wasn't passed, or the event was a transpose that occurred during downtime,
		// treat this as a rotation that ended with some kind of downtime
		if (
			!event
			|| (
				event
				&& event.action === this.data.actions.TRANSPOSE.id
				&& this.invulnerability.isActive({
					timestamp: event.timestamp,
					types: ['untargetable'],
				})
			)
		) {
			this.currentRotation.finalOrDowntime = true
		}

		this.processCycle(this.currentRotation)
		this.history.push(this.currentRotation)
	}

	// Process errors for this cycle
	// TODO: Handle aoe things?
	// TODO: Handle Flare?
	private processCycle(currentRotation: Cycle) {
		// Only process errors for rotations with more than the minimum number of casts,
		// since fewer than that usually indicates something weird happening
		if (currentRotation.events.length <= MIN_ROTATION_LENGTH) {
			currentRotation.errorCode = CYCLE_ERRORS.SHORT
			return
		}

		// Check for errors that apply for all cycles

		// Check if the rotation included the expected number of Despair casts
		if (currentRotation.missingDespairs) {
			currentRotation.errorCode = CYCLE_ERRORS.MISSING_DESPAIRS
		}

		// Check whether manafont was used before despair
		if (currentRotation.manafontBeforeDespair) {
			currentRotation.errorCode = CYCLE_ERRORS.MANAFONT_BEFORE_DESPAIR
		}

		// Check if the rotation included more than one Fire 1
		if (currentRotation.extraF1s > 0) {
			currentRotation.errorCode = CYCLE_ERRORS.EXTRA_F1
		}

		// If this cycle ends with downtime or is the last cycle, many of the errors we normally check for
		// don't apply, so split the processing pathway here
		if (currentRotation.finalOrDowntime) {
			this.processDowntimeCycle(currentRotation)
			return
		}

		this.processNormalCycle(currentRotation)
	}

	// Process errors for a normal mid-fight cycle
	private processNormalCycle(currentRotation: Cycle) {
		// Check to make sure we didn't lose Fire 4 casts due to spending MP on T3 hardcasts
		if (currentRotation.extraT3s > 0) {
			currentRotation.errorCode = CYCLE_ERRORS.EXTRA_T3
		}

		// Why so icemage?
		if (currentRotation.isMissingFire) {
			currentRotation.errorCode = CYCLE_ERRORS.NO_FIRE_SPELLS
		}

		// If they're just missing Fire 4 because derp, note it
		if (currentRotation.missingFire4s) {
			currentRotation.errorCode = CYCLE_ERRORS.MISSING_FIRE4S
		}
	}

	// Process errors for a cycle that was cut short by downtime or by the fight ending
	private processDowntimeCycle(currentRotation: Cycle) {
		currentRotation.errorCode = CYCLE_ERRORS.FINAL_OR_DOWNTIME

		// Check if more Fire 4s could've been cast by skipping Blizzard 4 before this downtime
		if (currentRotation.shouldSkipB4) {
			currentRotation.errorCode = CYCLE_ERRORS.SHOULD_SKIP_B4
		}

		// Check if more Fire 4s could've been cast by skipping a hardcast Thunder 3
		if (currentRotation.hardT3Count > 0) {
			currentRotation.errorCode = CYCLE_ERRORS.SHOULD_SKIP_T3
		}
	}

	override output() {
		const outliers: Cycle[] = this.history.filter(cycle => cycle.errorCode.priority >
			CYCLE_ERRORS.SHORT.priority || DEBUG_SHOW_ALL_CYCLES)
		if (outliers.length > 0) {
			return <Fragment>
				<Message>
					<Trans id="blm.rotation-watchdog.rotation-table.message">
						The core of BLM consists of six <ActionLink {...this.data.actions.FIRE_IV} />s and one <ActionLink {...this.data.actions.DESPAIR} /> per rotation (seven <ActionLink {...this.data.actions.FIRE_IV} />s and two <ActionLink {...this.data.actions.DESPAIR} />s with <ActionLink {...this.data.actions.MANAFONT} />).<br/>
						Avoid missing Fire IV casts where possible.
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
				<RotationTable
					targets={[
						{
							header: <ActionLink showName={false} {...this.data.actions.FIRE_IV} />,
							accessor: 'fire4s',
						},
						{
							header: <ActionLink showName={false} {...this.data.actions.DESPAIR} />,
							accessor: 'despairs',
						},
					]}
					notes={[
						{
							header: <Trans id="blm.rotation-watchdog.rotation-table.header.reason">Why Outlier</Trans>,
							accessor: 'reason',
						},
					]}
					data={outliers.map(cycle => {
						return ({
							start: cycle.startTime - this.parser.pull.timestamp,
							end: cycle.endTime != null ?
								cycle.endTime - this.parser.pull.timestamp :
								cycle.startTime - this.parser.pull.timestamp,
							targetsData: {
								fire4s: {
									actual: cycle.actualFire4s,
									expected: cycle.expectedFire4s,
								},
								despairs: {
									actual: cycle.actualDespairs,
									expected: cycle.expectedDespairs,
								},
							},
							notesMap: {
								reason: <>{cycle.errorCode.message}</>,
							},
							rotation: cycle.events,
						})
					})}
					onGoto={this.timeline.show}
				/>
			</Fragment>
		}
	}
}
