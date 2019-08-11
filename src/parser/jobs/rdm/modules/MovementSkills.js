import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React, {Fragment} from 'react'
import {Accordion, Message} from 'semantic-ui-react'

import ACTIONS from 'data/ACTIONS'
import Rotation from 'components/ui/Rotation'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {ActionLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'

const CACS_PER_MANAFICATION = 3
const DISPS_PER_MANAFICATION = 3
const ENGAGEMENTS_PER_MANAFICATION = 4
//This is due to the fact that manafication happens after your first cac/disp
const GRACE_FOR_PULL = 2

export default class MovementSkills extends Module {
	static handle = 'movementskills'
	static title = t('rdm.movementskills.title')`Movement Skills`
	static dependencies = [
		'checklist',
	]

	_history = []
	//Used to generate the list of skills for visibility later
	_overallCastHistory = []
	_last_manafic = {
		timestamp: 0,
		cac: 0,
		disp: 0,
		engagement: 0,
		events: [],
	}

	constructor(...args) {
		super(...args)
		//Default Target to hit
		this.target = 95
		this.addHook('cast', {by: 'player'}, this._onCast)
		//this._history.push(this._last_manafic)
		this.description = <Trans id="rdm.movementskills.description">Your movement skills are primarily used for damage, make sure you get 3 <ActionLink {...getDataBy(ACTIONS, 'id', ACTIONS.CORPS_A_CORPS.id)} /> and either 3 <ActionLink {...getDataBy(ACTIONS, 'id', ACTIONS.DISPLACEMENT.id)} /> or 4 <ActionLink {...getDataBy(ACTIONS, 'id', ACTIONS.ENGAGEMENT.id)} /> per <ActionLink {...getDataBy(ACTIONS, 'id', ACTIONS.MANAFICATION.id)} /> </Trans>
		this.addHook('complete', this._onComplete)
		this._last_manafic.timestamp = this.parser.fight.start_time
	}

	_onCast(event) {
		const abilityID = event.ability.guid
		switch (abilityID) {
		case ACTIONS.MANAFICATION.id:
			//push the previous manafication instance
			this._history.push(this._last_manafic)
			this._overallCastHistory.push(event)
			//setup the new instance, since we're unlikely to end the fight on manafication
			this._last_manafic = {
				timestamp: event.timestamp,
				cac: 0,
				disp: 0,
				engagement: 0,
				events: [],
			}
			break
		case ACTIONS.DISPLACEMENT.id:
			this._overallCastHistory.push(event)
			if (this._last_manafic) {
				this._last_manafic.disp++
				this._last_manafic.events.push(event)
			}
			break
		case ACTIONS.ENGAGEMENT.id:
			this._overallCastHistory.push(event)
			if (this._last_manafic) {
				this._last_manafic.engagement++
				this._last_manafic.events.push(event)
			}
			break
		case ACTIONS.CORPS_A_CORPS.id:
			this._overallCastHistory.push(event)
			if (this._last_manafic) {
				this._last_manafic.cac++
				this._last_manafic.events.push(event)
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
		requirements.push(...this._checkDisp(disp, engagement, ACTIONS.DISPLACEMENT.id, manafics))

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

		return new Requirement({
			name: <ActionLink {...getDataBy(ACTIONS, 'id', id)} />,
			percent: finalValue,
		})
	}

	_checkDisp(disps, engagements, dispID, manafics) {
		let noFail = 0
		let finalValue = 0
		const requirements = []
		if (!disps) {
			disps = 0
		}

		if ((disps / DISPS_PER_MANAFICATION) === manafics || (engagements / ENGAGEMENTS_PER_MANAFICATION) === manafics) {
			noFail = 100
		} else {
			//Figure out how many Disps DONT fit into Displacement per manafication
			//This means that we need to deal with combinations of disp and engagement
			const leftoverDisps = disps % DISPS_PER_MANAFICATION
			//Now we need to figure out the Engagement threshold
			//We want the manafication count to be reduced by number of manafications we fully Disped for, then multiply
			//By how many engagement we need per minus the number of disps we had left over
			const engagementThreshold = ((manafics - ((disps - leftoverDisps) / DISPS_PER_MANAFICATION)) * ENGAGEMENTS_PER_MANAFICATION) - leftoverDisps
			const totalThreshold = engagementThreshold + disps
			//For now, we'll just assume you screwed the engagement usage until TC's tell me otherwise
			finalValue = ((disps + engagements) / totalThreshold) * 100
		}

		if (noFail > 0) {
			requirements.push(new Requirement({
				name: <ActionLink {...getDataBy(ACTIONS, 'id', dispID)} />,
				percent: noFail,
			}))
		} else {
			requirements.push(new Requirement({
				name: <ActionLink {...getDataBy(ACTIONS, 'id', dispID)} />,
				percent: finalValue,
			}))
		}

		return requirements
	}

	output() {
		// const panels = [{
		// 	title: {
		// 		key: 'title-movementskills',
		// 		content: <Fragment>
		// 				Movement Skills
		// 		</Fragment>,
		// 	},
		// 	content: {
		// 		key: 'content-movemetskills',
		// 		content: <Rotation events={this._overallCastHistory}/>,
		// 	},
		// }]
		//console.log(`${JSON.stringify(this._history, null, 4)}`)

		const panels = this._history.map(manafic => {
			return {
				key: manafic.timestamp,
				title: {
					key: 'title-' + manafic.timestamp,
					content: <Fragment>
						{this.parser.formatTimestamp(manafic.timestamp)}
						<span> - </span>
						{manafic.events.length} <Trans id="rdm.movementskills.panels.content">Movement Skills used</Trans>
					</Fragment>,
				},
				content: {
					key: 'content-' + manafic.timestamp,
					content: <Rotation events={manafic.events}/>,
				},
			}
		})

		return <Fragment>
			<Message>
				<Trans id="rdm.movementskills.accordion.message">The list below contains every Movement Skill used in your opener and after each <ActionLink {...getDataBy(ACTIONS, 'id', ACTIONS.MANAFICATION.id)} /></Trans>
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
