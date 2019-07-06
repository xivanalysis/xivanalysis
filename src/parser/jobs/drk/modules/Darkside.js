import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import React, {Fragment} from 'react'
import {ActionLink} from 'components/ui/DbLink'

const DARKSIDE_MAX_DURATION = 60000
const DARKSIDE_EXTENSION = {
	[ACTIONS.FLOOD_OF_SHADOW.id]: 30000,
	[ACTIONS.EDGE_OF_SHADOW.id]: 30000,
}
const GCD_LENGTH = 2500

export default class Darkside extends Module {
	static handle = 'Darkside'
	static dependencies = [
		'checklist',
		'death',
	]

	_currentDuration = 0
	_downtime = 0
	_lastEventTime = null

	constructor(...args) {
		super(...args)
		this.addHook('aoedamage', {by: 'player', abilityId: Object.keys(DARKSIDE_EXTENSION).map(Number)}, this._applyDarkside)
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('raise', {to: 'player'}, this._onRaise)
		this.addHook('complete', this._onComplete)
	}

	_applyDarkside(event) {
		if (this._lastEventTime === null) {
			// First application - allow up to 1 GCD to apply before counting downtime
			const elapsedTime = event.timestamp - this.parser.fight.start_time
			this._downtime = Math.min(elapsedTime - GCD_LENGTH, 0)
		} else {
			const elapsedTime = event.timestamp - this._lastEventTime
			this._currentDuration -= elapsedTime
			if (this._currentDuration < 0) {
				this._downtime += Math.abs(this._currentDuration)
				this._currentDuration = 0
			}
		}

		const abilityId = event.ability.guid
		this._currentDuration = Math.max(this._currentDuration + DARKSIDE_EXTENSION[abilityId], DARKSIDE_MAX_DURATION)
		this._lastEventTime = event.timestamp
	}

	_onDeath() {
		this._currentDuration = 0
	}

	_onRaise(event) {
		// So floor time doesn't count against Darkside uptime
		this._lastEventTime = event.timestamp
	}

	_onComplete() {
		const duration = this.parser.fightDuration - this.death.deadTime
		const uptime = ((duration - this._downtime) / duration) * 100
		this.checklist.add(new Rule({
			name: 'Keep Darkside up',
			description: <Fragment>
				Darkside is gained by using <ActionLink {...ACTIONS.EDGE_OF_SHADOW}/> or <ActionLink {...ACTIONS.FLOOD_OF_SHADOW}/> and provides you with a 10% damage increase.  As such, it is a significant part of a DRK's personal DPS.  Do your best not to let it drop, and recover it as quickly as possible if it does.
			</Fragment>,
			requirements: [
				new Requirement({
					name: 'Darkside Uptime',
					percent: () => uptime,
				}),
			],
			target: 99,
		}))
	}
}
