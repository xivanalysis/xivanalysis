import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
// in ms
const DRAGON_KICK_DURATION = 15000
const TWIN_SNAKES_DURATION = 15000
const THREE_GCD_BUFFER = 6021 // TODO: get this from gcd??

export default class BuffUptime extends Module {
	static handle = 'BuffUptime'
	static dependencies = [
		'checklist',
		'combatants',
		'enemies',
		'invuln',
		'suggestions',
	]

	// Dragon kick can be applied to multiple enemies
	_lastDragonKickUse = {}
	// Twin snakes can only be applied to self
	_lastTwinSnakesUse = {}

	_earlyDragonKicks = 0
	_earlyTwinSnakes = 0

	constructor(...args) {
		super(...args)

		const dk_filter = {
			by: 'player',
			abilityId: ACTIONS.DRAGON_KICK.id,
		}

		const ts_filter = {
			by: 'player',
			abilityId: STATUSES.TWIN_SNAKES.id,
		}

		// Using cast instead of applydebuff because the blunt resistance down debuff
		// gets applied in the logs much more often than dragon kick is actually
		// cast
		this.addHook('cast', dk_filter, this._onDragonKickApplication)
		this.addHook(['applybuff', 'refreshbuff'], ts_filter, this._onTwinSnakesApplication)
		this.addHook('complete', this._onComplete)
	}

	_onDragonKickApplication(event) {
		// Make sure we're tracking for this target
		const lastApplication = this._lastDragonKickUse[event.targetID]

		// If it's not been applied yet set it and skip out
		if (!lastApplication) {
			this._lastDragonKickUse[event.targetID] = event.timestamp
			return
		}

		const timeSinceLastApplication = event.timestamp - lastApplication
		if (timeSinceLastApplication < DRAGON_KICK_DURATION - THREE_GCD_BUFFER) {
			this._earlyDragonKicks++
		}
		this._lastDragonKickUse[event.targetID] = event.timestamp
	}

	_onTwinSnakesApplication(event) {
		// If it's not been applied yet set it and skip out
		if (!self._lastTwinSnakesUse) {
			self._lastTwinSnakesUse = event.timestamp
			return
		}

		const timeSinceLastApplication = event.timestamp - self._lastTwinSnakesUse
		if (timeSinceLastApplication < TWIN_SNAKES_DURATION - THREE_GCD_BUFFER) {
			this._earlyTwinSnakes++
		}
		self._lastTwinSnakesUse = event.timestamp
	}

	_onComplete() {
		this.checklist.add(new Rule({
			name: 'Keep Dragon Kick up',
			description: <Fragment>
				Dragon kick's blunt resistance debuff should always be applied to your primary target. Don't let it fall off.
			</Fragment>,
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.DRAGON_KICK} /> uptime</Fragment>,
					percent: () => this.getDebuffUptimePercent(STATUSES.BLUNT_RESISTANCE_DOWN.id),
				}),
			],
		}))

		this.checklist.add(new Rule({
			name: 'Keep your Twin Snakes up',
			description: <Fragment>
				It is essential to always have Twin Snakes buff applied as it increases your damage by 10%.
			</Fragment>,
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.TWIN_SNAKES} /> uptime</Fragment>,
					percent: () => this.getBuffUptimePercent(STATUSES.TWIN_SNAKES.id),
				}),
			],
		}))

		if (this._earlyTwinSnakes) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.TWIN_SNAKES.icon,
				content: <Fragment>
						Avoid refreshing {ACTIONS.TWIN_SNAKES.name} signficantly before its expiration -- That might be making you lose <ActionLink {...ACTIONS.TRUE_STRIKE} /> uses.
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: <Fragment>
					{this._earlyTwinSnakes} reapplications that were 3 GCD or more before expiration.
				</Fragment>,
			}))
		}

		if (this._earlyDragonKicks) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DRAGON_KICK.icon,
				content: <Fragment>
						Avoid refreshing {ACTIONS.DRAGON_KICK.name} signficantly before its expiration -- That might be making you lose <ActionLink {...ACTIONS.BOOTSHINE} /> uses.
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: <Fragment>
					{this._earlyDragonKicks} reapplications that were 3 GCD or more before expiration.
				</Fragment>,
			}))

		}
	}

	getDebuffUptimePercent(statusId) {
		const statusUptime = this.enemies.getStatusUptime(statusId)
		const fightDuration = this.parser.fightDuration - this.invuln.getInvulnerableUptime()

		return (statusUptime / fightDuration) * 100
	}

	getBuffUptimePercent(statusId) {
		const statusUptime = this.combatants.getStatusUptime(statusId, this.parser.player.id)
		const fightUptime = this.parser.fightDuration - this.invuln.getInvulnerableUptime()

		return (statusUptime / fightUptime) * 100
	}

}
