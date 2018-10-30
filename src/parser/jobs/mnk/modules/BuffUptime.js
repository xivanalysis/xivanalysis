import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS, {getAction} from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Suggestion, TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const GCD_CYCLE_LENGTH = 6

const BUFF_CHECK_SKILLS = [
	ACTIONS.DRAGON_KICK.id,
	ACTIONS.TWIN_SNAKES.id,
]

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
	_lastTwinSnakesUse = null

	_earlyDragonKicks = 0
	_earlyTwinSnakes = 0

	_gcdsSinceDK = {}
	_gcdsSinceTS = 0

	constructor(...args) {
		super(...args)

		// Hook all GCDs so we can count GCDs in buff windows
		this.addHook('cast', {by: 'player'}, this._onCast)

		// Apparently DK is a bit busted but let's use the debuff for now
		this.addHook(['applybuff', 'refreshbuff'], {by: 'player', abilityId: STATUSES.BLUNT_RESISTANCE_DOWN.id}, this._onDragonKick)
		this.addHook(['applybuff', 'refreshbuff'], {by: 'player', abilityId: STATUSES.TWIN_SNAKES.id}, this._onTwinSnakes)

		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const action = getAction(event.ability.guid)

		if (!action) {
			return
		}

		// Only include GCDs, but don't double increment either
		if (action.onGcd && !BUFF_CHECK_SKILLS.includes(action)) {
			if (this._lastDragonKickUse[event.targetID]) {
				this._gcdsSinceDK[event.targetID]++
			}

			if (this._lastTwinSnakesUse !== null) {
				this._gcdsSinceTS++
			}
		}
	}

	_onDragonKick(event) {
		// Make sure we're tracking for this target
		const lastApplication = this._lastDragonKickUse[event.targetID]

		// If it's not been applied yet set it and skip out
		if (!lastApplication) {
			this._lastDragonKickUse[event.targetID] = event.timestamp
			return
		}

		// This logic is busted if the player's GCD is under 1.67s
		if (this._gcdsSinceDK[event.targetID] < GCD_CYCLE_LENGTH) {
			this._earlyDragonKicks++
		}

		this._lastDragonKickUse[event.targetID] = event.timestamp
		this._gcdsSinceDK[event.targetID] = 0
	}

	_onTwinSnakes(event) {
		// If it's not been applied yet set it and skip out
		if (!this._lastTwinSnakesUse) {
			this._lastTwinSnakesUse = event.timestamp
			return
		}

		if (this._gcdsSinceTS < GCD_CYCLE_LENGTH) {
			this._earlyTwinSnakes++
		}

		this._lastTwinSnakesUse = event.timestamp
		this._gcdsSinceTS = 0
	}

	_onComplete() {
		this.checklist.add(new Rule({
			name: 'Keep Dragon Kick up',
			description: <Fragment>
				Dragon Kick's blunt resistance debuff should always be applied to your primary target.
			</Fragment>,
			displayOrder: DISPLAY_ORDER.DRAGON_KICK,
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.DRAGON_KICK} /> uptime</Fragment>,
					percent: () => this.getDebuffUptimePercent(STATUSES.BLUNT_RESISTANCE_DOWN.id),
				}),
			],
		}))

		this.checklist.add(new Rule({
			name: 'Keep Twin Snakes up',
			description: <Fragment>
				Twin Snakes is an easy 10% buff to your DPS across the board.
			</Fragment>,
			displayOrder: DISPLAY_ORDER.TWIN_SNAKES,
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.TWIN_SNAKES} /> uptime</Fragment>,
					percent: () => this.getBuffUptimePercent(STATUSES.TWIN_SNAKES.id),
				}),
			],
		}))

		if (this._earlyDragonKicks) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DRAGON_KICK.icon,
				content: <Fragment>
					Avoid refreshing <ActionLink {...ACTIONS.DRAGON_KICK} /> signficantly before its expiration as you're trading it for the higher damage <ActionLink {...ACTIONS.BOOTSHINE} />.
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: <Fragment>
					{this._earlyDragonKicks} rotation cycles were interrupted by early refreshes.
				</Fragment>,
			}))
		}

		if (this._earlyTwinSnakes) {
			const lostTruePotency = this._earlyTwinSnakes * (ACTIONS.TRUE_STRIKE.potency - ACTIONS.TWIN_SNAKES.potency)

			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.TWIN_SNAKES.icon,
				content: <Fragment>
					Avoid refreshing <ActionLink {...ACTIONS.TWIN_SNAKES} /> signficantly before its expiration as you're losing uses of the higher potency <ActionLink {...ACTIONS.TRUE_STRIKE} />.
				</Fragment>,
				tiers: {
					1: SEVERITY.MEDIUM,
					4: SEVERITY.MAJOR,
				},
				value: this._earlyTwinSnakes,
				why: <Fragment>
					{lostTruePotency} potency lost to {this._earlyTwinSnakes} early refreshes.
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
