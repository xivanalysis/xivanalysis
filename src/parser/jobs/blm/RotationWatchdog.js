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

const DEBUG_LOG_ALL_FIRE_COUNTS = false

export default class RotationWatchdog extends Module {
	static handle = 'RotationWatchdog'
	static title = 'Fire IVs Per Rotation'
	static dependencies = [
		'castTime',
		'gcd',
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
	_UI = 0
	_MP = 0
	_lockedBuffs = false
	_lastStop = false
	_first = true
	//counter for suggestions
	_missedF4s = 0
	_extraF1s = 0

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
		if (actionId === ACTIONS.FIRE_III.id) {
			this._lockingBuffs()
		}
	}

	_onCast(event) {
		const actionId = event.ability.guid
		if (actionId === ACTIONS.BLIZZARD_III.id) {
			if (!this._first) { this._stopRecording() }
			this._startRecording(event)
		} else if (actionId === ACTIONS.TRANSPOSE.id) {
			this._handleTranspose(event)
		}
		if (this._first) { this._first = false }
		if (this._inFireRotation && !getAction(actionId).autoAttack) {
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
	}

	//if transpose is used under Encounter invul the recording gets resetted
	_handleTranspose(event) {
		if (this._inFireRotation) {
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
		if (!this._inFireRotation) {
			this._inFireRotation = true
			this._rotation = {
				start: event.timestamp,
				end: null,
				casts: [],
			}
		}
	}

	_stopRecording() {
		if (this._inFireRotation) {
			this._lockedBuffs = false
			this._inFireRotation = false
			this._rotation.end = this.parser.currentTimestamp
			// TODO: Use a better trigger for downtime than transpose
			// TODO: Handle aoe things
			// TODO: Handle Flare?
			const fire4Count = this._rotation.casts.filter(cast => getAction(cast.ability.guid).id === ACTIONS.FIRE_IV.id).length
			const fire1Count = this._rotation.casts.filter(cast => getAction(cast.ability.guid).id === ACTIONS.FIRE_I.id).length
			const hasConvert = this._rotation.casts.filter(cast => getAction(cast.ability.guid).id === ACTIONS.CONVERT.id).length > 0
			this._rotation.missingCount = this._getMissingFire4Count(fire4Count, hasConvert)
			if (fire1Count > 1) {
				this._extraF1s += fire1Count
				this._extraF1s--
			}
			if (this._rotation.missingCount.missing > 0 || DEBUG_LOG_ALL_FIRE_COUNTS) {
				this._rotation.fire4Count = fire4Count
				if (this._rotation.casts.length > 3) { this._history.push(this._rotation) }
				if (this._lastStop && this._UH > 0 && this._rotation.missingCount === 2) {
					const missedF4s = this._rotation.missingCount --
					this._missedF4s = missedF4s
				}
			}
		}
	}

	_resetRecording() {
		this._inFireRotation = false
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
		if (this._inFireRotation && !this._lockedBuffs) {
			this._UH = this.gauge.getUH()
			this._UI = this.gauge.getUI()
			this._AF = this.gauge.getAF()
			this._MP = this.combatants.selected.resources.mp
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
