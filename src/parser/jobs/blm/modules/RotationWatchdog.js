// Handle parsing each rotation. Confirm rotations have at least 8 F4 per Convert cycle and 6 F4 per normal cycle (or 5 F4 for non-Heart cycle)
// Flag rotations that do not and list those as warnings

import {t} from '@lingui/macro'
import React, {Fragment} from 'react'
import {Trans, Plural} from '@lingui/react'
import {Accordion, Message} from 'semantic-ui-react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import Rotation from 'components/ui/Rotation'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {BLM_GAUGE_EVENT} from './Gauge'
import DISPLAY_ORDER from './DISPLAY_ORDER'
import {getDataBy} from 'data'

const EXPECTED_FIRE4 = 6
const FIRE4_FROM_MANAFONT = 1
const DEBUG_LOG_ALL_FIRE_COUNTS = false && process.env.NODE_ENV !== 'production'
const AFUIBUFFMAXSTACK = 3
const ISSUE_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	3: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}

// This is feelycraft at the moment. Rotations longer than that get put into the history array to sort out transpose shenanigans.
// TODO: consider downtime and do something with it. Like throwing out the rotation or godknows.
const MIN_ROTATION_LENGTH = 3

export default class RotationWatchdog extends Module {
	static handle = 'RotationWatchdog'
	static title = t('blm.rotation-watchdog.title')`Rotation Outliers`
	static displayOrder = DISPLAY_ORDER.ROTATION

	static dependencies = [
		'checklist',
		'suggestions',
		'gauge', // eslint-disable-line @xivanalysis/no-unused-dependencies
		'invuln',
		'combatants',
		'enemies',
	]

	_rotation = {}
	_history = []

	//check for buffs
	_umbralHeartStacks = 0
	_astralFireStacks = 0
	_MP = 0
	_lockedBuffs = false
	_lastStop = false
	_first = true
	//check for UI ending with T3 things
	_umbralIceStacks = 0
	_T3 = false
	_T3inUIFlag = false
	//counter for suggestions
	_inRotation = false
	_missedF4s = 0
	_extraF1s = 0
	_UIEndingInT3 = 0
	_missedF4sCauseEndingInT3 = 0
	_extraT3s = 0
	_rotationsWithoutFire = 0
	_umbralIceBeforeFire = 0
	_mfBeforeDespair = 0
	_atypicalAFStartId = false
	_astralFiresNotEndedWithDespair = 0

	_gaugeState = {}

	constructor(...args) {
		super(...args)
		this.addHook('begincast', {by: 'player'}, this._onBegin)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('init', this._onFirst)
		this.addHook('complete', this._onComplete)
		this.addHook(BLM_GAUGE_EVENT, this._onGaugeChange)
	}

	_onGaugeChange(event) {
		// Keep track of how many UI stacks we had upon entering AF, affects expected F4 counts for the cycle
		if (event.astralFire > 0 && this._gaugeState.astralFire === 0) {
			this._umbralIceBeforeFire = this._gaugeState.umbralIce
		}
		this._gaugeState.astralFire = event.astralFire
		this._gaugeState.umbralIce = event.umbralIce
		this._gaugeState.umbralHearts = event.umbralHearts
	}

	//snapshot buffs and UH at the beginning of your recording
	_onBegin(event) {
		const actionId = event.ability.guid

		//get UI status for to check for T3
		this._umbralIceStacks = this._gaugeState.umbralIce
		this._astralFireStacks = this._gaugeState.astralFire
		if (actionId === ACTIONS.FIRE_III.id) {
			this._lockingBuffs()
		} else { this._T3 = false }

		//Check to see if we get a T3 > F3
		if (actionId === ACTIONS.THUNDER_III.id) { this._T3 = true }
	}

	_onCast(event) {
		const actionId = event.ability.guid

		//check if T3 > F3 happend and if we are in UI and get the MP value at the beginning of your AF
		if (actionId === ACTIONS.FIRE_III.id) {
			if (this._umbralIceStacks === AFUIBUFFMAXSTACK) {
				if (this._T3) {
					this._T3inUIFlag = true
				}
				this._MP = this.combatants.selected.resources.mp
			}
			// If we're gaining AF3 from an F3P, count it as the beginning of the phase for F4 count purposes
			if (this._astralFire !== AFUIBUFFMAXSTACK && this._umbralIceStacks < AFUIBUFFMAXSTACK) {
				if (event.ability.overrideAction) {
					this._atypicalAFStartId = event.ability.overrideAction
				} else {
					this._atypicalAFStartId = ACTIONS.FIRE_III.id
				}
			}
		}

		//start and stop trigger for our rotations is B3
		if (actionId === ACTIONS.BLIZZARD_III.id || actionId === ACTIONS.FREEZE.id || actionId === ACTIONS.UMBRAL_SOUL.id) {
			if (!this._first) { this._stopRecording() }
			this._startRecording(event)
		} else if (actionId === ACTIONS.TRANSPOSE.id) {
			this._handleTranspose(event)
		} else if (actionId === ACTIONS.FIRE_III.id && !this._inRotation) {
			// Catch oddly-begun fire phases in case something weird was going on.
			this._startRecording(event)
		}
		if (this._first) { this._first = false }
		const action = getDataBy(ACTIONS, 'id', actionId)
		if (this._inRotation && action && !action.autoAttack) {
			this._rotation.casts.push(event)
		}
	}

	//start recording at the first cast
	_onFirst(event) {
		this._startRecording(event)
	}

	_getThunderUptime() {
		const statusTime = this.enemies.getStatusUptime(STATUSES.THUNDER_III.id)
		const uptime = this.parser.fightDuration - this.invuln.getInvulnerableUptime()

		return (statusTime / uptime) * 100
	}

	_onComplete() {
		this._lastStop = true
		this._stopRecording()
		//writing a suggestion to skip B4 end of fight.
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

		//suggestion for unneccessary extra F1s.
		//TODO: make severity based on fight length instead of static
		if (this._extraF1s) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.FIRE_I.icon,
				content: <Trans id="blm.rotation-watchdog.suggestions.extra-f1s.content">
					Casting more than one <ActionLink {...ACTIONS.FIRE_I}/> per Astral Fire cycle is a crutch that should be avoided by better pre-planning of the encounter.
				</Trans>,
				severity: (this._extraF1s > 1 ? SEVERITY.MEDIUM : SEVERITY.MINOR),
				why: <Trans id="blm.rotation-watchdog.suggestions.extra-f1s.why">
					<Plural value={this._extraF1s} one="# Fire I" other="# Fire Is"/> have been casted.
				</Trans>,
			}))
		}

		// Suggestion to end Astral Fires with Despair
		if (this._astralFiresNotEndedWithDespair) {
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
		}
		// Suggestion to not use manafont before Despair
		if (this._mfBeforeDespair) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.MANAFONT.icon,
				content: <Trans id="blm.rotation-watchdog.suggestions.mf-before-despair.content">
					Using <ActionLink {...ACTIONS.MANAFONT} /> before <ActionLink {...ACTIONS.DESPAIR} /> leads to fewer <ActionLink {...ACTIONS.DESPAIR} />s than possible being cast. Try to avoid that since <ActionLink {...ACTIONS.DESPAIR} /> is stronger than <ActionLink {...ACTIONS.FIRE_IV} />.
				</Trans>,
				tiers: ISSUE_SEVERITY_TIERS,
				value: this._mfBeforeDespair,
				why: <Trans id="blm.rotation-watchdog.suggestions.mf-before-despair.why">
					<Plural value={this._mfBeforeDespair} one="# Manafont" other="# Manafonts"/> were casted before <ActionLink {...ACTIONS.DESPAIR} />.
				</Trans>,
			}))
		}

		//Suggestion for hard T3s under AF. Should only have one per cycle
		if (this._extraT3s) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.THUNDER_III_FALSE.icon,
				content: <Trans id="blm.rotation-watchdog.suggestions.wrong-t3.content">
					Don't hard cast more than one <ActionLink {...ACTIONS.THUNDER_III}/> in your Astral Fire phase, since that costs MP which could be used for more <ActionLink {...ACTIONS.FIRE_IV}/>s.
				</Trans>,
				tiers: ISSUE_SEVERITY_TIERS,
				value: this._extraT3s,
				why: <Trans id="blm.rotation-watchdog.suggestions.wrong-t3.why">
					<Plural value={this._extraT3s} one="# extra Thunder III" other="# extra Thunder IIIs"/> were hard casted under Astral Fire.
				</Trans>,
			}))
		}

		// Suggestion not to icemage... :(
		if (this._rotationsWithoutFire > 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.BLIZZARD_II.icon,
				content: <Trans id="blm.rotation-watchdog.suggestions.icemage.content">
					Avoid spending significant amounts of time in Umbral Ice. The majority of your damage comes from your Astral Fire phase, so you should maximize the number of <ActionLink {...ACTIONS.FIRE_IV}/>s cast during the fight.
				</Trans>,
				tiers: ISSUE_SEVERITY_TIERS,
				value: this._rotationsWithoutFire,
				why: <Trans id="blm.rotation-watchdog.suggestions.icemage.why">
					<Plural value={this._rotationsWithoutFire} one="# rotations" other="# rotations"/> were performed with no fire spells.
				</Trans>,
			}))
		}

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

	//if transpose is used under Encounter invul the recording gets resetted
	_handleTranspose(event) {
		if (this._inRotation) {
			if (!this.invuln.isUntargetable('all', event.timestamp)) {
				this._stopRecording()
			} else {
				this._resetRecording(event)
			}
		} else {
			this._startRecording(event)
		}
	}

	_startRecording(event) {
		if (!this._inRotation) {
			this._inRotation = true
			this._rotation = {
				start: event.timestamp,
				end: null,
				casts: [],
			}
		}
	}

	_stopRecording() {
		if (this._inRotation) {
			this._lockedBuffs = false
			this._inRotation = false
			this._rotation.end = this.parser.currentTimestamp
			// TODO: Use a better trigger for downtime than transpose
			// TODO: Handle aoe things
			// TODO: Handle Flare?
			const fire4Count = this._rotation.casts.filter(cast => cast.ability.guid === ACTIONS.FIRE_IV.id).length
			const fire1Count = this._rotation.casts.filter(cast => cast.ability.guid === ACTIONS.FIRE_I.id).length
			const despairCount = this._rotation.casts.filter(cast => cast.ability.guid === ACTIONS.DESPAIR.id).length
			const hasManafont = this._rotation.casts.filter(cast => cast.ability.guid === ACTIONS.MANAFONT.id).length > 0
			const lastEvent = this._rotation.casts[this._rotation.casts.length-1]

			const hardT3Count = this._rotation.casts.filter(cast => cast.ability.overrideAction).filter(cast => cast.ability.overrideAction.id === ACTIONS.THUNDER_III_FALSE.id).length
			if (hardT3Count > 1) {
				this._extraT3s++
			}
			//check whether manafont was used before despair
			if (hasManafont) {
				if (despairCount > 0) {
					if (this._rotation.casts.findIndex(cast => cast.ability.guid === ACTIONS.MANAFONT.id) < this._rotation.casts.findIndex(cast => cast.ability.guid === ACTIONS.DESPAIR.id)) {
						this._mfBeforeDespair++
					}
				}
			}
			this._rotation.missingCount = this._getMissingFire4Count(fire4Count, hasManafont)
			if (fire1Count > 1) {
				this._extraF1s += fire1Count
				this._extraF1s--
			}
			if (this._rotation.missingCount.missing !== 0 || hardT3Count > 1 || DEBUG_LOG_ALL_FIRE_COUNTS) {
				this._rotation.fire4Count = fire4Count

				//Only display rotations with more than 3 casts since less is normally weird shit with Transpose
				//Also throw out rotations with no Fire spells
				const fire3Count = this._rotation.casts.filter(cast => cast.ability.guid === ACTIONS.FIRE_III.id).length
				const fireCount = fire3Count + fire1Count + fire4Count + despairCount
				if (fireCount === 0 && this._rotation.casts.length > 1) {
					this._rotationsWithoutFire++
				}
				if (this._rotation.casts.length > MIN_ROTATION_LENGTH && fireCount >= 1) {
					//check if the rotation ended with despair
					if (lastEvent && lastEvent.ability.guid !== ACTIONS.DESPAIR.id) {
						this._astralFiresNotEndedWithDespair++
					}
					this._history.push(this._rotation)
				}
				if (this._lastStop && this._umbralHeartStacks > 0 && this._rotation.missingCount === 2) {
					const missedF4s = this._rotation.missingCount --
					this._missedF4s = missedF4s
				}
			}
			//reset the flag
			this._atypicalAFStartId = null
		}
	}

	_resetRecording(event) {
		this._inRotation = false
		this._rotation = {}
		this._lockedBuffs = false
		this._startRecording(event) // Make sure we start a new recording to catch actions when the boss returns
	}

	_getMissingFire4Count(count, hasManafont) {
		let expected = EXPECTED_FIRE4 + (hasManafont ? FIRE4_FROM_MANAFONT : 0)
		if (this._atypicalAFStartId === ACTIONS.FIRE_III_PROC.id || (this._umbralIceBeforeFire === AFUIBUFFMAXSTACK && this._atypicalAFStartId === ACTIONS.FIRE_III.id)) {
			// If we arrived in Astral Fire from UI3 normally or via F3P, but didn't have 2 or 3 hearts, we lose a F4
			if (this._umbralHeartStacks < AFUIBUFFMAXSTACK) {
				expected--
			}
			if (this._umbralHeartStacks === 0) {
				expected--
			}
		} else if (this._umbralIceBeforeFire > 0 || this._atypicalAFStartId) { // If we came from Ice other than UI3, we're probably losing Fire 4s
			// If we don't have max hearts, we lose at least one cast
			if (this._umbralHeartStacks < AFUIBUFFMAXSTACK) {
				expected--
			}
			// If we have no hearts, we lose another one :(
			if (this._umbralHeartStacks === 0) {
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
	}

	_renderCount(count, missing) {
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

	_lockingBuffs() {
		if (this._inRotation && !this._lockedBuffs) {
			this._umbralHeartStacks = this._gaugeState.umbralHearts
			this._lockedBuffs = true
		}
	}
	output() {
		const panels = this._history.map(rotation => {
			return {
				key: 'title-' + rotation.start,
				title: {
					content: <Fragment>
						{this.parser.formatTimestamp(rotation.start)}
						<span> - </span>{this._renderCount(rotation.fire4Count, rotation.missingCount.missing)} / {rotation.missingCount.expected} Fire IVs
					</Fragment>,
				},
				content: {
					content: <Rotation events={rotation.casts}/>,
				},
			}
		})

		if (panels.length > 0) {
			return <Fragment>
				<Message>
					<Trans id="blm.rotation-watchdog.accordion.message">
						The core of BLM consists of 6 <ActionLink {...ACTIONS.FIRE_IV} />s and one <ActionLink {...ACTIONS.DESPAIR} /> per rotation (7 <ActionLink {...ACTIONS.FIRE_IV} />s and two <ActionLink {...ACTIONS.DESPAIR} />s with <ActionLink {...ACTIONS.MANAFONT} />).<br/>
						Avoid missing Fire IV casts where possible.
					</Trans>
				</Message>
				<Accordion
					exclusive={false}
					panels={panels}
					styled
					fluid
				/>
			</Fragment>
		}
	}
}
