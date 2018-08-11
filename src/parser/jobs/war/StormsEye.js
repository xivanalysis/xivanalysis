import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from '../../core/modules/Checklist'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const STORMS_EYE_DURATION = 30000
const STORMS_EYE_BUFFER = 10000

export default class StormsEye extends Module {
	static handle = 'stormseye'
	static dependencies = [
		'checklist',
		'combatants',
		'invuln',
		'suggestions',
	]

	_stormsEyeUses = []
	_earlyApplications = 0

	constructor(...args) {
		super(...args)

		const filter = {
			by: 'player',
			abilityId: STATUSES.STORMS_EYE.id,
		}
		this.addHook('applybuff', filter, this._onStormsEyeApplication)
		this.addHook('refreshbuff', filter, this._onStormsEyeApplication)
		this.addHook('complete', this._onComplete)
	}

	_onStormsEyeApplication(event) {
		this._stormsEyeUses.unshift(event)

		if (this._stormsEyeUses.length < 2) {
			return
		}

		const current = this._stormsEyeUses[0].timestamp
		const previous = this._stormsEyeUses[1].timestamp
		const timeSinceLastApplication = current - previous

		if (timeSinceLastApplication < STORMS_EYE_DURATION - STORMS_EYE_BUFFER) {
			this._earlyApplications++
		}
	}

	_onComplete() {
		this.checklist.add(new Rule({
			name: 'Keep Storm\'s Eye up',
			description: 'Storm\'s Eye increases your damage by 10%, it is a huge part of a Warrior\'s damage.',
			target: 90,
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.STORMS_EYE} /> uptime</Fragment>,
					percent: () => this.getUptimePercent(),
				}),
			],
		}))

		if (this._earlyApplications) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.STORMS_EYE.icon,
				content: <Fragment>
						Avoid refreshing {ACTIONS.STORMS_EYE.name} significantly before its expiration -- That might be making you possibly lose <ActionLink {...ACTIONS.STORMS_PATH} /> uses.
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: <Fragment>
					{this._earlyApplications} reapplications that were {STORMS_EYE_BUFFER / 1000} or more seconds before expiration.
				</Fragment>,
			}))
		}
	}

	//
	getUptimePercent() {
		const statusUptime = this.combatants.getStatusUptime(STATUSES.STORMS_EYE.id, this.parser.player.id)
		const fightUptime = this.parser.fightDuration - this.invuln.getInvulnerableUptime()

		return (statusUptime / fightUptime) * 100
	}
}
