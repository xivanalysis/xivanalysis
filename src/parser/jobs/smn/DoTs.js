import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'

export default class DoTs extends Module {
	static handle = 'dots'
	static dependencies = [
		'checklist',
		'cooldowns',
		'enemies',
		'invuln',
	]

	constructor(...args) {
		super(...args)
		this.addHook('complete', this._onComplete)
	}

	_onComplete() {
		// Checklist rule for dot uptime
		this.checklist.add(new Rule({
			name: 'Keep your DoTs up',
			description: <Fragment>
				As a Summoner, DoTs are significant portion of your sustained damage, and are required for optimal damage from <ActionLink {...ACTIONS.FESTER} />, your primary stack spender. Aim to keep them up at all times.
			</Fragment>,
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.BIO_III} /> uptime</Fragment>,
					percent: () => this.getDotUptimePercent(STATUSES.BIO_III.id),
				}),
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.MIASMA_III} /> uptime</Fragment>,
					percent: () => this.getDotUptimePercent(STATUSES.MIASMA_III.id),
				}),
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.SHADOW_FLARE}/> cooldown uptime</Fragment>,
					percent: () => this.getShadowFlareUptimePercent(),
				}),
			],
		}))
	}

	getDotUptimePercent(statusId) {
		const statusUptime = this.enemies.getStatusUptime(statusId)
		let fightDuration = this.parser.fightDuration

		fightDuration -= this.invuln.getInvulnerableUptime()

		return (statusUptime / fightDuration) * 100
	}

	getShadowFlareUptimePercent() {
		// Need to do this manually, as I want to remove boss invuln periods from the total
		const cdHistory = this.cooldowns.getCooldown(ACTIONS.SHADOW_FLARE.id).history
		const uptime = cdHistory.reduce((carry, cd) => {
			// Removing invuln time from the CD, we're not really counting it
			const invulnTime = this.invuln.getInvulnerableUptime('all', cd.timestamp, cd.timestamp + cd.length)
			return carry + cd.length - invulnTime
		}, 0)

		const duration = this.parser.fightDuration - this.invuln.getInvulnerableUptime()
		return (uptime / duration) * 100
	}
}
