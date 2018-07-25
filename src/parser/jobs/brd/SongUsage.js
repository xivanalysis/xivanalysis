/**
 * @author Yumiya
 */

//import React, {Fragment} from 'react'
//import {StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
//import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
//import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

export default class SongUsage extends Module {
	static handle = 'songusage'
	static dependencies = [
		'checklist',
		'cooldowns',
		'enemies',
		'suggestions',
		'invuln',
		'downtime',
	]

	_wmCount = 0
	_mbCount = 0
	_apCount = 0

	_songCastEvents = []
	_deathEvents = []

	_wmCastEvents = []
	_mbCastEvents = []
	_apCastEvents = []


	constructor(...args) {
		super(...args)

		this.addHook('cast', {
			by: 'player',
			abilityId: [ACTIONS.THE_WANDERERS_MINUET.id, ACTIONS.MAGES_BALLAD.id, ACTIONS.ARMYS_PAEON.id],
		}, this._onSongCast)
		this.addHook('death', {
			to: 'player',
		}, this._onDeath)
		this.addHook('complete', this._onComplete)
	}

	_onSongCast(event) {
		const actionId = event.ability.guid
		switch (actionId) {
		case ACTIONS.THE_WANDERERS_MINUET.id:
			this._wmCastEvents.push(event)
			this._wmCount += 1
			break
		case ACTIONS.MAGES_BALLAD.id:
			this._mbCastEvents.push(event)
			this._mbCount += 1
			break
		case ACTIONS.ARMYS_PAEON.id:
			this._apCastEvents.push(event)
			this._apCount += 1
			break
		default:
			break
		}
		this._songCastEvents.push(event)
	}

	_onDeath(event) {
		this._deathEvents.push(event)
	}

	_onComplete() {

		//const fightDuration = (this.parser.fightDuration - this.downtime.getDowntime())/1000

	}

	// Method for debug purposes. Converts a timestamp into a time in seconds relative to the start of the encounter
	_formatTimestamp(timestamp) {
		return (timestamp - this.parser.fight.start_time)/1000
	}
}
