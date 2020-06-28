import {Trans} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const STORMS_EYE_DURATION = 30000
const STORMS_EYE_BUFFER = 7000

export default class StormsEye extends Module {
	static handle = 'stormseye'
	static dependencies = [
		'checklist',
		'combatants',
		'entityStatuses',
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
		this.addEventHook('applybuff', filter, this._onStormsEyeApplication)
		this.addEventHook('refreshbuff', filter, this._onStormsEyeApplication)
		this.addEventHook('complete', this._onComplete)
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
			name: <Trans id="war.stormseye.checklist.name">Keep Storm's Eye Up</Trans>,
			description: <Trans id="war.stormseye.checklist.description">Storm's Eye increases your damage by 10%, it is a substantial part of a Warrior's damage.</Trans>,
			target: 90,
			requirements: [
				new Requirement({
					name: <Trans id="war.stormseye.checklist.uptime"><ActionLink {...ACTIONS.STORMS_EYE} /> uptime</Trans>,
					percent: () => this.getUptimePercent(),
				}),
			],
		}))

		if (this._earlyApplications) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.STORMS_EYE.icon,
				content: <Trans id="war.suggestions.stormseye.content">
						Avoid refreshing {ACTIONS.STORMS_EYE.name} significantly before its expiration -- That might be making you possibly lose <ActionLink {...ACTIONS.STORMS_PATH} /> uses.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="war.suggestions.stormseye.why">
					{this._earlyApplications} reapplications that were {STORMS_EYE_BUFFER / 1000} or more seconds before expiration.
				</Trans>,
			}))
		}
	}

	//
	getUptimePercent() {
		const statusUptime = this.entityStatuses.getStatusUptime(STATUSES.STORMS_EYE.id, this.combatants.getEntities())
		const fightUptime = this.parser.currentDuration - this.invuln.getInvulnerableUptime()

		return (statusUptime / fightUptime) * 100
	}
}
