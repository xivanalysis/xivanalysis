import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'
import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {ActionLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'

export default class MovementCDs extends Module {
	static handle = 'movementcds'
	static title = t('rdm.movementcooldowns.title')`Movement Cooldown Downtime`
	static dependencies = [
		'checklist',
	]

_history = {
	manafication: [],
	cac: [],
	disp: [],
	engagement: [],
	enchanted_reprise: [],
}

_trackedCooldowns = [
	ACTIONS.ENCHANTED_REPRISE.id,
	ACTIONS.MANAFICATION.id,
	ACTIONS.DISPLACEMENT.id,
	ACTIONS.ENGAGEMENT.id,
	ACTIONS.CORPS_A_CORPS.id,
]

constructor(...args) {
	super(...args)
	//Default Target to hit
	this.target = 95
	this.addHook('complete', this._onComplete)
	this.addHook('cast', {by: 'player'}, this._onCast)
}

_onCast(event) {
	const abilityID = event.ability.guid
	switch (abilityID) {
	case ACTIONS.ENCHANTED_REPRISE.id:
		this._history.enchanted_reprise.push({t: event.timestamp})
		break
	case ACTIONS.MANAFICATION.id:
		this._history.manafication.push({t: event.timestamp})
		break
	case ACTIONS.DISPLACEMENT.id:
		this._history.disp.push({t: event.timestamp})
		break
	case ACTIONS.ENGAGEMENT.id:
		this._history.engagement.push({t: event.timestamp})
		break
	case ACTIONS.CORPS_A_CORPS.id:
		this._history.cac.push({t: event.timestamp})
		break
	}
}

_onComplete() {
	const OGCDRequirements = []

	this.trackedCds.map(id => {
		//calculate the downtime based on the start and stop values and sum the array
		//Adjust for the classes defined alloted time to allow a CD to be held
		//this supports classes like RDMs who routinely hold CDs due to procs
		//write the results as a new Requirement to show up later
	// 	OGCDRequirements.push(
	// 		new Requirement({
	// 			name: <ActionLink {...getDataBy(ACTIONS, 'id', id)} />,
	// 			percent: this._percentFunction(
	// 				id,
	// 				firstUseOffset,
	// 			),
	// 		})
	// 	)
	// })

	//new Rule and adds the array of Requirements that just got generated
	this.checklist.add(new Rule({
		name: <Trans id="core.cooldowndowntime.use-ogcd-cds">Use your OGCDs</Trans>,
		description: this.description,
		requirements: OGCDRequirements,
		target: this.target,
	}))
}
}
