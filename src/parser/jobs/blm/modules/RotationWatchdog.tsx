import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import {ActionKey} from 'data/ACTIONS'
import {Events, FieldsTargeted} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import {UnableToAct} from 'parser/core/modules/UnableToAct'
import React, {Fragment, ReactNode} from 'react'
import {Icon, Message} from 'semantic-ui-react'
import DISPLAY_ORDER from './DISPLAY_ORDER'
import {FIRE_SPELLS} from './Elements'
import Gauge, {ASTRAL_UMBRAL_DURATION, BLMGaugeState, MAX_UMBRAL_HEART_STACKS} from './Gauge'
import Leylines from './Leylines'
import Procs from './Procs'

const DEBUG_SHOW_ALL_CYCLES = false && process.env.NODE_ENV !== 'production'

const MAX_POSSIBLE_FIRE4 = 6
const NO_UH_EXPECTED_FIRE4 = 4
const FIRE4_FROM_MANAFONT = 1

const EXTRA_F4_COP_THRESHOLD = 0.5 // Feelycraft

const DEFAULT_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	3: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}

const ENHANCED_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}

const CYCLE_ENDPOINTS: ActionKey[] = [
	'BLIZZARD_III',
	'TRANSPOSE',
	'FREEZE',
]

// This is feelycraft at the moment. Rotations shorter than this won't be processed for errors.
const MIN_ROTATION_LENGTH = 3

interface CycleErrorCode {priority: number, message: ReactNode}
const NO_ERROR: CycleErrorCode = {priority: 0, message: 'No errors'} // Still defining this out here so we can default it in Cycle
const DEATH_PRIORITY = 101 // Define this const here so we can reference it in both classes
const HIDDEN_PRIORITY_THRESHOLD = 2 // Same as ^

interface CycleEvent extends FieldsTargeted {
	action: number,
	isProc: boolean,
	gaugeContext: BLMGaugeState
}

interface FirePhaseMetadata {
	startTime: number,
	initialMP: number,
	circleOfPowerPct: number
	initialGaugeState: BLMGaugeState
}

class Cycle {
	private data: Data
	private fireSpellIds: number[] = []

	//#region Cycle events
	// Keep track of spells cast in this cycle by which phase of the cycle they're in
	private unaspectedEvents: CycleEvent[] = [] // This will only include events during opener or reopener cycles
	private icePhaseEvents: CycleEvent[] = []
	private firePhaseEvents: CycleEvent[] = []
	private manafontPhaseEvents: CycleEvent[] = [] // Keeping track of post-manafont events separately so we can fine-tune some of the analysis logic

	// Concatenate the phased events together to produce the full event array for the cycle
	public get events(): CycleEvent[] {
		return this.unaspectedEvents.concat(this.icePhaseEvents).concat(this.firePhaseEvents).concat(this.manafontPhaseEvents)
	}
	//#endregion

	//#region Cycle metadata
	public startTime: number
	public endTime?: number
	public firePhaseMetadata: FirePhaseMetadata
	public finalOrDowntime: boolean = false

	private _errorCode: CycleErrorCode = NO_ERROR

	public set errorCode(code: CycleErrorCode) {
		if (code.priority > this._errorCode.priority) {
			this._errorCode = code
		}
	}

	public get errorCode(): CycleErrorCode {
		return this._errorCode
	}
	//#endregion

	//#region Fire 4s
	/**
	 * June 2021 revamp of this function brings back some of the pre-Shadowbringers gauge state complexity for determining expected fire counts for the following reasons:
	 *   1. While Umbral Soul gives us a downtime action to build and maintain Umbral Hearts/Umbral Ice, it isn't foolproof. E1S's giant midfight cutscene is a forced drop.
	 *   2. Freeze reopener after death or a forced drop is an expected 5xF4 cycle, and is more PPS than a B3 B4 [T3] F3 [Fire phase] or a Freeze B4 [T3] F3 [Fire phase] reopener, so we should allow it
	 *   3. Alternate playstyle cycles and the No-B4-Opener rely on Ley Lines to eke out a 5th F4 without using F1, and enough BLMs are using the alternate playstyle to warrant not dinging those
	 *   4. Separating the 'How many F4s can you get from this starting gauge state' count from the 'how many total F4s can this cycle fit with Manafont factored in' count allows for more robust thunder counts later on
	 *
	 * NOTE:
	 *   This revamp does NOT account for all the complexities of the alternate playstyle transpose shenanigans.
	 *   It only sets the baseline expected F4 count at 4, and assumes extra F4s based on the number of Umbral Hearts carried into the Astral Fire phase.
	 */
	public get expectedFire4s(): number | undefined {
		if (this.finalOrDowntime) {
			return
		}

		// Get the expected count prior to the initial despair
		let expectedCount = this.expectedFire4sBeforeDespair

		// Adjust expected count if the cycle included manafont
		expectedCount += this.hasManafont ? FIRE4_FROM_MANAFONT : 0

		return expectedCount
	}

	public get expectedFire4sBeforeDespair(): number {
		// Cycles start with a baseline of 4 Fire 4s
		let expectedCount = NO_UH_EXPECTED_FIRE4

		// Cycles with at least one heart get an extra F4 (5x F4 + F1 with 1 heart is the same MP cost as the standard 6F4 + F1 with 3)
		// Note that two hearts does not give any extra F4s, though it'll hardly ever come up in practice
		if (this.firePhaseMetadata.initialGaugeState.umbralHearts > 0) {
			expectedCount++
		}

		// Cycles with full hearts get two extra F4s
		if (this.firePhaseMetadata.initialGaugeState.umbralHearts === MAX_UMBRAL_HEART_STACKS) {
			expectedCount++
		}

		/**
		 * IF this cycle's Astral Fire phase began with no Umbral Hearts (either no-B4-opener, or a midfight alternate playstyle cycle),
		 * AND it is not an opener that begins with Fire 3 (ie, the cycle includes an ice phase)
		 * AND we have leylines for long enough to squeeze in an extra F4
		 * THEN we increase the expected count by one
		 */
		if (
			expectedCount === NO_UH_EXPECTED_FIRE4 &&
			this.icePhaseEvents.length > 0 &&
			this.firePhaseMetadata.circleOfPowerPct >= EXTRA_F4_COP_THRESHOLD
		) {
			expectedCount++
		}

		// Make sure we don't go wild and return a larger expected count than is actually possible, in case the above logic misbehaves...
		return Math.min(expectedCount, MAX_POSSIBLE_FIRE4)
	}

	public get actualFire4s(): number {
		return this.events.filter(event => event.action === this.data.actions.FIRE_IV.id).length
	}

	public get missingFire4s(): number | undefined {
		if (!this.expectedFire4s) { return }
		return Math.max(this.expectedFire4s - this.actualFire4s, 0)
	}
	//#endregion

	//#region Despairs
	public get expectedDespairs(): number {
		return this.hasManafont ? 2 : 1
	}

	public get actualDespairs(): number {
		return this.events.filter(event => event.action === this.data.actions.DESPAIR.id).length
	}

	public get missingDespairs(): number {
		return Math.max(this.expectedDespairs - this.actualDespairs, 0)
	}
	//#endregion

	//#region Thunder 3s
	private hardT3sInPhase(events: CycleEvent[]): number {
		return events.filter(event => event.action === this.data.actions.THUNDER_III.id && !event.isProc).length
	}

	public get hardT3sBeforeManafont(): number {
		return this.hardT3sInPhase(this.firePhaseEvents)
	}

	public get hardT3sAfterManafont(): number {
		return this.hardT3sInPhase(this.manafontPhaseEvents)
	}

	public get hardT3sInFireCount(): number {
		return this.hardT3sBeforeManafont + this.hardT3sAfterManafont
	}

	public get extraT3s(): number {
		// By definition, if you didn't miss any expected casts, you couldn't have hardcast an extra T3
		if (!(this.missingFire4s || this.missingDespairs)) {
			return 0
		}

		// Determine how much MP we need to cast all of our expected Fire spells
		const minimumMPForExpectedFires =
			(this.expectedFire4sBeforeDespair * this.data.actions.FIRE_IV.mpCost + // MP for the expected Fire 4s
			(this.events.some(event => event.action === this.data.actions.FIRE_I.id) ? 1 : 0) * this.data.actions.FIRE_I.mpCost) // Feelycraft: If they included a single F1 we'll allow it. If they skipped it, that's fine too. If they have more than one, it's bad so only allow one for the MP requirement calculation.
			* 2 // Astral Fire makes F1 and F4 cost twice as much
			- this.firePhaseMetadata.initialGaugeState.umbralHearts * this.data.actions.FIRE_IV.mpCost // Refund the additional cost for each Umbral Heart carried into the Astral Fire phase
			+ this.data.actions.FIRE_IV.mpCost // Add in the required MP cost for Despair, which happens to be the same as an F4

		// Figure out how many T3s we could hardcast with the MP not needed for Fires (if any)
		const maxHardcastT3s = Math.floor(Math.max(this.firePhaseMetadata.initialMP - minimumMPForExpectedFires, 0) / this.data.actions.THUNDER_III.mpCost)

		// Refund the T3s that dont lose us a Fire 4 from the pre-manafont hardcast count, as well as one from the post-manafont count
		return Math.max(this.hardT3sBeforeManafont - maxHardcastT3s, 0) + Math.max(this.hardT3sAfterManafont - 1, 0)
	}
	//#endregion

	//#region Manafont
	public get hasManafont(): boolean {
		return this.events.some(event => event.action === this.data.actions.MANAFONT.id)
	}

	public get manafontBeforeDespair(): boolean {
		return this.hasManafont && !this.firePhaseEvents.some(event => event.action === this.data.actions.DESPAIR.id)
	}
	//#endregion

	//#region Other Fire checks
	public get extraF1s(): number {
		return Math.max(this.events.filter(event => event.action === this.data.actions.FIRE_I.id).length - 1, 0)
	}

	public get isMissingFire(): boolean {
		return !this.events.some(event => this.fireSpellIds.includes(event.action))
	}
	//#endregion

	//#region Final cycle or downtime cycle checks
	public get shouldSkipB4(): boolean {
		return this.finalOrDowntime // B4 should be skipped if this cycle ended in downtime or the end of the fight,
			&& this.icePhaseEvents.some(event => event.action === this.data.actions.BLIZZARD_IV.id) // AND this cycle had a B4 cast
			&& this.actualFire4s <= NO_UH_EXPECTED_FIRE4 // AND the Umbral Hearts gained from Blizzard 4 weren't needed
	}

	// Hardcasted T3's initial potency isn't worth it if the DoT is going to go to waste before the boss jumps or dies
	public get shouldSkipT3(): boolean {
		return this.finalOrDowntime && this.hardT3sInFireCount > 0
	}
	//#endregion

	public get includeInSuggestions(): boolean {
		return this.errorCode.priority < DEATH_PRIORITY && this.errorCode.priority > HIDDEN_PRIORITY_THRESHOLD
	}

	constructor(start: number, gaugeState: BLMGaugeState, dataRef: Data, fireSpellIds: number[]) {
		this.startTime = start
		this.firePhaseMetadata = {
			startTime: 0,
			initialMP: 0,
			circleOfPowerPct: 0,
			initialGaugeState: {...gaugeState},
		}
		this.data = dataRef
		this.fireSpellIds = fireSpellIds
	}

	public overrideErrorCode(code: CycleErrorCode): void {
		this._errorCode = code
	}

	public addEvent(event: CycleEvent): void {
		// Stash the event in the appropriate phase-specific array
		if (event.gaugeContext.umbralIce === 0 && event.gaugeContext.astralFire === 0) {
			this.unaspectedEvents.push(event)
		} else if (this.firePhaseMetadata.startTime === 0) {
			this.icePhaseEvents.push(event)
		} else if (!this.firePhaseEvents.some(event => event.action === this.data.actions.MANAFONT.id)) {
			this.firePhaseEvents.push(event)
		} else {
			this.manafontPhaseEvents.push(event)
		}
	}
}

export class RotationWatchdog extends Analyser {
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
	@dependency private leylines!: Leylines

	private currentGaugeState: BLMGaugeState = {
		astralFire: 0,
		umbralIce: 0,
		umbralHearts: 0,
		polyglot: 0,
		enochian: false,
	}

	/**
	 * Error type codes, higher values indicate higher priority errors. If you add more, adjust the IDs to ensure correct priorities.
	 * Only the highest priority error will be displayed in the 'Reason' column.
	 * NOTE: Cycles with values at or below HIDDEN_PRIORITY_THRESHOLD will be filtered out of the RotationTable display
	 * unless the DEBUG_SHOW_ALL_CYCLES variable is set to true
	 */
	private readonly CYCLE_ERRORS: {[key: string]: CycleErrorCode } = {
		FINAL_OR_DOWNTIME: {priority: 1, message: 'Ended with downtime, or last cycle'},
		SHORT: {priority: HIDDEN_PRIORITY_THRESHOLD, message: 'Too short, won\'t process'},
		// Messages below should be Trans objects since they'll be displayed to end users
		SHOULD_SKIP_T3: {priority: 8, message: <Trans id="blm.rotation-watchdog.error-messages.should-skip-t3">Should skip hardcast <ActionLink {...this.data.actions.THUNDER_III}/></Trans>},
		SHOULD_SKIP_B4: {priority: 9, message: <Trans id="blm.rotation-watchdog.error-messages.should-skip-b4">Should skip <ActionLink {...this.data.actions.BLIZZARD_IV}/></Trans>},
		MISSING_FIRE4S: {priority: 10, message: <Trans id="blm.rotation-watchdog.error-messages.missing-fire4s">Missing one or more <ActionLink {...this.data.actions.FIRE_IV}/>s</Trans>}, // These two errors are lower priority since they can be determined by looking at the
		MISSING_DESPAIRS: {priority: 15, message: <Trans id="blm.rotation-watchdog.error-messages.missing-despair">Missing one or more <ActionLink {...this.data.actions.DESPAIR}/>s</Trans>}, // target columns in the table, so we want to tell players about other errors first
		MANAFONT_BEFORE_DESPAIR: {priority: 30, message: <Trans id="blm.rotation-watchdog.error-messages.manafont-before-despair"><ActionLink {...this.data.actions.MANAFONT}/> used before <ActionLink {...this.data.actions.DESPAIR}/></Trans>},
		EXTRA_T3: {priority: 49, message: <Trans id="blm.rotation-watchdog.error-messages.extra-t3">Extra <ActionLink {...this.data.actions.THUNDER_III}/>s</Trans>}, // Extra T3 and Extra F1 are *very* similar in terms of per-GCD potency loss
		EXTRA_F1: {priority: 50, message: <Trans id="blm.rotation-watchdog.error-messages.extra-f1">Extra <ActionLink {...this.data.actions.FIRE_I}/></Trans>}, // These two codes should stay close to each other
		NO_FIRE_SPELLS: {priority: 75, message: <Trans id="blm.rotation-watchdog.error-messages.no-fire-spells">Rotation included no Fire spells</Trans>},
		DROPPED_ENOCHIAN: {priority: 100, message: <Trans id="blm.rotation-watchdog.error-messages.dropped-enochian">Dropped <ActionLink {...this.data.actions.ENOCHIAN}/></Trans>},
		DIED: {priority: DEATH_PRIORITY, message: <Trans id="blm.rotation-watchdog.error-messages.died"><ActionLink showName={false} {...this.data.actions.RAISE} /> Died</Trans>},
	}

	private cycleEndpointIds = CYCLE_ENDPOINTS.map(key => this.data.actions[key].id)

	private fireSpellIds = FIRE_SPELLS.map(key => this.data.actions[key].id)
	private currentRotation: Cycle = new Cycle(this.parser.pull.timestamp, this.currentGaugeState, this.data, this.fireSpellIds)
	private history: Cycle[] = []

	private firstEvent: boolean = true
	// counters for suggestions
	private uptimeSouls: number = 0

	override initialise() {
		this.addEventHook({type: 'action', source: this.parser.actor.id}, this.onCast)
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
			this.currentRotation.firePhaseMetadata.startTime = event.timestamp
			this.currentRotation.firePhaseMetadata.initialMP = this.actors.current.mp.current

			// Spread the current gauge state into the fire phase metadata for future reference
			this.currentRotation.firePhaseMetadata.initialGaugeState = {...this.currentGaugeState}
		}

		// If we no longer have enochian, flag it for display
		if (this.currentGaugeState.enochian && !nextGaugeState.enochian) {
			this.currentRotation.errorCode = this.CYCLE_ERRORS.DROPPED_ENOCHIAN
		}

		// Retrieve the GaugeState from the event
		this.currentGaugeState = {...nextGaugeState}
	}

	// Handle cast events and updated recording data accordingly
	private onCast(event: Events['action']) {
		const actionId = event.action

		// If this action is signifies the beginning of a new cycle, unless this is the first
		// cast of the log, stop the current cycle, and begin a new one. If Transposing from ice
		// to fire, keep this cycle going
		if (this.cycleEndpointIds.includes(actionId) && !this.firstEvent &&
			!(actionId === this.data.actions.TRANSPOSE.id && this.currentGaugeState.umbralIce > 0)) {
			this.startRecording(event)
		}

		// Add actions other than auto-attacks to the rotation cast list
		const action = this.data.getAction(actionId)

		if (!action  || action.autoAttack) {
			return
		}

		// Note that we've recorded our first GCD event once we have one
		if (this.firstEvent && action.onGcd) { this.firstEvent = false }

		this.currentRotation.addEvent({...event, isProc: this.procs.checkEventWasProc(event), gaugeContext: {...this.currentGaugeState}})

		if (actionId === this.data.actions.UMBRAL_SOUL.id && !this.invulnerability.isActive({types: ['invulnerable']})) {
			this.uptimeSouls++
		}
	}

	private onDeath() {
		this.currentRotation.errorCode = this.CYCLE_ERRORS.DIED
	}

	// Finish this parse and add the suggestions and checklist items
	private onComplete() {
		this.stopRecording(undefined)

		// Override the error code for cycles that dropped enochian, when the cycle contained an unabletoact time long enough to kill it.
		// Couldn't do this at the time of code assignment, since the downtime data wasn't fully available yet
		for (const cycle of this.history) {
			if (cycle.errorCode !== this.CYCLE_ERRORS.DROPPED_ENOCHIAN) { continue }

			const windows = this.unableToAct
				.getWindows({
					start: cycle.startTime,
					end: cycle.endTime,
				})
				.filter(window => Math.max(0, window.end - window.start) >= ASTRAL_UMBRAL_DURATION)

			if (windows.length > 0) {
				cycle.overrideErrorCode(this.CYCLE_ERRORS.FINAL_OR_DOWNTIME)
			}
		}

		// Re-check to see if any of the cycles that were tagged as missing Fire 4s were actually right before a downtime but the boss
		// became invunlnerable before another Fire 4 could've been cast. If so, mark it as a finalOrDowntime cycle, clear the error code
		// and reprocess it to see if there were any other errors
		this.history.forEach(cycle => {
			if (cycle.errorCode !== this.CYCLE_ERRORS.MISSING_FIRE4S) { return }
			const cycleEnd = cycle.endTime ?? (this.parser.pull.timestamp + this.parser.pull.duration)
			if (this.invulnerability.isActive({
				timestamp: cycleEnd + this.data.actions.FIRE_IV.castTime,
				types: ['invulnerable'],
			})) {
				cycle.finalOrDowntime = true
				cycle.overrideErrorCode(this.CYCLE_ERRORS.NONE)
				this.processCycle(cycle)
			}
		})

		// Suggestion for skipping B4 on rotations that are cut short by the end of the parse or downtime
		const shouldSkipB4s = this.history.filter(cycle => cycle.shouldSkipB4).length
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.FIRE_IV.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.should-skip-b4.content">
				You lost at least one <ActionLink {...this.data.actions.FIRE_IV}/> by not skipping <ActionLink {...this.data.actions.BLIZZARD_IV}/> in an Umbral Ice phase before the fight finished or a phase transition occurred.
			</Trans>,
			tiers: ENHANCED_SEVERITY_TIERS,
			value: shouldSkipB4s,
			why: <Trans id="blm.rotation-watchdog.suggestions.should-skip-b4.why">
				You should have skipped <ActionLink showIcon={false} {...this.data.actions.BLIZZARD_IV} /> <Plural value={shouldSkipB4s} one="# time" other="# times"/>.
			</Trans>,
		}))

		// Suggestion for skipping T3 on rotations that are cut short by the end of the parse or downtime
		const shouldSkipT3s = this.history.filter(cycle => cycle.shouldSkipT3).reduce<number>((sum, cycle) => sum + cycle.hardT3sInFireCount, 0)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.FIRE_IV.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.should-skip-t3.content">
				You lost at least one <ActionLink {...this.data.actions.FIRE_IV}/> by hard casting <ActionLink {...this.data.actions.THUNDER_III} /> before the fight finished or a phase transition occurred.
			</Trans>,
			tiers: ENHANCED_SEVERITY_TIERS,
			value: shouldSkipT3s,
			why: <Trans id="blm.rotation-watchdog.suggestions.should-skip-t3.why">
				You should have skipped <ActionLink showIcon={false} {...this.data.actions.THUNDER_III} /> <Plural value={shouldSkipT3s} one="# time" other="# times"/>.
			</Trans>,
		}))

		// Suggestion for unneccessary extra F1s
		const extraF1s = this.history.reduce<number>((sum, cycle) => sum + cycle.extraF1s, 0)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.FIRE_I.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.extra-f1s.content">
				Casting more than one <ActionLink {...this.data.actions.FIRE_I}/> per Astral Fire cycle is a crutch that should be avoided by better pre-planning of the encounter.
			</Trans>,
			tiers: DEFAULT_SEVERITY_TIERS,
			value: extraF1s,
			why: <Trans id="blm.rotation-watchdog.suggestions.extra-f1s.why">
				You cast an extra <ActionLink showIcon={false} {...this.data.actions.FIRE_I} /> <Plural value={extraF1s} one="# time" other="# times"/>.
			</Trans>,
		}))

		// Suggestion to end Astral Fires with Despair
		const astralFiresMissingDespairs = this.history.filter(cycle => cycle.missingDespairs && cycle.includeInSuggestions).length
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.DESPAIR.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.end-with-despair.content">
				Once you can no longer cast another spell in Astral Fire and remain above 800 MP, you should use your remaining MP by casting <ActionLink {...this.data.actions.DESPAIR} />.
			</Trans>,
			tiers: DEFAULT_SEVERITY_TIERS,
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
			tiers: ENHANCED_SEVERITY_TIERS,
			value: manafontsBeforeDespair,
			why: <Trans id="blm.rotation-watchdog.suggestions.mf-before-despair.why">
				<ActionLink showIcon={false} {...this.data.actions.MANAFONT} /> was used before <ActionLink {...this.data.actions.DESPAIR} /> <Plural value={manafontsBeforeDespair} one="# time" other="# times"/>.
			</Trans>,
		}))

		// Suggestion for hard T3s under AF. Should only have one per cycle
		const extraT3s = this.history.reduce<number>((sum, cycle) => sum + cycle.extraT3s, 0)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.THUNDER_III.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.wrong-t3.content">
				Don't hard cast more than one <ActionLink {...this.data.actions.THUNDER_III}/> in your Astral Fire phase, since that costs MP which could be used for more <ActionLink {...this.data.actions.FIRE_IV}/>s.
			</Trans>,
			tiers: DEFAULT_SEVERITY_TIERS,
			value: extraT3s,
			why: <Trans id="blm.rotation-watchdog.suggestions.wrong-t3.why">
				<ActionLink showIcon={false} {...this.data.actions.THUNDER_III} /> was hard casted under Astral Fire <Plural value={extraT3s} one="# extra time" other="# extra times"/>.
			</Trans>,
		}))

		// Suggestion not to icemage, but don't double-count it if they got cut short or we otherwise weren't showing it in the errors table
		const rotationsWithoutFire = this.history.filter(cycle => cycle.isMissingFire && cycle.includeInSuggestions && !cycle.finalOrDowntime).length
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.BLIZZARD_II.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.icemage.content">
				Avoid spending significant amounts of time in Umbral Ice. The majority of your damage comes from your Astral Fire phase, so you should maximize the number of <ActionLink {...this.data.actions.FIRE_IV}/>s cast during the fight.
			</Trans>,
			tiers: DEFAULT_SEVERITY_TIERS,
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
			tiers: DEFAULT_SEVERITY_TIERS,
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
		this.currentRotation = new Cycle(event.timestamp, this.currentGaugeState, this.data, this.fireSpellIds)
	}

	// End the current cycle, send it off to error processing, and add it to the history list
	private stopRecording(event: Events['action'] | undefined) {
		this.currentRotation.endTime = this.parser.currentEpochTimestamp
		// TODO: Replace this BS with core statuses once that's ported
		this.currentRotation.firePhaseMetadata.circleOfPowerPct =
			this.leylines.getStatusDurationInRange(this.data.statuses.CIRCLE_OF_POWER.id, this.currentRotation.firePhaseMetadata.startTime, this.currentRotation.endTime) /
			(this.currentRotation.endTime - this.currentRotation.firePhaseMetadata.startTime)

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
			currentRotation.errorCode = this.CYCLE_ERRORS.SHORT
			return
		}

		// Check for errors that apply for all cycles

		// Check if the rotation included the expected number of Despair casts
		if (currentRotation.missingDespairs) {
			currentRotation.errorCode = this.CYCLE_ERRORS.MISSING_DESPAIRS
		}

		// Check whether manafont was used before despair
		if (currentRotation.manafontBeforeDespair) {
			currentRotation.errorCode = this.CYCLE_ERRORS.MANAFONT_BEFORE_DESPAIR
		}

		// Check if the rotation included more than one Fire 1
		if (currentRotation.extraF1s > 0) {
			currentRotation.errorCode = this.CYCLE_ERRORS.EXTRA_F1
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
			currentRotation.errorCode = this.CYCLE_ERRORS.EXTRA_T3
		}

		// Why so icemage?
		if (currentRotation.isMissingFire) {
			currentRotation.errorCode = this.CYCLE_ERRORS.NO_FIRE_SPELLS
		}

		// If they're just missing Fire 4 because derp, note it
		if (currentRotation.missingFire4s) {
			currentRotation.errorCode = this.CYCLE_ERRORS.MISSING_FIRE4S
		}
	}

	// Process errors for a cycle that was cut short by downtime or by the fight ending
	private processDowntimeCycle(currentRotation: Cycle) {
		currentRotation.errorCode = this.CYCLE_ERRORS.FINAL_OR_DOWNTIME

		// Check if more Fire 4s could've been cast by skipping Blizzard 4 before this downtime
		if (currentRotation.shouldSkipB4) {
			currentRotation.errorCode = this.CYCLE_ERRORS.SHOULD_SKIP_B4
		}

		// Check if more Fire 4s could've been cast by skipping a hardcast Thunder 3
		if (currentRotation.hardT3sInFireCount > 0) {
			currentRotation.errorCode = this.CYCLE_ERRORS.SHOULD_SKIP_T3
		}
	}

	override output() {
		const outliers: Cycle[] = this.history.filter(cycle => cycle.errorCode.priority >
			HIDDEN_PRIORITY_THRESHOLD || DEBUG_SHOW_ALL_CYCLES)
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
