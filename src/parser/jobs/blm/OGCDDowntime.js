//import React, {Fragment} from 'react'
//import {ActionLink} from 'components/ui/DbLink'
import ACTIONS, {getAction} from 'data/ACTIONS'
//import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
//import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {Rule, Requirement} from 'parser/core/modules/Checklist'

//tracking the important™ CDs
const TRACKEDCDS = [
	ACTIONS.LEY_LINES.id,
	ACTIONS.SHARPCAST.id,
	ACTIONS.TRIPLECAST.id,
	ACTIONS.CONVERT.id,
]

export default class Blmcooldowns extends Module {
	static handle = 'blmcooldowns'
	static dependencies = [
		'combatants',
		'cooldowns',
		'suggestions',
		'gauge',
		'checklist',
	]

	_downTime = {}

	constructor(...args) {
		super(...args)
		this.addHook('begincast', {by: 'player'}, this._onBegin)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('complete', this._onComplete)
	}

	_onBegin(event) {

		//do the check on begin (even tho they don't have a cast time)
		this._cooldownCheck(event)
	}

	_onCast(event) {

		//do the check at every cast
		this._cooldownCheck(event)
	}

	_onComplete(event) {
		const endTime = event.timestamp
		const startTime = this.parser.fight.start_time
		const encounterLength = endTime - startTime
		const OGCDRequirements = []
		Object.keys(this._downTime).forEach(id => {
			const dt = this._downTime[id]

			//wrap up all the open ones and save them in history
			if (dt.current) {
				dt.current.stoptime = endTime
				dt.history.push(dt.current)
				dt.current = null
			}

			//calculate the downtime based on the start and stop values and sum the array
			const totalSumOfDownTime = dt.history.map(downTime => {
				return Math.max(downTime.stoptime - downTime.starttime, 0)
			}).reduce(
				(accumulator, currentValue) => accumulator + currentValue
			)

			//write the results as a new Requirement to show up later
			OGCDRequirements.push(
				new Requirement({
					name: getAction(id).name,
					percent: this._percentFunction(id, totalSumOfDownTime, encounterLength),

				})
			)
		})

		//new Rule and adds the array of Requirements that just got generated
		this.checklist.add(new Rule({
			name: 'Use your OGCDs',
			description: 'Always make sure to use your OGCDs when they are up but don\'t clip them. Utilize your procs or fast Blizzard III or Fire IIIs.',
			requirements: OGCDRequirements,
			target: 99,
		}))
	}

	//cool function that I invented that just sets ok usage as 98% and falls very quickly
	_percentFunction(actionId, downtime, fightlength) {
		const cooldown = getAction(actionId).cooldown
		const possibleNumberOfUses = Math.floor(fightlength/(cooldown*1000))
		return ((possibleNumberOfUses - Math.floor(downtime/(cooldown*1000)))/possibleNumberOfUses)*100
	}

	_cooldownCheck(event) {
		const actionId = event.ability.guid

		//if we get one of the OGCDs stop downtime the old downtime and start a new one
		if (TRACKEDCDS.includes(actionId)) {
			this._stopDowntime(actionId)
			this._startDowntime(actionId)
		}
	}

	_getDowntime(actionId) {
		return this._downTime[actionId] || {
			current: null,
			history: [],
		}
	}

	_startDowntime(actionId) {
		const action = getAction(actionId)

		//generating a new downtime or pshing the old in history
		const dt = this._getDowntime(actionId)
		if (dt.current) {
			dt.history.push(dt.current)
		}

		//start of downtime based on CD of the OGCD and save it
		dt.current = {
			starttime: this.parser.currentTimestamp + action.cooldown * 1000,
			stoptime: null,
		}
		this._downTime[actionId] = dt

	}

	_stopDowntime(actionId) {
		const dt = this._getDowntime(actionId)

		//see if there is something to stop even
		if (dt.current == null) {
			return
		}
		if (dt.current.starttime == null) {
			return
		}

		//save the stop of the downtime as a timestamp
		dt.current.stoptime = this.parser.currentTimestamp
		this._downTime[actionId] = dt
	}

}
