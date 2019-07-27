// Handle parsing each rotation. Confirm rotations have at least 8 F4 per Convert cycle and 6 F4 per normal cycle (or 5 F4 for non-Heart cycle)
// Flag rotations that do not and list those as warnings

import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import React, {Fragment} from 'react'
import {Accordion, Message} from 'semantic-ui-react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {Ability, CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import Enemies from 'parser/core/modules/Enemies'
import Invulnerability from 'parser/core/modules/Invulnerability'
import Suggestions, {SEVERITY, Suggestion, TieredSuggestion} from 'parser/core/modules/Suggestions'
import Timeline from 'parser/core/modules/Timeline'

import DISPLAY_ORDER from './DISPLAY_ORDER'
import Gauge, {BLM_GAUGE_EVENT} from './Gauge'

const EXPECTED_FIRE4 = 6
const FIRE4_FROM_MANAFONT = 1
const DEBUG_LOG_ALL_FIRE_COUNTS = false && process.env.NODE_ENV !== 'production'
const AFUIBUFFMAXSTACK = 3
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

// This is feelycraft at the moment. Rotations longer than that get put into the history array to sort out transpose shenanigans.
// TODO: consider downtime and do something with it. Like throwing out the rotation or godknows.
const MIN_ROTATION_LENGTH = 3

class Cycle {
	casts: any[] = []
	startTime: number
	endTime?: number

	missingFire4s: number = 0
	expectedFire4s: number = 0

	fire4Count: number = 0

	buffsLocked: boolean = false
	cycleComplete: boolean = false
	inFirePhase: boolean = false

	firePhaseStartMP: number = 0
	atypicalAFStartId: number = 0

	gaugeStateBeforeFire: GaugeState

	/*public get expectedFire4s(): number {
		const hasManafont =
		let expected = EXPECTED_FIRE4 + (hasManafont ? FIRE4_FROM_MANAFONT : 0)
		if (this._atypicalAFStartId.toString() === ACTIONS.FIRE_III_PROC.id || (this._umbralIceBeforeFire === AFUIBUFFMAXSTACK && this._atypicalAFStartId === ACTIONS.FIRE_III.id)) {
			// If we arrived in Astral Fire from UI3 normally or via F3P, but didn't have 2 or 3 hearts, we lose a F4
			if (this.currentRotation.gaugeStateBeforeFire.umbralHearts < AFUIBUFFMAXSTACK) {
				expected--
			}
			if (this.currentRotation.gaugeStateBeforeFire.umbralHearts === 0) {
				expected--
			}
		} else if (this._umbralIceBeforeFire > 0 || this._atypicalAFStartId) { // If we came from Ice other than UI3, we're probably losing Fire 4s
			// If we don't have max hearts, we lose at least one cast
			if (this.currentRotation.gaugeStateBeforeFire.umbralHearts < AFUIBUFFMAXSTACK) {
				expected--
			}
			// If we have no hearts, we lose another one :(
			if (this.currentRotation.gaugeStateBeforeFire.umbralHearts === 0) {
				expected--
			}
			// If we started the fire phase with a Fire 3 hardcast not under ice (ie. AF1 b/c of Transpose), we lose a cast.
			if (this._atypicalAFStartId) {
				expected--
			}
		} else { // If we entered AF raw, we're losing two F4s
			expected -= 2
		}

		const missing = expected - count
		return {missing, expected}
	}*/

	constructor(start: number, gaugeState: GaugeState) {
		this.startTime = start,
		this.gaugeStateBeforeFire = gaugeState
	}
}

class GaugeState {
	astralFire: number = 0
	umbralIce: number = 0
	umbralHearts: number = 0
}

interface OverrideableAbility extends Ability {
	overrideAction?: any
}

export default class RotationWatchdoggier extends Module {
	static handle = 'RotationWatchdoggier'
	static title = t('blm.rotation-watchdog.title')`Rotation Outliers`
	static displayOrder = DISPLAY_ORDER.ROTATION

	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions
	@dependency private invuln!: Invulnerability
	@dependency private enemies!: Enemies
	@dependency private timeline!: Timeline
	@dependency private gauge!: Gauge

	private currentGaugeState: GaugeState = new GaugeState()
	private beginCastGaugeState: GaugeState = new GaugeState()
	private currentRotation: Cycle = new Cycle(this.parser.fight.start_time, this.currentGaugeState)
	private outliers: Cycle[] = []

	// check for buffs
	_lastStop = false
	private firstEvent = true
	// counter for suggestions
	_missedF4s = 0
	_extraF1s = 0
	_UIEndingInT3 = 0
	_missedF4sCauseEndingInT3 = 0
	_extraT3s = 0
	_rotationsWithoutFire = 0
	_umbralIceBeforeFire = 0
	_mfBeforeDespair = 0
	_astralFiresNotEndedWithDespair = 0

	protected init() {
		this.addHook('begincast', {by: 'player'}, this.onBeginCast)
		this.addHook('cast', {by: 'player'}, this.onCast)
		this.addHook('complete', this.onComplete)
		this.addHook(BLM_GAUGE_EVENT, this.onGaugeEvent)
	}

	private onGaugeEvent(event: any) {
		this.currentGaugeState.astralFire = event.astralFire
		this.currentGaugeState.umbralIce = event.umbralIce
		this.currentGaugeState.umbralHearts = event.umbralHearts

		// Keep track of how many UI stacks we had upon entering AF, affects expected F4 counts for the cycle
		if (!this.currentRotation.inFirePhase) {
			this.currentRotation.gaugeStateBeforeFire = this.currentGaugeState
		}
	}

	// snapshot buffs and UH at the beginning of your recording
	private onBeginCast(event: CastEvent) {
		this.beginCastGaugeState = this.currentGaugeState
	}

	private onCast(event: CastEvent) {
		const actionId = event.ability.guid
		const eventAbility: OverrideableAbility = event.ability
		// If we're gaining AF3 from an F3P, count it as the beginning of the phase for F4 count purposes
		if (actionId === ACTIONS.FIRE_III.id && !this.currentRotation.inFirePhase) {
			this.currentRotation.inFirePhase = true
			if (this.currentRotation.gaugeStateBeforeFire.umbralIce !== AFUIBUFFMAXSTACK) {
				if (eventAbility.overrideAction) {
					this.currentRotation.atypicalAFStartId = eventAbility.overrideAction.id
				} else {
					this.currentRotation.atypicalAFStartId = ACTIONS.FIRE_III.id
				}
			}
		}

		// If this action is signifies the beginning of a new cycle, unless this is the first
		// cast of the log, stop the current cycle, and begin a new one
		if (CYCLE_ENDPOINTS.includes(actionId) && !this.firstEvent) {
			this._stopRecording()
			this._startRecording(event)
		}
		if (this.firstEvent) { this.firstEvent = false }

		// Add actions other than auto-attacks to the rotation cast list
		const action = getDataBy(ACTIONS, 'id', actionId) as any
		if (action && !action.autoAttack) {
			this.currentRotation.casts.push(event)
		}
	}

	_getThunderUptime() {
		const statusTime = this.enemies.getStatusUptime(STATUSES.THUNDER_III.id)
		const uptime = this.parser.fightDuration - this.invuln.getInvulnerableUptime()

		return (statusTime / uptime) * 100
	}

	private onComplete() {
		this._lastStop = true
		this._stopRecording()
		// writing a suggestion to skip B4 end of fight.
		if (this._missedF4s) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.FIRE_IV.icon,
				content: <Trans id="blm.rotation-watchdog.suggestions.missed-f4s.content">
					You lost at least  one <ActionLink {...ACTIONS.FIRE_IV}/> by not skipping <ActionLink {...ACTIONS.BLIZZARD_IV}/> in the Umbral Ice phase before the fight finished.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="blm.rotation-watchdog.suggestions.missed-f4s.why">
					<Plural value={this._missedF4s} one="# Fire IV was" other="# Fire IVs were"/> missed.
				</Trans>,
			}))
		}

		// suggestion for unneccessary extra F1s.
		// TODO: make severity based on fight length instead of static
		if (this._extraF1s) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.FIRE_I.icon,
				content: <Trans id="blm.rotation-watchdog.suggestions.extra-f1s.content">
					Casting more than one <ActionLink {...ACTIONS.FIRE_I}/> per Astral Fire cycle is a crutch that should be avoided by better pre-planning of the encounter.
				</Trans>,
				severity: (this._extraF1s > 1 ? SEVERITY.MEDIUM : SEVERITY.MINOR),
				why: <Trans id="blm.rotation-watchdog.suggestions.extra-f1s.why">
					<Plural value={this._extraF1s} one="# extra Fire I was" other="# extra Fire Is were"/> cast.
				</Trans>,
			}))
		}

		// Suggestion to end Astral Fires with Despair
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.DESPAIR.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.end-with-despair.content">
				Casting <ActionLink {...ACTIONS.BLIZZARD_III} /> to enter Umbral Ice costs no MP. Always end Astral Fire with a <ActionLink {...ACTIONS.DESPAIR} /> to make full use of your MP.
			</Trans>,
			tiers: ISSUE_SEVERITY_TIERS,
			value: this._astralFiresNotEndedWithDespair,
			why: <Trans id="blm.rotation-watchdog.suggestions.end-with-despair.why">
				<Plural value={this._astralFiresNotEndedWithDespair} one="# Astral Fire phase" other="# Astral Fire phases"/> ended with a spell other than <ActionLink {...ACTIONS.DESPAIR} />.
			</Trans>,
		}))

		// Suggestion to not use manafont before Despair
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.MANAFONT.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.mf-before-despair.content">
				Using <ActionLink {...ACTIONS.MANAFONT} /> before <ActionLink {...ACTIONS.DESPAIR} /> leads to fewer <ActionLink {...ACTIONS.DESPAIR} />s than possible being cast. Try to avoid that since <ActionLink {...ACTIONS.DESPAIR} /> is stronger than <ActionLink {...ACTIONS.FIRE_IV} />.
			</Trans>,
			tiers: { // Special severity tiers, since there's only so many times manafont can be used in a fight
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: this._mfBeforeDespair,
			why: <Trans id="blm.rotation-watchdog.suggestions.mf-before-despair.why">
				<Plural value={this._mfBeforeDespair} one="# Manafont was" other="# Manafonts were"/> used before <ActionLink {...ACTIONS.DESPAIR} />.
			</Trans>,
		}))

		// Suggestion for hard T3s under AF. Should only have one per cycle
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.THUNDER_III_FALSE.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.wrong-t3.content">
				Don't hard cast more than one <ActionLink {...ACTIONS.THUNDER_III}/> in your Astral Fire phase, since that costs MP which could be used for more <ActionLink {...ACTIONS.FIRE_IV}/>s.
			</Trans>,
			tiers: ISSUE_SEVERITY_TIERS,
			value: this._extraT3s,
			why: <Trans id="blm.rotation-watchdog.suggestions.wrong-t3.why">
				<Plural value={this._extraT3s} one="# extra Thunder III was" other="# extra Thunder IIIs were"/> hard casted under Astral Fire.
			</Trans>,
		}))

		// Suggestion not to icemage... :(
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.BLIZZARD_II.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.icemage.content">
				Avoid spending significant amounts of time in Umbral Ice. The majority of your damage comes from your Astral Fire phase, so you should maximize the number of <ActionLink {...ACTIONS.FIRE_IV}/>s cast during the fight.
			</Trans>,
			tiers: ISSUE_SEVERITY_TIERS,
			value: this._rotationsWithoutFire,
			why: <Trans id="blm.rotation-watchdog.suggestions.icemage.why">
				<Plural value={this._rotationsWithoutFire} one="# rotation was" other="# rotations were"/> performed with no fire spells.
			</Trans>,
		}))

		this.checklist.add(new Rule({
			name: <Trans id="blm.rotation-watchdog.checklist.dots.name">Keep your <StatusLink {...STATUSES.THUNDER_III} /> DoT up</Trans>,
			description: <Trans id="blm.rotation-watchdog.checklist.dots.description">
				Your <StatusLink {...STATUSES.THUNDER_III} /> DoT contributes significantly to your overall damage, both on its own, and from additional <StatusLink {...STATUSES.THUNDERCLOUD} /> procs. Try to keep the DoT applied.
			</Trans>,
			target: 95,
			requirements: [
				new Requirement({
					name: <Fragment><StatusLink {...STATUSES.THUNDER_III} /> uptime</Fragment>,
					percent: () => this._getThunderUptime(),
				}),
			],
		}))
	}

	_startRecording(event: any) {
		this.currentRotation = new Cycle(event.timestamp, this.currentGaugeState)
	}

	_stopRecording() {
		this.currentRotation.endTime = this.parser.currentTimestamp
		// TODO: Use a better trigger for downtime than transpose
		// TODO: Handle aoe things
		// TODO: Handle Flare?
		const fire4Count = this.currentRotation.casts.filter(cast => cast.ability.guid === ACTIONS.FIRE_IV.id).length
		const fire1Count = this.currentRotation.casts.filter(cast => cast.ability.guid === ACTIONS.FIRE_I.id).length
		const despairCount = this.currentRotation.casts.filter(cast => cast.ability.guid === ACTIONS.DESPAIR.id).length
		const hasManafont = this.currentRotation.casts.filter(cast => cast.ability.guid === ACTIONS.MANAFONT.id).length > 0
		const lastEvent = this.currentRotation.casts[this.currentRotation.casts.length-1]

		const hardT3Count = this.currentRotation.casts.filter(cast => cast.ability.overrideAction).filter(cast => cast.ability.overrideAction.id === ACTIONS.THUNDER_III_FALSE.id).length
		if (hardT3Count > 1) {
			this._extraT3s++
		}
		// check whether manafont was used before despair
		if (hasManafont) {
			if (despairCount > 0) {
				if (this.currentRotation.casts.findIndex(cast => cast.ability.guid === ACTIONS.MANAFONT.id) < this.currentRotation.casts.findIndex(cast => cast.ability.guid === ACTIONS.DESPAIR.id)) {
					this._mfBeforeDespair++
				}
			}
		}
		const missingCount = this._getMissingFire4Count(fire4Count, hasManafont)
		this.currentRotation.missingFire4s = missingCount.missing
		this.currentRotation.expectedFire4s = missingCount.expected

		this._extraF1s += Math.max(0, fire1Count-1)

		if (this.currentRotation.missingFire4s !== 0 || hardT3Count > 1 || DEBUG_LOG_ALL_FIRE_COUNTS) {
			this.currentRotation.fire4Count = fire4Count

			// Only display rotations with more than 3 casts since less is normally weird shit with Transpose
			// Also throw out rotations with no Fire spells
			const fire3Count = this.currentRotation.casts.filter(cast => cast.ability.guid === ACTIONS.FIRE_III.id).length
			const fireCount = fire3Count + fire1Count + fire4Count + despairCount
			if (fireCount === 0 && this.currentRotation.casts.length > 1) {
				this._rotationsWithoutFire++
			}
			if (this.currentRotation.casts.length > MIN_ROTATION_LENGTH && fireCount >= 1) {
				// check if the rotation ended with despair
				if (lastEvent && lastEvent.ability.guid !== ACTIONS.DESPAIR.id) {
					this._astralFiresNotEndedWithDespair++
				}
				this.outliers.push(this.currentRotation)
			}
			if (this._lastStop && this.currentGaugeState.umbralHearts > 0 && this.currentRotation.missingFire4s === 2) {
				const missedF4s = this.currentRotation.missingFire4s --
				this._missedF4s = missedF4s
			}
		}
	}

	_getMissingFire4Count(count: number, hasManafont: boolean) {
		let expected = EXPECTED_FIRE4 + (hasManafont ? FIRE4_FROM_MANAFONT : 0)
		if (this.currentRotation.atypicalAFStartId.toString() === ACTIONS.FIRE_III_PROC.id || (this._umbralIceBeforeFire === AFUIBUFFMAXSTACK && this.currentRotation.atypicalAFStartId === ACTIONS.FIRE_III.id)) {
			// If we arrived in Astral Fire from UI3 normally or via F3P, but didn't have 2 or 3 hearts, we lose a F4
			if (this.currentRotation.gaugeStateBeforeFire.umbralHearts < AFUIBUFFMAXSTACK) {
				expected--
			}
			if (this.currentRotation.gaugeStateBeforeFire.umbralHearts === 0) {
				expected--
			}
		} else if (this._umbralIceBeforeFire > 0 || this.currentRotation.atypicalAFStartId) { // If we came from Ice other than UI3, we're probably losing Fire 4s
			// If we don't have max hearts, we lose at least one cast
			if (this.currentRotation.gaugeStateBeforeFire.umbralHearts < AFUIBUFFMAXSTACK) {
				expected--
			}
			// If we have no hearts, we lose another one :(
			if (this.currentRotation.gaugeStateBeforeFire.umbralHearts === 0) {
				expected--
			}
			// If we started the fire phase with a Fire 3 hardcast not under ice (ie. AF1 b/c of Transpose), we lose a cast.
			if (this.currentRotation.atypicalAFStartId) {
				expected--
			}
		} else { // If we entered AF raw, we're losing two F4s
			expected -= 2
		}

		const missing = expected - count
		return {missing, expected}
	}

	private renderCount(count: number, missing: number) {
		if (missing > 1) {
			return <span className="text-error">{count}</span>
		}
		if (missing > 0) {
			return <span className="text-warning">{count}</span>
		}
		if (missing < 0) {
			return <span className="text-success">{count+'!'}</span>
		}
		return count
	}

	output() {
		if (this.outliers.length > 0 ) {
			return <Fragment>
				<Message>
					<Trans id="blm.rotation-watchdog.accordion.message">
						The core of BLM consists of 6 <ActionLink {...ACTIONS.FIRE_IV} />s and one <ActionLink {...ACTIONS.DESPAIR} /> per rotation (7 <ActionLink {...ACTIONS.FIRE_IV} />s and two <ActionLink {...ACTIONS.DESPAIR} />s with <ActionLink {...ACTIONS.MANAFONT} />).<br/>
						Avoid missing Fire IV casts where possible.
					</Trans>
				</Message>
				<RotationTable
					/*notes={[
						{
							header: <Trans id="dnc.dirty-dancing.table.header.missed">Hit Target</Trans>,
							accessor: 'missed',
						},
						{
							header: <Trans id="dnc.dirty-dancing.table.header.dirty">Correct Finish</Trans>,
							accessor: 'dirty',
						},
						{
							header: <Trans id="dnc.dirty-dancing.table.header.footloose">No Extra Moves</Trans>,
							accessor: 'footloose',
						},
					]}*/
					data={this.outliers.map(cycle => {
						return ({
							start: cycle.startTime - this.parser.fight.start_time,
							end: cycle.endTime != null ?
								cycle.endTime - this.parser.fight.start_time :
								cycle.startTime - this.parser.fight.start_time,
							/*notesMap: {
								missed: <>{this.getNotesIcon(dance.missed)}</>,
								dirty: <>{this.getNotesIcon(dance.dirty)}</>,
								footloose: <>{this.getNotesIcon(dance.footloose)}</>,
							},*/
							rotation: cycle.casts,
						})
					})}
					onGoto={this.timeline.show}
				/>
			</Fragment>
		}
	}
}
