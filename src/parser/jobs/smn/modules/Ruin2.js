import {Trans, Plural} from '@lingui/react'
import React from 'react'

import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import {ActionLink} from 'components/ui/DbLink'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import PETS from 'data/PETS'

// Severity, in no. casts
const BAD_CAST_SEVERITY = {
	1: SEVERITY.MINOR,
	5: SEVERITY.MEDIUM,
	10: SEVERITY.MAJOR,
}

export default class Ruin2 extends Module {
	static handle = 'ruin2'
	static dependencies = [
		'combatants',
		'gcd',
		'invuln',
		'pets',
		'suggestions',
	]

	// Events
	// TODO: Should probably mark bad R2s on the timeline in some capacity
	_weaved = []
	_moveOnly = []
	_worthless = []

	// Tracking etc
	_lastOgcd = null
	_lastGcd = null
	_ogcdUsed = false
	_pos = {}

	constructor(...args) {
		super(...args)
		this.addEventHook('cast', {by: 'player'}, this._onCast)
		this.addEventHook('complete', this._onComplete)
	}

	// Limiting to player, not worried about pets for this check
	_onCast(event) {
		const action = getDataBy(ACTIONS, 'id', event.ability.guid)
		if (!action) { return }

		const lastGcdActionId = this._lastGcd
			? this._lastGcd.ability.guid
			: undefined

		if (!action.onGcd) {
			this._lastOgcd = event
			this._ogcdUsed = true
			return
		}

		// Calc the time in the GCD that the boss can't be targeted - R2ing before an invuln to prevent an R3 cancel is good
		const invulnTime = this.invuln.getUntargetableUptime(
			'all',
			event.timestamp,
			event.timestamp + this.gcd.getEstimate(),
		)

		if (
			action.onGcd &&
			lastGcdActionId === ACTIONS.SMN_RUIN_II.id &&
			invulnTime === 0
		) {
			if (this._ogcdUsed) {
				// This was at least used for a weave, even though you should have enough other instants to not need R2s in general.
				this._weaved.push(this._lastGcd)
			} else if (this.movedSinceLastGcd()) {
				// Separate count if they at least moved
				this._moveOnly.push(this._lastGcd)
			} else {
				this._worthless.push(this._lastGcd)
			}
		}

		// If this cast is on the gcd, store it for comparison
		this._lastGcd = event
		this._pos = this.combatants.selected.resources

		// If this is an R2 cast, track it
		if (action.id === ACTIONS.SMN_RUIN_II.id) {
			// Explicitly setting the ogcd tracker to true while bahamut is out,
			// we don't want to fault people for using R2 for WWs during bahamut.
			this._ogcdUsed = (this.pets.getCurrentPet() === PETS.DEMI_BAHAMUT.id)
		}
	}

	// TODO: Should this be in some other module?
	movedSinceLastGcd() {
		return (
			Math.abs(this.combatants.selected.resources.x - this._pos.x) > 1 &&
			Math.abs(this.combatants.selected.resources.y - this._pos.y) > 1
		)
	}

	_onComplete() {
		const wastedCount = this._worthless.length
		const moveOnlyCount = this._moveOnly.length
		const weavedCount = this._weaved.length
		const totalCount = wastedCount + moveOnlyCount + weavedCount

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.SMN_RUIN_II.icon,
			tiers: BAD_CAST_SEVERITY,
			value: totalCount,
			content: <Trans id="smn.ruin-ii.suggestions.avoid.content">
				Avoid casting <ActionLink {...ACTIONS.SMN_RUIN_II}/> if possible.
				Prefer using your other instant casts for movement and weaving or Ruin III when movement and weaving are not required.
			</Trans>,
			why: <Trans id="smn.ruin-ii.suggestions.avoid.why">
				{totalCount} Ruin II <Plural value={totalCount} one="cast" other="casts"/> were performed.
			</Trans>,
		}))
	}
}
