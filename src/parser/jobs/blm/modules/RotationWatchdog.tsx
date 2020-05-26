import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Checklist from 'parser/core/modules/Checklist'
import Combatants from 'parser/core/modules/Combatants'
import Enemies from 'parser/core/modules/Enemies'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import Suggestions, {SEVERITY, Suggestion, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import UnableToAct from 'parser/core/modules/UnableToAct'

import {EntityStatuses} from 'parser/core/modules/EntityStatuses'
import DISPLAY_ORDER from './DISPLAY_ORDER'
import {FIRE_SPELLS} from './Elements'
import {BLM_GAUGE_EVENT, BLMGaugeEvent} from './Gauge'

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
const CYCLE_ERRORS = {
	NONE: {priority: 0, message: 'No errors'},
	FINAL_OR_DOWNTIME: {priority: 1, message: 'Ended with downtime, or last cycle'},
	SHORT: {priority: 2, message: 'Too short, won\'t process'},
	// Messages below should be Trans objects since they'll be displayed to end users
	MISSING_FIRE4S: {priority: 10, message: <Trans id="blm.rotation-watchdog.error-messages.missing-fire4s">Missing one or more <ActionLink {...ACTIONS.FIRE_IV}/>s</Trans>}, // These two errors are lower priority since they can be determined by looking at the
	MISSING_DESPAIRS: {priority: 15, message: <Trans id="blm.rotation-watchdog.error-messages.missing-despair">Missing one or more <ActionLink {...ACTIONS.DESPAIR}/>s</Trans>}, // target columns in the table, so we want to tell players about other errors first
	MANAFONT_BEFORE_DESPAIR: {priority: 30, message: <Trans id="blm.rotation-watchdog.error-messages.manafont-before-despair"><ActionLink {...ACTIONS.MANAFONT}/> used before <ActionLink {...ACTIONS.DESPAIR}/></Trans>},
	EXTRA_T3: {priority: 49, message: <Trans id="blm.rotation-watchdog.error-messages.extra-t3">Extra <ActionLink {...ACTIONS.THUNDER_III}/>s</Trans>}, // Extra T3 and Extra F1 are *very* similar in terms of per-GCD potency loss
	EXTRA_F1: {priority: 50, message: <Trans id="blm.rotation-watchdog.error-messages.extra-f1">Extra <ActionLink {...ACTIONS.FIRE_I}/></Trans>}, // These two codes should stay close to each other
	NO_FIRE_SPELLS: {priority: 75, message: <Trans id="blm.rotation-watchdog.error-messages.no-fire-spells">Rotation included no Fire spells</Trans>},
	DROPPED_ENOCHIAN: {priority: 100, message: <Trans id="blm.rotation-watchdog.error-messages.dropped-enochian">Dropped <ActionLink {...ACTIONS.ENOCHIAN}/></Trans>},
	DIED: {priority: 101, message: <Trans id="blm.rotation-watchdog.error-messages.died"><ActionLink showName={false} {...ACTIONS.RAISE} /> Died</Trans>},
}

class Cycle {
	// TS CastEvent Ability interface doesn't include the overrideAbility property that BLM Procs sets to denote T3P/F3P
	casts: TODO[] = []
	startTime: number
	endTime?: number

	hasManafont: boolean = false

	inFirePhase: boolean = false
	atypicalAFStart: boolean = false
	firePhaseStartMP: number = 0

	finalOrDowntime: boolean = false

	gaugeStateBeforeFire: GaugeState = new GaugeState()

	_errorCode: {priority: number, message: TODO} = CYCLE_ERRORS.NONE
	public set errorCode(code) {
		if (code.priority > this._errorCode.priority) {
			this._errorCode = code
		}
	}
	public get errorCode() {
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
		let expectedCount = (this.gaugeStateBeforeFire.umbralHearts === 0 && this.casts.filter(cast => cast.ability.guid === ACTIONS.FIRE_I.id).length === 0)
			? NO_UH_EXPECTED_FIRE4 : EXPECTED_FIRE4

		/**
		 * A bit hacky but, when we are in the opener and start with F3 it will be the only cycle that doesn't include any B3, Freeze, US.
		 * Since we are in the opener, and specifically opening with F3, we are doing the (mod) Jp Opener, which drops the expected count by 1
		 */
		expectedCount -= (this.casts.filter(cast => CYCLE_ENDPOINTS.includes(cast.ability.guid)).length === 0 ? 1 : 0)
		// Adjust expected count if the cycle included manafont
		expectedCount += this.hasManafont ? FIRE4_FROM_MANAFONT : 0

		return expectedCount
	}
	public get actualFire4s(): number {
		return this.casts.filter(cast => cast.ability.guid === ACTIONS.FIRE_IV.id).length
	}
	public get missingFire4s(): number | undefined {
		if (!this.expectedFire4s) { return }
		return Math.max(this.expectedFire4s - this.actualFire4s, 0)
	}

	public get expectedDespairs(): number {
		return this.hasManafont ? 2 : 1
	}
	public get actualDespairs(): number {
		return this.casts.filter(cast => cast.ability.guid === ACTIONS.DESPAIR.id).length
	}
	public get missingDespairs(): number {
		return Math.max(this.expectedDespairs - this.actualDespairs, 0)
	}

	constructor(start: number, gaugeState: GaugeState) {
		this.startTime = start
		// Object.assign because this needs to be a by-value assignment, not by-reference
		this.gaugeStateBeforeFire = Object.assign(this.gaugeStateBeforeFire, gaugeState)
	}

	public overrideErrorCode(code: {priority: number, message: TODO}) {
		this._errorCode = code
	}
}

// typedef for the subset of the data contained in BLMGaugeEvent that we're going to keep track of for suggestions
class GaugeState {
	astralFire: number = 0
	umbralIce: number = 0
	umbralHearts: number = 0
	enochian: boolean = false
}

export default class RotationWatchdog extends Module {
	static handle = 'RotationWatchdog'
	static title = t('blm.rotation-watchdog.title')`Rotation Outliers`
	static displayOrder = DISPLAY_ORDER.ROTATION

	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions
	@dependency private invuln!: Invulnerability
	@dependency private enemies!: Enemies
	@dependency private timeline!: Timeline
	@dependency private combatants!: Combatants
	@dependency private unableToAct!: UnableToAct
	@dependency private entityStatuses!: EntityStatuses

	private currentGaugeState: GaugeState = new GaugeState()
	private currentRotation: Cycle = new Cycle(this.parser.fight.start_time, this.currentGaugeState)
	private history: Cycle[] = []

	private firstEvent = true
	// counters for suggestions
	private missedF4s = 0
	private extraF1s = 0
	private extraT3s = 0
	private rotationsWithoutFire = 0
	private manafontBeforeDespair = 0
	private astralFiresMissingDespairs = 0
	private primaryTargetId?: number

	protected init() {
		this.addEventHook('cast', {by: 'player'}, this.onCast)
		this.addEventHook('complete', this.onComplete)
		this.addEventHook(BLM_GAUGE_EVENT, this.onGaugeEvent)
		this.addEventHook('death', {to: 'player'}, this.onDeath)
	}

	// Handle events coming from BLM's Gauge module
	private onGaugeEvent(event: BLMGaugeEvent) {
		// If we're beginning the fire phase of this cycle, note it and save some data
		if (this.currentGaugeState.astralFire === 0 && event.astralFire > 0) {
			this.currentRotation.inFirePhase = true
			this.currentRotation.firePhaseStartMP = this.combatants.selected.resources.mp

			// If we didn't enter fire phase with a normal gauge state of 3 UI/UH stacks, note it
			if (this.currentRotation.gaugeStateBeforeFire.umbralIce !== AF_UI_BUFF_MAX_STACK ||
				this.currentRotation.gaugeStateBeforeFire.umbralHearts !== AF_UI_BUFF_MAX_STACK) {
				this.currentRotation.atypicalAFStart = true
			}
		}

		// If we no longer have enochian, flag it for display
		if (this.currentGaugeState.enochian && !event.enochian) {
			this.currentRotation.errorCode = CYCLE_ERRORS.DROPPED_ENOCHIAN
		}

		// Retrieve the GaugeState from the event
		this.currentGaugeState.astralFire = event.astralFire
		this.currentGaugeState.umbralIce = event.umbralIce
		this.currentGaugeState.umbralHearts = event.umbralHearts
		this.currentGaugeState.enochian = event.enochian

		// If we're in fire phase, stop processing
		if (this.currentRotation.inFirePhase) {
			return
		}

		// If we're in ice phase, set the current gauge state into the pre-fire cache for later recording
		// Still need by-value assignment here
		this.currentRotation.gaugeStateBeforeFire = Object.assign(this.currentRotation.gaugeStateBeforeFire, this.currentGaugeState)
	}

	// Handle cast events and updated recording data accordingly
	private onCast(event: CastEvent) {
		const actionId = event.ability.guid

		// If this action is signifies the beginning of a new cycle, unless this is the first
		// cast of the log, stop the current cycle, and begin a new one. If Transposing from ice
		// to fire, keep this cycle going
		if (CYCLE_ENDPOINTS.includes(actionId) && !this.firstEvent &&
			!(actionId === ACTIONS.TRANSPOSE.id && this.currentGaugeState.umbralIce > 0)) {
			this.startRecording(event)
		}

		// Add actions other than auto-attacks to the rotation cast list
		const action = getDataBy(ACTIONS, 'id', actionId) as TODO

		if (!action  || action.autoAttack) {
			return
		}

		// Note that we've recorded our first damage event once we have one
		if (this.firstEvent && action.onGcd) { this.firstEvent = false }

		this.currentRotation.casts.push(event)

		// If this is manafont, note that we used it so we don't have to cast.filter(...).length to find out
		if (actionId === ACTIONS.MANAFONT.id) {
			this.currentRotation.hasManafont = true
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
		this.history.filter(cycle => cycle.errorCode === CYCLE_ERRORS.DROPPED_ENOCHIAN).forEach(cycle => {
			if (this.unableToAct.getDowntimes(cycle.startTime, cycle.endTime).filter(downtime => Math.max(0, downtime.end - downtime.start) >= ASTRAL_UMBRAL_DURATION).length > 0) {
				cycle.overrideErrorCode(CYCLE_ERRORS.FINAL_OR_DOWNTIME)
			}
		})

		// Suggestion for skipping B4 on rotations that are cut short by the end of the parse or downtime
		if (this.missedF4s) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.FIRE_IV.icon,
				content: <Trans id="blm.rotation-watchdog.suggestions.missed-f4s.content">
					You lost at least one <ActionLink {...ACTIONS.FIRE_IV}/> by not skipping <ActionLink {...ACTIONS.BLIZZARD_IV}/> in the Umbral Ice phase before the fight finished.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="blm.rotation-watchdog.suggestions.missed-f4s.why">
					<Plural value={this.missedF4s} one="# Fire IV was" other="# Fire IVs were"/> missed.
				</Trans>,
			}))
		}

		// Suggestion for unneccessary extra F1s
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.FIRE_I.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.extra-f1s.content">
				Casting more than one <ActionLink {...ACTIONS.FIRE_I}/> per Astral Fire cycle is a crutch that should be avoided by better pre-planning of the encounter.
			</Trans>,
			tiers: ISSUE_SEVERITY_TIERS,
			value: this.extraF1s,
			why: <Trans id="blm.rotation-watchdog.suggestions.extra-f1s.why">
				<Plural value={this.extraF1s} one="# extra Fire I was" other="# extra Fire Is were"/> cast.
			</Trans>,
		}))

		// Suggestion to end Astral Fires with Despair
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.DESPAIR.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.end-with-despair.content">
				Once you can no longer cast another spell in Astral Fire and remain above 800 MP, you should use your remaining MP by casting <ActionLink {...ACTIONS.DESPAIR} />.
			</Trans>,
			tiers: ISSUE_SEVERITY_TIERS,
			value: this.astralFiresMissingDespairs,
			why: <Trans id="blm.rotation-watchdog.suggestions.end-with-despair.why">
				<Plural value={this.astralFiresMissingDespairs} one="# Astral Fire phase was" other="# Astral Fire phases were"/> missing at least one <ActionLink showIcon={false} {...ACTIONS.DESPAIR} />.
			</Trans>,
		}))

		// Suggestion to not use Manafont before Despair
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.MANAFONT.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.mf-before-despair.content">
				Using <ActionLink {...ACTIONS.MANAFONT} /> before <ActionLink {...ACTIONS.DESPAIR} /> leads to fewer <ActionLink showIcon={false} {...ACTIONS.DESPAIR} />s than possible being cast. Try to avoid that since <ActionLink showIcon={false} {...ACTIONS.DESPAIR} /> is stronger than <ActionLink {...ACTIONS.FIRE_IV} />.
			</Trans>,
			tiers: { // Special severity tiers, since there's only so many times manafont can be used in a fight
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: this.manafontBeforeDespair,
			why: <Trans id="blm.rotation-watchdog.suggestions.mf-before-despair.why">
				<Plural value={this.manafontBeforeDespair} one="# Manafont was" other="# Manafonts were"/> used before <ActionLink {...ACTIONS.DESPAIR} />.
			</Trans>,
		}))

		// Suggestion for hard T3s under AF. Should only have one per cycle
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.THUNDER_III_FALSE.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.wrong-t3.content">
				Don't hard cast more than one <ActionLink {...ACTIONS.THUNDER_III}/> in your Astral Fire phase, since that costs MP which could be used for more <ActionLink {...ACTIONS.FIRE_IV}/>s.
			</Trans>,
			tiers: ISSUE_SEVERITY_TIERS,
			value: this.extraT3s,
			why: <Trans id="blm.rotation-watchdog.suggestions.wrong-t3.why">
				<Plural value={this.extraT3s} one="# extra Thunder III was" other="# extra Thunder IIIs were"/> hard casted under Astral Fire.
			</Trans>,
		}))

		// Suggestion not to icemage... :(
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.BLIZZARD_II.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.icemage.content">
				Avoid spending significant amounts of time in Umbral Ice. The majority of your damage comes from your Astral Fire phase, so you should maximize the number of <ActionLink {...ACTIONS.FIRE_IV}/>s cast during the fight.
			</Trans>,
			tiers: ISSUE_SEVERITY_TIERS,
			value: this.rotationsWithoutFire,
			why: <Trans id="blm.rotation-watchdog.suggestions.icemage.why">
				<Plural value={this.rotationsWithoutFire} one="# rotation was" other="# rotations were"/> performed with no fire spells.
			</Trans>,
		}))
	}

	// Complete the previous cycle and start a new one
	private startRecording(event: CastEvent) {
		this.stopRecording(event)
		// Pass in whether we've seen the first cycle endpoint to account for pre-pull buff executions (mainly Sharpcast)
		this.currentRotation = new Cycle(event.timestamp, this.currentGaugeState)
	}

	// End the current cycle, send it off to error processing, and add it to the history list
	private stopRecording(event: CastEvent | undefined) {
		this.currentRotation.endTime = this.parser.currentTimestamp

		// If an event object wasn't passed, or the event was a transpose that occurred during downtime,
		// treat this as a rotation that ended with some kind of downtime
		if (!event || (event && event.ability.guid === ACTIONS.TRANSPOSE.id &&
			this.invuln.isUntargetable('all', event.timestamp))) {
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
		if (currentRotation.casts.length <= MIN_ROTATION_LENGTH) {
			currentRotation.errorCode = CYCLE_ERRORS.SHORT
			return
		}

		// Check for errors that apply for all cycles

		// Check if the rotation included the expected number of Despair casts
		if (currentRotation.missingDespairs) {
			this.astralFiresMissingDespairs++
			currentRotation.errorCode = CYCLE_ERRORS.MISSING_DESPAIRS
		}

		// Check whether manafont was used before despair
		if (currentRotation.hasManafont && currentRotation.actualDespairs > 0 &&
			currentRotation.casts.findIndex(cast => cast.ability.guid === ACTIONS.MANAFONT.id) <
			currentRotation.casts.findIndex(cast => cast.ability.guid === ACTIONS.DESPAIR.id)) {
			this.manafontBeforeDespair++
			currentRotation.errorCode = CYCLE_ERRORS.MANAFONT_BEFORE_DESPAIR
		}

		// Check if the rotation included more than one Fire 1
		const fire1Count = currentRotation.casts.filter(cast => cast.ability.guid === ACTIONS.FIRE_I.id).length
		if (fire1Count > 1) {
			currentRotation.errorCode = CYCLE_ERRORS.EXTRA_F1
			this.extraF1s += Math.max(0, fire1Count-1)
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
		const hardT3Count = currentRotation.casts.filter(cast => cast.ability.overrideAction)
			.filter(cast => cast.ability.overrideAction.id === ACTIONS.THUNDER_III_FALSE.id).length
		if (hardT3Count > 1 || (hardT3Count > 0 && currentRotation.firePhaseStartMP < MIN_MP_FOR_FULL_ROTATION)) {
			this.extraT3s++
			currentRotation.errorCode = CYCLE_ERRORS.EXTRA_T3
		}

		// Why so icemage?
		if (!currentRotation.casts.filter(cast => FIRE_SPELLS.includes(cast.ability.guid)).length) {
			this.rotationsWithoutFire++
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
		if (currentRotation.gaugeStateBeforeFire.umbralHearts > 0 && currentRotation.missingFire4s === 2) {
			this.missedF4s++
		}

		// TODO: Check for hardcast T3s, if this cycle ends in downtime, that cast time should've been a fire spell
	}

	output() {
		const outliers: Cycle[] = this.history.filter(cycle => cycle.errorCode.priority >
			CYCLE_ERRORS.SHORT.priority || DEBUG_SHOW_ALL_CYCLES)
		if (outliers.length > 0 ) {
			return <Fragment>
				<Message>
					<Trans id="blm.rotation-watchdog.rotation-table.message">
						The core of BLM consists of six <ActionLink {...ACTIONS.FIRE_IV} />s and one <ActionLink {...ACTIONS.DESPAIR} /> per rotation (seven <ActionLink {...ACTIONS.FIRE_IV} />s and two <ActionLink {...ACTIONS.DESPAIR} />s with <ActionLink {...ACTIONS.MANAFONT} />).<br/>
						Avoid missing Fire IV casts where possible.
					</Trans>
				</Message>
				<Message warning icon>
					<Icon name="warning sign"/>
					<Message.Content>
						<Trans id="blm.rotation-watchdog.rotation-table.disclaimer">This module assumes you are following the standard BLM playstyle.<br/>
							If you are following the AI playstyle, this report and many of the suggestions may not be applicable.
						</Trans>
					</Message.Content>
				</Message>
				<RotationTable
					targets={[
						{
							header: <ActionLink showName={false} {...ACTIONS.FIRE_IV} />,
							accessor: 'fire4s',
						},
						{
							header: <ActionLink showName={false} {...ACTIONS.DESPAIR} />,
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
							start: cycle.startTime - this.parser.fight.start_time,
							end: cycle.endTime != null ?
								cycle.endTime - this.parser.fight.start_time :
								cycle.startTime - this.parser.fight.start_time,
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
							rotation: cycle.casts,
						})
					})}
					onGoto={this.timeline.show}
				/>
			</Fragment>
		}
	}
}
