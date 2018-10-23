import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
//import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const JINPU_DURATION = 30000
const SHIFU_DURATION = 30000

const BUFF_BUFFER = 10000

export default class Buffs extends Module {
	static handle = 'buffs'
	static dependencies = [
		'checklist',
		'combatants',
		'invuln',
		'suggestions',
	]

	_JinpuUses = []
	_ShifuUses = []

	_earlyJinpuApplications = 0
	_earlyShifyApplications = 0

	constructor(...args) {
		super(...args)

		this.addHook(['applybuff', 'refreshbuff'], {by: 'player', abilityId: STATUSES.JINPU.id}, this._onJinpuApplication)
		this.addHook(['applybuff', 'refreshbuff'], {by: 'player', abilityId: STATUSES.SHIFU.id}, this._onShifuApplication)

		this.addHook('complete', this._onComplete)
	}

	_onJinpuApplication(event) {
		this._JinpuUses.unshift(event)

		if (this._JinpuUses.length < 2) {
			return
		}

		const current = this._JinpuUses[0].timestamp
		const previous = this._JinpuUses[1].timestamp
		const timeSinceLastApplication = current - previous

		if (timeSinceLastApplication < JINPU_DURATION - BUFF_BUFFER) {
			this._earlyJinpuApplications++
		}
	}

	_onShifuApplication(event) {
		this._ShifuUses.unshift(event)

		if (this._ShifuUses.length < 2) {
			return
		}

		const current = this._ShifuUses[0].timestamp
		const previous = this._ShifuUses[1].timestamp
		const timeSinceLastApplication = current - previous

		if (timeSinceLastApplication < SHIFU_DURATION - BUFF_BUFFER) {
			this._earlyShifuApplications++
		}
	}

	_onComplete() {
		this.checklist.add(new Rule({
			name: 'Keep Shifu and Jinpu up',
			description: 'Jinpu increases your damage by 10% and Shifu increases your speed by 10%. Both buffs are key part of Samurai\'s damage.',
			target: 95,
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.JINPU} /> uptime</Fragment>,
					percent: () => this.getUptimePercent(STATUSES.JINPU.id),
				}),

				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.SHIFU} /> uptime</Fragment>,
					percent: () => this.getUptimePercent(STATUSES.SHIFU.id),
				}),

			],
		}))

		if (this._earlyJinpuApplications) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.JINPU.icon,
				content: <Fragment>
						Avoid refreshing {ACTIONS.JINPU.name} significantly before its expiration -- That might be making you possibly lose resources.
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: <Fragment>
					{this._earlyJinpuApplications} reapplications that were {BUFF_BUFFER / 1000} or more seconds before expiration.
				</Fragment>,
			}))
		}

		if (this._earlyShifuApplications) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.SHIFU.icon,
				content: <Fragment>
                                                Avoid refreshing {ACTIONS.SHIFU.name} significantly before its expiration -- That might be making you possibly lose resources.
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: <Fragment>
					{this._earlyShifuApplications} reapplications that were {BUFF_BUFFER / 1000} or more seconds before expiration.
				</Fragment>,
			}))
		}

	}

	getUptimePercent(StatusId) {
		const statusUptime = this.combatants.getStatusUptime((StatusId), this.parser.player.id)
		const fightUptime = this.parser.fightDuration - this.invuln.getInvulnerableUptime()

		return (statusUptime / fightUptime) * 100
	}

}
