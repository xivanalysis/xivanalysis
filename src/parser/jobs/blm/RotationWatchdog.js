// Handle parsing each rotation. Confirm rotations have at least 8 F4 per Convert cycle and 6 F4 per normal cycle (or 5 F4 for non-Heart cycle)
// Flag rotations that do not and list those as warnings

import React, {Fragment} from 'react'
import {Accordion, Message} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import ACTIONS, {getAction} from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const EXPECTED_FIRE4 = 6
const FIRE4_FROM_CONVERT = 2
const MIN_MP_LEAVING_UI_NORMALLY = 12960
const DEBUG_LOG_ALL_FIRE_COUNTS = false

export default class RotationWatchdog extends Module {
	static handle = 'RotationWatchdog'
	static title = 'Issues in Rotation'
	static dependencies = [
		'suggestions',
		'gauge',
		'invuln',
		'combatants',
	]

	_rotation = {}
	_history = []

	//check for buffs
	_UH = 0
	_AF = 0
	_MP = 0
	_lockedBuffs = false
	_lastStop = false
	_first = true
	//check for UI ending with T3 things
	_UI = 0
	_T3 = false
	_T3inUIFlag = false
	//counter for suggestions
	_missedF4s = 0
	_extraF1s = 0
	_UIEndingInT3 = 0
	_missedF4sCauseEndingInT3 = 0
	_wrongT3 = 0

	constructor(...args) {
		super(...args)
		this.addHook('begincast', {by: 'player'}, this._onBegin)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('init', this._onFirst)
		this.addHook('complete', this._onComplete)
	}

	//snapshot buffs and UH at the beginning of your recording
	_onBegin(event) {
		const actionId = event.ability.guid

		//get UI status for to check for T3
		this._UI = this.gauge.getUI()
		this._AF = this.gauge.getAF()
		if (actionId === ACTIONS.FIRE_III.id) {
			this._lockingBuffs()
		} else { this._T3 = false }

		//Check to see if we get a T3 > F3
		if (actionId === ACTIONS.THUNDER_III.id) { this._T3 = true }
	}

	_onCast(event) {
		const actionId = event.ability.guid

		//check if T3 > F3 happend and if we are in UI and get the MP value at the beginning of your AF
		if (actionId === ACTIONS.FIRE_III.id && this._UI === 3) {
			if (this._T3) {
				this._UIEndingInT3 ++
				this._T3inUIFlag = true
			}
			this._MP = this.combatants.selected.resources.mp
		}

		/*If my T3 isn't a proc already and cast under AF, it's straight up wrong. !!Deactivated until T3Ps are tracked accurately!!
		if (!event.ability.overrideAction && actionId === ACTIONS.THUNDER_III.id && this._AF > 0) {
			event.ability.overrideAction = ACTIONS.THUNDER_III_FALSE
			this._wrongT3 ++
		}*/

		//start and stop trigger for our rotations is B3
		if (actionId === ACTIONS.BLIZZARD_III.id) {
			if (!this._first) { this._stopRecording() }
			this._startRecording(event)
		} else if (actionId === ACTIONS.TRANSPOSE.id) {
			this._handleTranspose(event)
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
				content: <Fragment>
					You lost at least  one <ActionLink {...ACTIONS.FIRE_IV}/> by not skipping <ActionLink {...ACTIONS.BLIZZARD_IV}/> in the Umbral Ice phase before the fight finished.
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: <Fragment>
					You missed {this._missedF4s} Fire IV{this._missedF4s > 1 && 's'}.
				</Fragment>,
			}))
		}

		//suggestion for unneccessary extra F1s.
		//TODO: make severity based on fight length instead of static
		if (this._extraF1s) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.FIRE_I.icon,
				content: <Fragment>
					Casting more than one <ActionLink {...ACTIONS.FIRE_I}/> per Astral Fire cycle is a crutch that should be avoided by better pre-planning of the encounter.
				</Fragment>,
				severity: (this._extraF1s > 1 ? SEVERITY.MEDIUM : SEVERITY.MINOR),
				why: <Fragment>
					You casted {this._extraF1s} extra Fire I{this._extraF1s > 1 && 's'}.
				</Fragment>,
			}))
		}

		//Suggestions for ending UI in T3
		if (this._UIEndingInT3) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.THUNDER_III.icon,
				content: <Fragment>
					Avoid ending your Umbral Ice with a non-proc <ActionLink {...ACTIONS.THUNDER_III}/>. This can lead to MP issues and fewer <ActionLink {...ACTIONS.FIRE_IV}/> casts under Astral Fire.
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: <Fragment>
					You ended Umbral Ice {this._UIEndingInT3} time{this._UIEndingInT3 > 1 && 's'} with Thunder III.
				</Fragment>,
			}))
		}

		//Suggestions if you actually lost F4s due to ending UI with a hardcast T3
		if (this._missedF4sCauseEndingInT3) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.THUNDER_III_FALSE.icon,
				content: <Fragment>
					Ending Umbral Ice with a non-proc <ActionLink {...ACTIONS.THUNDER_III}/> actually costed you at least one <ActionLink {...ACTIONS.FIRE_IV}/>.
				</Fragment>,
				severity: SEVERITY.MAJOR,
				why: <Fragment>
					Ending Umbral Ice with a Thunder III costed you {this._missedF4sCauseEndingInT3} Fire IV{this._missedF4sCauseEndingInT3 > 1 && 's'}.
				</Fragment>,
			}))
		}

		//Suggestion for hard T3s under AF. Will be enabled as soon as T3Ps stop being dumb
		if (this._wrongT3) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.THUNDER_III_FALSE.icon,
				content: <Fragment>
					Never hard cast a <ActionLink {...ACTIONS.THUNDER_III}/> in your Astral Fire phase, since that costs MP which could be used for more <ActionLink {...ACTIONS.FIRE_IV}/>s.
				</Fragment>,
				severity: SEVERITY.MAJOR,
				why: <Fragment>
					{this._wrongT3} Thunder III{this._wrongT3 > 1 && 's'} were hard casted under Astral Fire.
				</Fragment>,
			}))
		}
	}

	//if transpose is used under Encounter invul the recording gets resetted
	_handleTranspose(event) {
		if (this._inRotation) {
			if (!this.invuln.isUntargetable('all', event.timestamp)) {
				this._stopRecording()
			} else {
				this._resetRecording()
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

			/* !!Deactivated until T3Ps are tracked correctly.!!
			const hardT3Count = this._rotation.casts.filter(cast => cast.ability.overrideAction).filter(cast => cast.ability.overrideAction.id === ACTIONS.THUNDER_III_FALSE.id).length*/
			this._rotation.missingCount = this._getMissingFire4Count(fire4Count, hasConvert)
			if (fire1Count > 1) {
				this._extraF1s += fire1Count
				this._extraF1s--
			}
			//!!Statement deactivated until T3Ps are tracked correctly.!!
			if (this._rotation.missingCount.missing > 0 || /*hardT3Count > 0 ||*/ DEBUG_LOG_ALL_FIRE_COUNTS) {
				this._rotation.fire4Count = fire4Count

				//Check if you actually lost an F4 due to ending UI in T3
				if (this._MP < MIN_MP_LEAVING_UI_NORMALLY && this._T3inUIFlag && (fire4Count + fire1Count - 1) !== this._rotation.missingCount.expected) {
					this._missedF4sCauseEndingInT3 ++
					this._T3inUIFlag = false
				}

				//Only display rotations with more than 3 casts since less is normally weird shit with Transpose
				if (this._rotation.casts.length > 3) { this._history.push(this._rotation) }
				if (this._lastStop && this._UH > 0 && this._rotation.missingCount === 2) {
					const missedF4s = this._rotation.missingCount --
					this._missedF4s = missedF4s
				}
			}
			//reset the flag
			this._T3inUIFlag = false
		}
	}

	_resetRecording() {
		this._inRotation = false
		this._rotation = {}
		this._lockedBuffs = false
	}

	_getMissingFire4Count(count, hasConvert) {
		const NotEnoughUH = this._UH  < 2
		const expected = EXPECTED_FIRE4 + (hasConvert ? FIRE4_FROM_CONVERT : 0) - (NotEnoughUH ? 1 : 0)
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
			this._UH = this.gauge.getUH()
			this._lockedBuffs = true
		}
	}
	output() {
		const panels = this._history.map(rotation => {
			return {
				title: {
					key: 'title-' + rotation.start,
					content: <Fragment>
						{this.parser.formatTimestamp(rotation.start)}
						<span> - </span>{this._renderCount(rotation.fire4Count, rotation.missingCount.missing)} / {rotation.missingCount.expected} Fire IVs
					</Fragment>,
				},
				content: {
					key: 'content-' + rotation.start,
					content: <Rotation events={rotation.casts}/>,
				},
			}
		})

		return <Fragment>
			<Message>
				The core of BLM consists of 6 <ActionLink {...ACTIONS.FIRE_IV} />s per rotation (8 with <ActionLink {...ACTIONS.CONVERT} />, 5 if skipping <ActionLink {...ACTIONS.BLIZZARD_IV} />).<br/>
				Avoid missing Fire IV casts where possible.
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
