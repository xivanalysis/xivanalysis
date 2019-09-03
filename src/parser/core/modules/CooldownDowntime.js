import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'
import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {ActionLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'

const UNGROUPED_COOLDOWN_ID = 'ungrouped'

export default class CooldownDowntime extends Module {
	static handle = 'cooldowndowntime'
	static title = t('core.cooldowndowntime.title')`Cooldown Downtime`
	static dependencies = [
		'cooldowns',
		'checklist',
	]

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
		this.checklistName = <Trans id="core.cooldowndowntime.use-ogcd-cds">Use your OGCDs</Trans>
		this.description = <Trans id="core.cooldowndowntime.ogcd-cd-metric">Always make sure to use your OGCDs when they are up but don't clip them.  {this.allowedDowntime === 0 ? '' : <Trans id="core.cooldowndowntime.ogcd-cd-buffer">To account for random factors you are given a buffer of {this.parser.formatDuration(this.allowedDowntime)} seconds per instance to hold your cooldowns.</Trans>}</Trans>
		this.addHook('complete', this._onComplete)
	}

	_onComplete(event) {
		const endTime = event.timestamp
		const startTime = this.parser.fight.start_time
		const encounterLength = endTime - startTime
		const OGCDRequirements = []

		const groups = {}
		this.trackedCds.forEach(id  => {
			const groupId = getDataBy(ACTIONS, 'id', id).cooldownGroup || UNGROUPED_COOLDOWN_ID
			const obj = groups[groupId] = groups[groupId] || []
			obj.push(id)
		})
		for (const key in groups) {
			if (key === UNGROUPED_COOLDOWN_ID) {
				//handle non-grouped cooldowns
				groups[key].map(id => {
					OGCDRequirements.push(this.checkCooldown(id, <ActionLink {...getDataBy(ACTIONS, 'id', id)} />, encounterLength))
				})
			} else {
				//handle cooldown group
				const displayName = groups[key].map((id, index) => {
					return <>
						{(index > 0) && ', '}
						<ActionLink {...getDataBy(ACTIONS, 'id', id)} />
					</>
				})
				OGCDRequirements.push(this.checkCooldown(groups[key][0], displayName, encounterLength))
			}
		}

		//new Rule and adds the array of Requirements that just got generated
		this.checklist.add(new Rule({
			name: this.checklistName,
			description: this.description,
			requirements: OGCDRequirements,
			target: this.target,
		}))
	}
	//Furst's revised percent Calculation function
	_percentFunction(actionId, downtime, offset, fightlength) {
		const action = getDataBy(ACTIONS, 'id', actionId)
		const cooldown = action && action.cooldown
		downtime -= offset
		if (downtime < 0) {
			downtime = 0
		}
		//Code below takes remainder time into account. Imagine a 2 min encounter and a 90s OGCD. If you have a downtime of 30+s you will lose a usage due to encounter length constraints.
		const fightLengthRemainder = fightlength % (cooldown*1000)
		const possibleNumberOfUses = Math.ceil(fightlength/(cooldown*1000))
		return ((possibleNumberOfUses - (Math.floor(downtime/(cooldown*1000) + (downtime > fightLengthRemainder ? 1 : 0))))/possibleNumberOfUses)*100
	}

	checkCooldown(id, displayName, encounterLength) {
		const allowedDowntime = Number.isInteger(this.allowedDowntimePerOgcd[id]) ? this.allowedDowntimePerOgcd[id] : this.allowedDowntime
		const firstUseOffset = Number.isInteger(this.firstUseOffsetPerOgcd[id]) ? this.firstUseOffsetPerOgcd[id] : this.firstUseOffset
		const timeOnCooldown = this.cooldowns.getTimeOnCooldown(id, true, allowedDowntime)

		//calculate the downtime based on the start and stop values and sum the array
		//Adjust for the classes defined alloted time to allow a CD to be held
		//this supports classes like RDMs who routinely hold CDs due to procs
		//write the results as a new Requirement to show up later
		return new Requirement({
			name: displayName,
			percent: this._percentFunction(
				id,
				encounterLength - timeOnCooldown + allowedDowntime,
				firstUseOffset,
				encounterLength
			),
		})
	}
}
