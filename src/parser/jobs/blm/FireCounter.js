// Handle parsing each rotation. Confirm rotations have at least 8 F4 per Convert cycle and 6 F4 per normal cycle (or 5 F4 for non-Heart cycle)
// Flag rotations that do not and list those as warnings

import React, {Fragment} from 'react'
import {Accordion, Message} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import ACTIONS, {getAction} from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {FIRE_SPELLS, ICE_SPELLS} from 'parser/jobs/blm/Elements'

const EXPECTED_FIRE4 = 6
const FIRE4_FROM_CONVERT = 2

const DEBUG_LOG_ALL_FIRE_COUNTS = false

export default class FireCounter extends Module {
	static handle = 'firecounter'
	static title = 'Fire IVs Per Rotation'
	static dependencies = [
		'castTime',
		'gcd',
		'suggestions',
	]

	_inFireRotation = false
	_fireCounter = {}
	_history = []

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const actionId = event.ability.guid

		if (FIRE_SPELLS.includes(actionId)) {
			this._startRecording(event)
		} else if (ICE_SPELLS.includes(actionId)) {
			this._stopRecording()
		} else if (actionId === ACTIONS.TRANSPOSE.id) {
			this._handleTranspose(event)
		}

		if (this._inFireRotation && !getAction(actionId).autoAttack) {
			this._fireCounter.casts.push(event)
		}
	}

	_onComplete() {
		this._stopRecording()
	}

	_handleTranspose(event) {
		if (this._inFireRotation){
			this._stopRecording()
		} else {
			this._startRecording(event)
		}
	}

	_startRecording(event) {
		if (!this._inFireRotation) {
			this._inFireRotation = true
			this._fireCounter = {
				start: event.timestamp,
				end: null,
				casts: [],
			}
		}
	}

	_stopRecording() {
		if (this._inFireRotation) {
			this._inFireRotation = false
			this._fireCounter.end = this.parser.currentTimestamp

			// TODO: Check against B4. No-B4 should have 5 F4 per rotation
			// TODO: Handle fight downtime / ending. Don't flag those rotations
			// TODO: Handle aoe things
			// TODO: Handle Flare?
			const fire4Count = this._fireCounter.casts.filter(cast => getAction(cast.ability.guid).id === ACTIONS.FIRE_IV.id).length
			const hasConvert = this._fireCounter.casts.filter(cast => getAction(cast.ability.guid).id === ACTIONS.CONVERT.id).length > 0
			this._fireCounter.missingCount = this._getMissingFire4Count(fire4Count, hasConvert)
			if (this._fireCounter.missingCount > 0 || DEBUG_LOG_ALL_FIRE_COUNTS) {
				this._fireCounter.fire4Count = fire4Count
				this._history.push(this._fireCounter)
			}
		}
	}

	_getMissingFire4Count(count, hasConvert) {
		const missingFire4 = EXPECTED_FIRE4 + (hasConvert ? FIRE4_FROM_CONVERT : 0) - count
		return missingFire4
	}

	_renderCount(count, missing) {
		if (missing > 1) {
			return <span className="text-error">{count}</span>
		} if (missing > 0) {
			return <span className="text-warning">{count}</span>
		}
		return count
	}

	output() {
		const panels = this._history.map(rotation => {
			return {
				title: {
					key: 'title-' + rotation.start,
					content: <Fragment>
						{this.parser.formatTimestamp(rotation.start)}
						&nbsp;-&nbsp;{this._renderCount(rotation.fire4Count, rotation.missingCount)} Fire IVs
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
