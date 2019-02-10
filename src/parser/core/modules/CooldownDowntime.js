import React from 'react'
import {getAction} from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {ActionLink} from 'components/ui/DbLink'
import {i18nMark, Trans} from '@lingui/react'

export default class CooldownDowntime extends Module {
	static handle = 'cooldowndowntime'
	static title = 'CooldownDownTime'
	static dependencies = [
		'cooldowns',
		'checklist',
	]
	static i18n_id = i18nMark('core.cooldowndowntime.title')

	constructor(...args) {
		super(...args)
		//tracking the important™ CDs
		this.trackedCds = []
		//Default alloted time in ms before a OGCD is held for too long.
		//This value is used for all OGCDs, if not overwritten by allowedDowntimePerOgcd.
		this.allowedDowntime = 0
		//Default time in ms until a OGCD is held for too long at the beginning of a fight.
		//This value is used for all OGCDs, if not overwritten by firstUseOffsetPerOgcd.
		this.firstUseOffset = 0
		//This can be overwritten by each job to give each OGCD its own allowed time that the OGCD is held.
		//If no value for an ability id is provided the default value of allowedDowntime is used.
		this.allowedDowntimePerOgcd = {}
		//This can be overwritten by each job to give each OGCD its own allowed time before the OGCD is used for the first time.
		//If no value for an ability id is provided the default value of firstUseOffset is used.
		this.firstUseOffsetPerOgcd = {}
		//Default Target to hit
		this.target = 95
		this.description = <Trans id="core.cooldowndowntime.ogcd-cd-metric">Always make sure to use your OGCDs when they are up but don't clip them.  {this.allowedDowntime === 0 ? '' : <Trans id="core.cooldowndowntime.ogcd-cd-buffer">To account for random factors you are given a buffer of {this.parser.formatDuration(this.allowedDowntime)} seconds per instance to hold your cooldowns.</Trans>}</Trans>
		this.addHook('complete', this._onComplete)
	}

	_onComplete(event) {
		const endTime = event.timestamp
		const startTime = this.parser.fight.start_time
		const encounterLength = endTime - startTime
		const OGCDRequirements = []

		this.trackedCds.map(id => {
			const allowedDowntime = Number.isInteger(this.allowedDowntimePerOgcd[id]) ? this.allowedDowntimePerOgcd[id] : this.allowedDowntime
			const firstUseOffset = Number.isInteger(this.firstUseOffsetPerOgcd[id]) ? this.firstUseOffsetPerOgcd[id] : this.firstUseOffset
			const timeOnCooldown = this.cooldowns.getTimeOnCooldown(id, true, allowedDowntime)

			//calculate the downtime based on the start and stop values and sum the array
			//Adjust for the classes defined alloted time to allow a CD to be held
			//this supports classes like RDMs who routinely hold CDs due to procs
			//write the results as a new Requirement to show up later
			OGCDRequirements.push(
				new Requirement({
					name: <ActionLink {...getAction(id)} />,
					percent: this._percentFunction(
						id,
						encounterLength - timeOnCooldown + allowedDowntime,
						firstUseOffset,
						encounterLength
					),
				})
			)
		})

		//new Rule and adds the array of Requirements that just got generated
		this.checklist.add(new Rule({
			name: <Trans id="core.cooldowndowntime.use-ogcd-cds">Use your OGCDs</Trans>,
			description: this.description,
			requirements: OGCDRequirements,
			target: this.target,
		}))
	}
	//Furst's revised percent Calculation function
	_percentFunction(actionId, downtime, offset, fightlength) {
		const cooldown = getAction(actionId).cooldown
		downtime -= offset
		if (downtime < 0) {
			downtime = 0
		}
		//Code below takes remainder time into account. Imagine a 2 min encounter and a 90s OGCD. If you have a downtime of 30+s you will lose a usage due to encounter length constraints.
		const fightLengthRemainder = fightlength % (cooldown*1000)
		const possibleNumberOfUses = Math.ceil(fightlength/(cooldown*1000))
		return ((possibleNumberOfUses - (Math.floor(downtime/(cooldown*1000) + (downtime > fightLengthRemainder ? 1 : 0))))/possibleNumberOfUses)*100
	}
}
