// Handle parsing each rotation. Confirm rotations have at least 8 F4 per Convert cycle and 6 F4 per normal cycle (or 5 F4 for non-Heart cycle)
// Flag rotations that do not and list those as warnings

import React, {Fragment} from 'react'
import {Trans, Plural, i18nMark} from '@lingui/react'
import {Accordion, Message} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import ACTIONS, {getAction} from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {TieredSuggestion, Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {BLM_GAUGE_EVENT} from './Gauge'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const EXPECTED_FIRE4 = 6
const FIRE4_FROM_CONVERT = 2
const MIN_MP_LEAVING_UI_NORMALLY = 12960
const DEBUG_LOG_ALL_FIRE_COUNTS = false && process.env.NODE_ENV !== 'production'
const AFUIBUFFMAXSTACK = 3

// This is feelycraft at the moment. Rotations longer than that get put into the history array to sort out transpose shenanigans.
// TODO: consider downtime and do something with it. Like throwing out the rotation or godknows.
const MIN_ROTATION_LENGTH = 3

export default class RotationWatchdog extends Module {
	static handle = 'RotationWatchdog'
	static i18n_id = i18nMark('blm.rotation-watchdog.title')
	static title = 'Rotation Issues'
	static displayOrder = DISPLAY_ORDER.ROTATION

	static dependencies = [
		'suggestions',
		'gauge', // eslint-disable-line xivanalysis/no-unused-dependencies
		'invuln',
		'combatants',
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
	_missedF4s = 0
	_extraF1s = 0
	_UIEndingInT3 = 0
	_missedF4sCauseEndingInT3 = 0
	_wrongT3 = 0
	_rotationsWithoutFire = 0
	_umbralIceBeforeFire = 0
	_atypicalAFStartId = false

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
					this._UIEndingInT3 ++
					this._T3inUIFlag = true
				}
				this._MP = this.combatants.selected.resources.mp
			}
			// If we're gaining AF3 from an F3P, count it as the beginning of the phase for F4 count purposes
			if (this._astralFire !== AFUIBUFFMAXSTACK) {
				if (event.ability.overrideAction) {
					this._atypicalAFStartId = event.ability.overrideAction
				} else {
					this._atypicalAFStartId = ACTIONS.FIRE_III.id
				}
			}
		}

		//If my T3 isn't a proc already and cast under AF, it's straight up wrong.
		if (!event.ability.overrideAction && actionId === ACTIONS.THUNDER_III.id && this._AF > 0) {
			event.ability.overrideAction = ACTIONS.THUNDER_III_FALSE
			this._wrongT3 ++
		}

		//start and stop trigger for our rotations is B3
		if (actionId === ACTIONS.BLIZZARD_III.id) {
			if (!this._first) { this._stopRecording() }
			this._startRecording(event)
		} else if (actionId === ACTIONS.TRANSPOSE.id) {
			this._handleTranspose(event)
		} else if (actionId === ACTIONS.FIRE_III.id && !this._inRotation) {
			// Catch oddly-begun fire phases in case something weird was going on.
			this._startRecording(event)
		}
		if (this._first) { this._first = false }
		if (this._inRotation && !getAction(actionId).autoAttack) {
			this._rotation.casts.push(event)
		}
	}

	//start recording at the first cast
	_onFirst(event) {
		this._startRecording(event)
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

		//Suggestions for ending UI in T3
		if (this._UIEndingInT3) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.THUNDER_III.icon,
				content: <Trans id="blm.rotation-watchdog.suggestions.ui-ending-in-t3.content">
					Avoid ending your Umbral Ice with a non-proc <ActionLink {...ACTIONS.THUNDER_III}/>. This can lead to MP issues and fewer <ActionLink {...ACTIONS.FIRE_IV}/> casts under Astral Fire.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="blm.rotation-watchdog.suggestions.ui-ending-in-t3.why">
					{this._UIEndingInT3} Umbral Ice <Plural value={this._UIEndingInT3} one="phase" other="phases"/> ended with Thunder III.
				</Trans>,
			}))
		}

		//Suggestions if you actually lost F4s due to ending UI with a hardcast T3
		if (this._missedF4sCauseEndingInT3) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.THUNDER_III_FALSE.icon,
				content: <Trans id="blm.rotation-watchdog.suggestions.f4-lost-to-t3-finisher.content">
					Ending Umbral Ice with a non-proc <ActionLink {...ACTIONS.THUNDER_III}/> actually costed you at least one <ActionLink {...ACTIONS.FIRE_IV}/>.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="blm.rotation-watchdog.suggestions.f4-lost-to-t3-finisher.why">
					Ending Umbral Ice with a Thunder III costed you <Plural value={this._missedF4sCauseEndingInT3} one="# Fire IV" other="# Fire IVs"/>.
				</Trans>,
			}))
		}

		//Suggestion for hard T3s under AF. Will be enabled as soon as T3Ps stop being dumb
		if (this._wrongT3) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.THUNDER_III_FALSE.icon,
				content: <Trans id="blm.rotation-watchdog.suggestions.wrong-t3.content">
					Never hard cast a <ActionLink {...ACTIONS.THUNDER_III}/> in your Astral Fire phase, since that costs MP which could be used for more <ActionLink {...ACTIONS.FIRE_IV}/>s.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="blm.rotation-watchdog.suggestions.wrong-t3.why">
					<Plural value={this._wrongT3} one="# Thunder III" other="# Thunder IIIs"/> were hard casted under Astral Fire.
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
				tiers: {
					1: SEVERITY.MINOR,
					3: SEVERITY.MEDIUM,
					5: SEVERITY.MAJOR,
				},
				value: this._rotationsWithoutFire,
				why: <Trans id="blm.rotation-watchdog.suggestions.icemage.why">
					<Plural value={this._rotationsWithoutFire} one="# rotations" other="# rotations"/> were performed with no fire spells.
				</Trans>,
			}))
		}
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
			const fire4Count = this._rotation.casts.filter(cast => getAction(cast.ability.guid).id === ACTIONS.FIRE_IV.id).length
			const fire1Count = this._rotation.casts.filter(cast => getAction(cast.ability.guid).id === ACTIONS.FIRE_I.id).length
			const hasConvert = this._rotation.casts.filter(cast => getAction(cast.ability.guid).id === ACTIONS.CONVERT.id).length > 0

			const hardT3Count = this._rotation.casts.filter(cast => cast.ability.overrideAction).filter(cast => cast.ability.overrideAction.id === ACTIONS.THUNDER_III_FALSE.id).length
			this._rotation.missingCount = this._getMissingFire4Count(fire4Count, hasConvert)
			if (fire1Count > 1) {
				this._extraF1s += fire1Count
				this._extraF1s--
			}
			if (this._rotation.missingCount.missing > 0 || hardT3Count > 0 || DEBUG_LOG_ALL_FIRE_COUNTS) {
				this._rotation.fire4Count = fire4Count

				//Check if you actually lost an F4 due to ending UI in T3
				if (this._MP < MIN_MP_LEAVING_UI_NORMALLY && this._T3inUIFlag && (fire4Count + fire1Count - 1) !== this._rotation.missingCount.expected) {
					this._missedF4sCauseEndingInT3 ++
					this._T3inUIFlag = false
				}

				//Only display rotations with more than 3 casts since less is normally weird shit with Transpose
				//Also throw out rotations with no Fire spells
				const fire3Count = this._rotation.casts.filter(cast => getAction(cast.ability.guid).id === ACTIONS.FIRE_III.id).length
				const fireCount = [fire3Count, fire1Count, fire4Count].reduce((accumulator, currentValue) => accumulator + currentValue, 0)
				if (fireCount === 0) {
					this._rotationsWithoutFire++
				}
				if (this._rotation.casts.length > MIN_ROTATION_LENGTH && fireCount >= 1) { this._history.push(this._rotation) }
				if (this._lastStop && this._umbralHeartStacks > 0 && this._rotation.missingCount === 2) {
					const missedF4s = this._rotation.missingCount --
					this._missedF4s = missedF4s
				}
			}
			//reset the flag
			this._T3inUIFlag = false
			this._atypicalAFStartId = null
		}
	}

	_resetRecording(event) {
		this._inRotation = false
		this._rotation = {}
		this._lockedBuffs = false
		this._startRecording(event) // Make sure we start a new recording to catch actions when the boss returns
	}

	_getMissingFire4Count(count, hasConvert) {
		let expected = EXPECTED_FIRE4 + (hasConvert ? FIRE4_FROM_CONVERT : 0)

		if (this._atypicalAFStartId === ACTIONS.FIRE_III_PROC.id || (this._umbralIceBeforeFire === AFUIBUFFMAXSTACK && this._atypicalAFStartId !== ACTIONS.FIRE_III.id)) {
			// If we arrived in Astral Fire from UI3 normally or via F3P, but didn't have 2 or 3 hearts, we lose a F4
			if (this._umbralHeartStacks < 2) {
				expected--
			}
			// If you Convert when you have an even number of UH stacks going into this fire phase from UI3, the extra MP
			// from converting is only enough to grant one additional Fire 4 as compared to not converting
			// So remove one of the expected casts granted by FIRE4_FROM_CONVERT
			if (hasConvert && this._umbralHeartStacks % 2 === 0 && this._umbralIceBeforeFire === AFUIBUFFMAXSTACK && !this._astralFireBeganWithF3P) {
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
		} if (missing > 0) {
			return <span className="text-warning">{count}</span>
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
						The core of BLM consists of 6 <ActionLink {...ACTIONS.FIRE_IV} />s per rotation (8 with <ActionLink {...ACTIONS.CONVERT} />, 5 if skipping <ActionLink {...ACTIONS.BLIZZARD_IV} />).<br/>
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
