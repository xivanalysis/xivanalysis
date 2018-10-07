import {Trans} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS, {getAction} from 'data/ACTIONS'
//import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const AMMO_BUILDERS = {
	[ACTIONS.RELOAD.id]: 3,
	[ACTIONS.QUICK_RELOAD.id]: 1,
}

const MAX_AMMO = 3

const OVERWRITE_FORGIVENESS_WINDOW = 4000 // Don't count overwritten ammo against the player in the first 4s of the fight

export default class Ammo extends Module {
	static handle = 'ammo'
	static dependencies = [
		'invuln',
		'suggestions',
	]

	_ammoCount = MAX_AMMO // Null assumption
	_wastedAmmo = 0
	_badAmmoUses = {
		[ACTIONS.SPREAD_SHOT.id]: 0,
		[ACTIONS.HOT_SHOT.id]: 0,
		[ACTIONS.COOLDOWN.id]: 0,
	}

	_ammoSpent = false

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player', abilityId: Object.keys(AMMO_BUILDERS).map(Number)}, this._onBuilderCast)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('aoedamage', {by: 'player', abilityId: ACTIONS.SPREAD_SHOT.id}, this._onSpreadAoe)
		this.addHook('complete', this._onComplete)
	}

	_onBuilderCast(event) {
		this._ammoCount += AMMO_BUILDERS[event.ability.guid]
		if (this._ammoCount > MAX_AMMO) {
			if (!this.invuln.isUntargetable('all', event.timestamp) || (event.timestamp - this.parser.fight.start_time) < OVERWRITE_FORGIVENESS_WINDOW) {
				// Only count waste against the player if it happens during uptime and isn't right at the start
				this._wastedAmmo += (this._ammoCount - MAX_AMMO)
			}
			this._ammoCount = MAX_AMMO
		}
	}

	_onCast(event) {
		this._ammoSpent = false // Reset the flag on every cast

		const action = getAction(event.ability.guid)
		if (action.onGcd) {
			if (this._ammoCount > 0) {
				this._ammoSpent = true // If it's a GCD and we have ammo, flag it as as a spender
				if (this._badAmmoUses.hasOwnProperty(action.id)) {
					this._badAmmoUses[action.id]++
				}

				this._ammoCount--
			}
		}
	}

	_onSpreadAoe(event) {
		// If they expended ammo on an AoE Spread Shot, it's a valid use on 3+ targets. Decrement the count (since the cast should've incremented it)
		// and floor it at 0 juuuuuuust in case the parse is fucky and we somehow got the aoedamage event without a corresponding cast.
		if (event.hits.length > 2) {
			this._badAmmoUses[ACTIONS.SPREAD_SHOT.id] = Math.max(this._badAmmoUses[ACTIONS.SPREAD_SHOT.id] - 1, 0)
		}
	}

	_onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.RELOAD.icon,
			content: <Trans id="mch.ammo.suggestions.waste.content">
				Avoid using <ActionLink {...ACTIONS.RELOAD}/> and <ActionLink {...ACTIONS.QUICK_RELOAD}/> if they would put you over capacity. Wasting ammo costs you potency and guaranteed procs.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
			value: this._wastedAmmo,
			why: <Trans id="mch.ammo.suggestions.waste.why">
				You wasted {this._wastedAmmo} ammo.
			</Trans>,
		}))

		const totalBadAmmoUses = Object.values(this._badAmmoUses).reduce((accum, value) => accum + value, 0)
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.RELOAD.icon,
			content: <Trans id="mch.ammo.suggestions.bad-use.content">
				Avoid using ammo on abilities like <ActionLink {...ACTIONS.HOT_SHOT}/> and <ActionLink {...ACTIONS.COOLDOWN}/>, as they only get a potency benefit. Your ammo is best spent on <ActionLink {...ACTIONS.SPLIT_SHOT}/> and <ActionLink {...ACTIONS.SLUG_SHOT}/> for the guaranteed procs.
			</Trans>,
			tiers: {
				5: SEVERITY.MINOR,
				12: SEVERITY.MEDIUM,
			},
			value: totalBadAmmoUses,
			why: <Trans id="mch.ammo.suggestions.bad-use.why">
				You used {totalBadAmmoUses} ammo on non-optimal GCDs.
			</Trans>,
		}))
	}

	negateBadAmmoUse(abilityId) {
		if (this._badAmmoUses.hasOwnProperty(abilityId)) {
			this._badAmmoUses[abilityId]--
		}
	}

	get ammoSpent() { return this._ammoSpent }
}
