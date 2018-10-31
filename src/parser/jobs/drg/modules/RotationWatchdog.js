import {Trans, Plural, i18nMark} from '@lingui/react'
import React from 'react'
import {Accordion, Message} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import ACTIONS, {getAction} from 'data/ACTIONS'
import Module from 'parser/core/Module'

const VALID_ROTATIONS = [
	[ // The normal rotation: HT -> DoT -> FT
		ACTIONS.HEAVY_THRUST.id,
		ACTIONS.IMPULSE_DRIVE.id,
		ACTIONS.DISEMBOWEL.id,
		ACTIONS.CHAOS_THRUST.id,
		ACTIONS.WHEELING_THRUST.id,
		ACTIONS.FANG_AND_CLAW.id,
		ACTIONS.TRUE_THRUST.id,
		ACTIONS.VORPAL_THRUST.id,
		ACTIONS.FULL_THRUST.id,
		ACTIONS.FANG_AND_CLAW.id,
		ACTIONS.WHEELING_THRUST.id,
	],
	[ // The inverse rotation: HT -> FT -> DoT
		ACTIONS.HEAVY_THRUST.id,
		ACTIONS.TRUE_THRUST.id,
		ACTIONS.VORPAL_THRUST.id,
		ACTIONS.FULL_THRUST.id,
		ACTIONS.FANG_AND_CLAW.id,
		ACTIONS.WHEELING_THRUST.id,
		ACTIONS.IMPULSE_DRIVE.id,
		ACTIONS.DISEMBOWEL.id,
		ACTIONS.CHAOS_THRUST.id,
		ACTIONS.WHEELING_THRUST.id,
		ACTIONS.FANG_AND_CLAW.id,
	],
	[ // The two-target rotation: HT -> DoT -> more DoT (okay stop DoT)
		ACTIONS.HEAVY_THRUST.id,
		ACTIONS.IMPULSE_DRIVE.id,
		ACTIONS.DISEMBOWEL.id,
		ACTIONS.CHAOS_THRUST.id,
		ACTIONS.WHEELING_THRUST.id,
		ACTIONS.FANG_AND_CLAW.id,
		ACTIONS.IMPULSE_DRIVE.id,
		ACTIONS.DISEMBOWEL.id,
		ACTIONS.CHAOS_THRUST.id,
		ACTIONS.WHEELING_THRUST.id,
		ACTIONS.FANG_AND_CLAW.id,
	],
]

const AOE_ACTIONS = [
	ACTIONS.DOOM_SPIKE.id,
	ACTIONS.SONIC_THRUST.id,
]

const ROTATION_GCD_COUNT = 11
const GCD_LENGTH = 2500

export default class RotationWatchdog extends Module {
	static handle = 'rotation'
	static i18n_id = i18nMark('drg.rotation.title')
	static title = 'Rotational Issues'
	static dependencies = [
		'downtime',
	]

	_rotation = {
		current: null,
		history: [],
	}

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
	}

	_onCast(event) {
		const action = getAction(event.ability.guid)
		if (!action.onGcd) {
			return
		}

		if (action.id === ACTIONS.HEAVY_THRUST.id || this._rotation.current === null) {
			// Heavy Thrust (or the first GCD) is the start of our 11-GCD rotation
			if (this._rotation.current !== null) {
				this._rotation.history.push(this._rotation.current)
			}

			this._rotation.current = {
				start: event.timestamp,
				casts: [],
			}
		}

		this._rotation.current.casts.push(event)
	}

	_isValidRotation(casts) {
		if (casts.length !== ROTATION_GCD_COUNT) {
			// This should never happen, but better safe I suppose
			return false
		}

		for (let i = 0; i < casts.length; i++) {
			let valid = false
			for (let j = 0; j < VALID_ROTATIONS.length; j++) {
				if (casts[i].ability.guid === VALID_ROTATIONS[j][i]) {
					valid = true
				}
			}

			if (!valid) {
				return false
			}
		}

		return true
	}

	output() {
		const badRotations = this._rotation.history.filter(rotation => {
			// If the rotation had any AoE actions, ignore it - we only care about ST rotation right now
			if (rotation.casts.some(cast => AOE_ACTIONS.includes(cast.ability.guid))) {
				return false
			}

			// If the rotation was shorter than expected (11 GCDs), include it unless downtime started within 1 GCD of the final cast
			if (rotation.casts.length < ROTATION_GCD_COUNT) {
				return !this.downtime.isDowntime(rotation.casts[rotation.casts.length - 1].timestamp + GCD_LENGTH)
			}

			// If the rotation was -longer- than expected, include it
			if (rotation.casts.length > ROTATION_GCD_COUNT) {
				return true
			}

			// Otherwise, see if the rotation matches either the optimal or alternate rotations
			return !this._isValidRotation(rotation.casts)
		})

		if (badRotations.length === 0) {
			return false
		}

		const panels = badRotations.map(rotation => {
			return {
				title: {
					key: 'title-' + rotation.start,
					content: <>
						{this.parser.formatTimestamp(rotation.start)}
						<span> - </span>
						<Plural id="drg.rotation.panel-count"
							value={rotation.casts.length}
							one="# GCD"
							other="# GCDs"/>
					</>,
				},
				content: {
					key: 'content-' + rotation.start,
					content: <Rotation events={rotation.casts}/>,
				},
			}
		})

		return <>
			<Message>
				<Trans id="drg.rotation.accordion.message">DRG has a very strict 11-GCD rotation with only minor permissable variations if you refresh <ActionLink {...ACTIONS.HEAVY_THRUST}/> early or are maintaining your DoT on two targets. All the entries below are instances of incorrect rotations.</Trans>
			</Message>
			<Accordion
				exclusive={false}
				panels={panels}
				styled
				fluid
			/>
		</>
	}
}
