import {Trans, Plural} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

// Constants
const MAX_NINKI = 100

const NINKI_BUILDERS = {
	[ACTIONS.MUG.id]: 30,
	[ACTIONS.ATTACK.id]: 6,
}

const NINKI_SPENDERS = {
	[ACTIONS.HELLFROG_MEDIUM.id]: 80,
	[ACTIONS.BHAVACAKRA.id]: 80,
	[ACTIONS.TEN_CHI_JIN.id]: 80,
}

export default class Ninki extends Module {
	static handle = 'ninki'
	static dependencies = [
		'cooldowns',
		'suggestions',
	]

	_ninki = 0
	_wasteBySource = {
		[ACTIONS.MUG.id]: 0,
		[ACTIONS.ATTACK.id]: 0,
	}
	_erroneousFrogs = 0 // This is my new band name

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player', abilityId: Object.keys(this._wasteBySource).map(Number)}, this._onBuilderCast)
		this.addHook('cast', {by: 'player', abilityId: Object.keys(NINKI_SPENDERS).map(Number)}, this._onSpenderCast)
		this.addHook('aoedamage', {by: 'player', abilityId: ACTIONS.HELLFROG_MEDIUM.id}, this._onHellfrogAoe)
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)
	}

	_onBuilderCast(event) {
		const abilityId = event.ability.guid

		this._ninki += NINKI_BUILDERS[abilityId]
		if (this._ninki > MAX_NINKI) {
			const waste = this._ninki - MAX_NINKI
			this._wasteBySource[abilityId] += waste
			this._ninki = MAX_NINKI
		}
	}

	_onSpenderCast(event) {
		this._ninki = Math.max(this._ninki - NINKI_SPENDERS[event.ability.guid], 0)
	}

	_onHellfrogAoe(event) {
		if (event.hits.length === 1 &&
			(this.cooldowns.getCooldownRemaining(ACTIONS.BHAVACAKRA.id) <= 0 ||
			this.cooldowns.getCooldownRemaining(ACTIONS.TEN_CHI_JIN.id) <= 0)) {
			// If we have an Hellfrog AoE event with only one target while Bhava and/or TCJ are available, it was probably a bad life choice
			this._erroneousFrogs++
		}
	}

	_onDeath() {
		// YOU DONE FUCKED UP NOW
		this._ninki = 0
	}

	_onComplete() {
		const totalWaste = this._wasteBySource[ACTIONS.MUG.id] + this._wasteBySource[ACTIONS.ATTACK.id]
		this.suggestions.add(new TieredSuggestion({
			icon: 'https://xivapi.com/i/005000/005411.png',
			content: <Trans id="nin.ninki.suggestions.waste.content">
				Avoid using <ActionLink {...ACTIONS.MUG}/> when above 60 Ninki and holding your Ninki spenders when near or at cap (with a few small exceptions) in order to maximize the number of spenders you can use over the course of a fight.
			</Trans>,
			tiers: {
				24: SEVERITY.MINOR,
				80: SEVERITY.MEDIUM,
			},
			value: totalWaste,
			why: <Trans id="nin.ninki.suggestions.waste.why">
				Overcapping caused you to lose {totalWaste} Ninki over the fight.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.HELLFROG_MEDIUM.icon,
			content: <Trans id="nin.ninki.suggestions.frog.content">
				Avoid using <ActionLink {...ACTIONS.HELLFROG_MEDIUM}/> when you have one of your other spenders available (unless there are multiple targets), as it has the lowest potency of the three by a significant margin when used on only one.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
			},
			value: this._erroneousFrogs,
			why: <Trans id="nin.ninki.suggestions.frog.why">
				You used Hellfrog Medium <Plural value={this._erroneousFrogs} one="# time" other="# times"/> when other spenders were available.
			</Trans>,
		}))
	}
}
