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
	static handle = 'movementSkills'
	static title = t('rdm.movementskills.title')`Movement Skills`
	static dependencies = [
		'checklist',
	]

	_history = []
	_lastManafic = {
		timestamp: 0,
		cac: 0,
		disp: 0,
		engagement: 0,
		events: [],
	}

	constructor(...args) {
		super(...args)

		this.addEventHook('cast', {
			by: 'player',
			abilityId: [
				ACTIONS.MANAFICATION.id,
				ACTIONS.CORPS_A_CORPS.id,
				ACTIONS.DISPLACEMENT.id,
				ACTIONS.ENGAGEMENT.id,
			],
		}, this._onCast)
		this.addEventHook('complete', this._onComplete)

		//So we don't get negative numbers on the final panel display
		this._lastManafic.timestamp = this.parser.fight.start_time
	}

	_onCast(event) {
		const abilityID = event.ability.guid
		if (this._lastManafic === null) {
			this._lastManafic = {
				timestamp: event.timestamp,
				cac: 0,
				disp: 0,
				engagement: 0,
				events: [],
			}
		}
		switch (abilityID) {
		case ACTIONS.MANAFICATION.id:
			//push the previous manafication instance
			this._history.push(this._lastManafic)
			//setup the new instance, since we're unlikely to end the fight on manafication push
			this._lastManafic = {
				timestamp: event.timestamp,
				cac: 0,
				disp: 0,
				engagement: 0,
				events: [],
			}
			return
		case ACTIONS.DISPLACEMENT.id:
			this._lastManafic.disp++
			break
		case ACTIONS.ENGAGEMENT.id:
			this._lastManafic.engagement++
			break
		case ACTIONS.CORPS_A_CORPS.id:
			this._lastManafic.cac++
			break
		}

		this._lastManafic.events.push(event)
	}

	_onComplete() {
		const requirements = []
		//Default Target to hit
		const target = 95
		const description = <Trans id="rdm.movementskills.description">Your movement skills are primarily used for damage, make sure you get 3 <ActionLink {...getDataBy(ACTIONS, 'id', ACTIONS.CORPS_A_CORPS.id)} /> and either 3 <ActionLink {...getDataBy(ACTIONS, 'id', ACTIONS.DISPLACEMENT.id)} /> or 4 <ActionLink {...getDataBy(ACTIONS, 'id', ACTIONS.ENGAGEMENT.id)} /> per <ActionLink {...getDataBy(ACTIONS, 'id', ACTIONS.MANAFICATION.id)} /> </Trans>
		this._history.push(this._lastManafic)

		//Parse out the final numbers
		const summary = this._history.reduce((acc, manafic) => ({
			manafics: acc.manafics + 1,
			cacs: acc.cacs + manafic.cac,
			disp: acc.disp + manafic.disp,
			engagement: acc.engagement + manafic.engagement,
		}), {
			cacs: 0,
			disp: 0,
			engagement: 0,
			manafics: 0,
		})

		//Credit for what you did since there was no final Manafication as boss died in nearly every instance
		//Also need to credit for there being no manafic on the opener, so you aren't dinged
		//Over the opening cac/disp
		//TODO: Consider coming up with Logic to detect if we came off CD right at the end or not, if we did -1 else -2
		summary.manafics = summary.manafics -2

		requirements.push(this._checkCac(summary.cacs, summary.manafics, ACTIONS.CORPS_A_CORPS.id))
		requirements.push(this._checkDisp(summary.disp, summary.engagement, ACTIONS.DISPLACEMENT.id, summary.manafics))

		//new Rule and adds the array of Requirements that just got generated
		this.checklist.add(new Rule({
			name: <Trans id="rdm.movementSkills.use-movement-cds">Use your Movement Skills</Trans>,
			description: description,
			requirements: requirements,
			target: target,
		}))
	}

	_checkCac(cacs, manafics, id) {
		let threshold = manafics * CACS_PER_MANAFICATION
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
		let finalValue = 0
		if (!disps) {
			disps = 0
		}

		if ((disps / DISPS_PER_MANAFICATION) === manafics || (engagements / ENGAGEMENTS_PER_MANAFICATION) === manafics) {
			//100%, no fail skip the rest
			return new Requirement({
				name: <ActionLink {...getDataBy(ACTIONS, 'id', dispID)} />,
				percent: 100,
			})
		}
		//Figure out how many Disps DONT fit into Displacement per manafication
		//This means that we need to deal with combinations of disp and engagement
		const leftoverDisps = disps % DISPS_PER_MANAFICATION
		//Now we need to figure out the Engagement threshold
		//We want the manafication count to be reduced by number of manafications we fully Disped for, then multiply
		//By how many engagement we need per minus the number of disps we had left over
		const engagementThreshold = ((manafics - ((disps - leftoverDisps) / DISPS_PER_MANAFICATION)) * ENGAGEMENTS_PER_MANAFICATION) - leftoverDisps
		//This will yield us the correct amount of total casts that needed to happen weighting properly disp v engagement
		const totalThreshold = engagementThreshold + disps
		//After discussing we're going to assume engagements were messed up if anything
		//Min it so we don't get over 100% due to graces for those who manage perfect play
		finalValue = Math.max(Math.min((((disps + engagements) / totalThreshold) * 100), 100), 0)

		return new Requirement({
			name: <ActionLink {...getDataBy(ACTIONS, 'id', dispID)} />,
			percent: finalValue,
		})
	}

	output() {
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
