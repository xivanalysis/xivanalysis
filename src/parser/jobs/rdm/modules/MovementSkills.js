import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'
import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {ActionLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'

const CACS_PER_MANAFICATION = 3
const DISPS_PER_MANAFICATION = 3
const ENGAGEMENTS_PER_MANAFICATION = 4
//const TIME_NOT_CASTING_SHOULD_USE_REPRISE = 2.5
const GRACE_FOR_PULL = 2

export default class MovementSkills extends Module {
	static handle = 'movementskills'
	static title = t('rdm.movementskills.title')`Movement Skills`
	static dependencies = [
		'checklist',
	]

	_history = []
	_repriseHistory = []
	_last_manafic = {
		timestamp: 0,
		cac: 0,
		disp: 0,
		engagement: 0,
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
		this.addHook('cast', {by: 'player'}, this._onCast)
		this._history.push(this._last_manafic)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const abilityID = event.ability.guid
		switch (abilityID) {
		case ACTIONS.ENCHANTED_REPRISE.id:
			this._repriseHistory.push(event.timestamp)
			break
		case ACTIONS.MANAFICATION.id:
			//push the previous manafication instance
			this._history.push(this._last_manafic)
			//setup the new instance, since we're unlikely to end the fight on manafication
			this._last_manafic = {
				timestamp: event.timestamp,
				cac: 0,
				disp: 0,
				engagement: 0,
			}
			break
		case ACTIONS.DISPLACEMENT.id:
			if (this._last_manafic) {
				this._last_manafic.disp++
			}
			break
		case ACTIONS.ENGAGEMENT.id:
			if (this._last_manafic) {
				this._last_manafic.engagement++
			}
			break
		case ACTIONS.CORPS_A_CORPS.id:
			if (this._last_manafic) {
				this._last_manafic.cac++
			}
			break
		}
	}

	_onComplete() {
		let cacs = 0
		let disp = 0
		let engagement = 0
		let manafics = 0
		const requirements = []

		//Parse out the final numbers
		this._history.map(manafic => {
			manafics++
			cacs += manafic.cac
			disp += manafic.disp
			engagement += manafic.engagement
		})

		//Credit for what you did since there was no final Manafication as boss died
		cacs += this._last_manafic.cac
		disp += this._last_manafic.disp
		engagement + this._last_manafic.engagement

		const cacTarget = manafics * CACS_PER_MANAFICATION
		requirements.push(this._checkCac(cacs, cacTarget, ACTIONS.CORPS_A_CORPS.id))
		console.log(`${JSON.stringify(requirements, null, 4)}`)

		requirements.push(...this._checkDisp(disp, engagement, ACTIONS.DISPLACEMENT.id, ACTIONS.ENGAGEMENT.id, manafics))
		console.log(`${JSON.stringify(requirements, null, 4)}`)

		//new Rule and adds the array of Requirements that just got generated
		this.checklist.add(new Rule({
			name: <Trans id="rdm.movementSkills.use-movement-cds">Use your Movement Skills</Trans>,
			description: this.description,
			requirements: requirements,
			target: this.target,
		}))
	}

	_checkCac(cacs, threshold, id) {
		let finalValue = 0
		threshold -= GRACE_FOR_PULL
		if (cacs > threshold) {
			finalValue = 100
		} else {
			finalValue = cacs / threshold * 100
		}
		console.log(finalValue)
		return new Requirement({
			name: <ActionLink {...getDataBy(ACTIONS, 'id', id)} />,
			percent: finalValue,
		})
	}

	_checkDisp(disps, engagements, dispID, engagementID, manafics) {
		let dispValue = 0
		let noFail = 0
		let engagementValue = 0
		const requirements = []
		if ((disps / DISPS_PER_MANAFICATION) === manafics || (engagements / ENGAGEMENTS_PER_MANAFICATION) === manafics) {
			noFail = 100
		} else {
			//Figure out how many Disps DONT fit into Displacement per manafication
			//This means that we need to deal with combinations of disp and engagement
			const leftoverDisps = disps > 0 ? disps % DISPS_PER_MANAFICATION : 0
			//Now we need to figure out the Engagement threshold
			//We want the manafication count to be reduced by number of manafications we fully Disped for, then multiply
			//By how many engagement we need per minus the number of disps we had left over
			const engagementThreshold = ((manafics - disps > 0 ? ((disps - leftoverDisps) / DISPS_PER_MANAFICATION) : 0) * ENGAGEMENTS_PER_MANAFICATION) - leftoverDisps
			//For now, we'll just assume you screwed the engagement usage until TC's tell me otherwise
			dispValue = 100
			engagementValue = engagements/engagementThreshold * 100
		}

		console.log('disps: ' + disps)
		console.log('engagements: ' + engagements)
		console.log('manafics: ' + manafics)

		if (noFail > 0) {
			requirements.push(new Requirement({
				name: <ActionLink {...getDataBy(ACTIONS, 'id', dispID)} />,
				percent: noFail,
			}))
			requirements.push(new Requirement({
				name: <ActionLink {...getDataBy(ACTIONS, 'id', engagementID)} />,
				percent: noFail,
			}))
		} else {
			requirements.push(new Requirement({
				name: <ActionLink {...getDataBy(ACTIONS, 'id', dispID)} />,
				percent: dispValue,
			}))
			requirements.push(new Requirement({
				name: <ActionLink {...getDataBy(ACTIONS, 'id', engagementID)} />,
				percent: engagementValue,
			}))
		}

		console.log(`${JSON.stringify(requirements, null, 4)}`)

		return requirements
	}
}
