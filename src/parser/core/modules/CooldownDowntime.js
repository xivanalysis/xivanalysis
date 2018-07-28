import React from 'react'
import {getAction} from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {ActionLink} from 'components/ui/DbLink'

export default class CooldownDowntime extends Module {
	static handle = 'cooldowndowntime'
	static dependencies = [
		'combatants',
		'cooldowns',
		'suggestions',
		'checklist',
		'downtime',
	]

//Downtime Actions IDs
_downTime = {}

constructor(...args) {
	super(...args)
	//tracking the important™ CDs
	this.trackedcds = []
	//Default alloted time before a spell is held too long.
	this.downtimeOkTime = 0

	this.addHook('begincast', {by: 'player'}, this._cooldownCheck)
	this.addHook('cast', {by: 'player'}, this._cooldownCheck)
	this.addHook('complete', this._onComplete)
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
		//Adjust for the classes defined alloted time to allow a CD to be held
		//this supports classes like RDMs who routinely hold CDs due to procs
		const totalSumOfDownTime = dt.history.map(downTime => {
			return this._getDownTimeAdjustedForInvuln(downTime.starttime, downTime.stoptime)
			//return Math.max(downTime.stoptime - downTime.starttime - this._downtimeOkTime, 0)
		}).reduce(
			(accumulator, currentValue) => accumulator + currentValue
		)
		//write the results as a new Requirement to show up later
		OGCDRequirements.push(
			new Requirement({
				name: <ActionLink {...getAction(id)} />,
				percent: this._percentFunction(id, totalSumOfDownTime, encounterLength),
			})
		)

	})

	//new Rule and adds the array of Requirements that just got generated
	this.checklist.add(new Rule({
		name: 'Use your OGCDs',
		description: `Always make sure to use your OGCDs when they are up but don't clip them.  ${this.downtimeOkTime === 0 ? '' : `To account for random factors you are given a buffer of ${this.downtimeOkTime/1000} seconds per instance to use your CD`}`,
		requirements: OGCDRequirements,
		target: 95,
	}))
}

	/**
	 * Gets the Downtime of a CD adjusted for boss invuln windows as well as globally allowed
	 * buffer set by the extender class module
	 * @param {int} startTime Start Time of the CD Downtime
	 * @param {int} stopTime Stop Time of the CD Downtime
	 */
_getDownTimeAdjustedForInvuln(startTime, stopTime) {
	const invuln = this.downtime.getDowntime(startTime, stopTime)
	return Math.max(stopTime - startTime - invuln - this.downtimeOkTime, 0)
}

	//Furst's revised percent Calculation function
_percentFunction(actionId, downtime, fightlength) {
	const cooldown = getAction(actionId).cooldown
	const possibleNumberOfUses = Math.floor(fightlength/(cooldown*1000))
	return ((possibleNumberOfUses - Math.floor(downtime/(cooldown*1000)))/possibleNumberOfUses)*100
}

_cooldownCheck(event) {
	const actionId = event.ability.guid

	//if we get one of the OGCDs stop downtime the old downtime and start a new one
	if (this.trackedcds.includes(actionId)) {
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
