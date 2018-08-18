import {Trans, Plural} from '@lingui/react'
import React, {Fragment} from 'react'

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
	_wastedNinki = 0
	_wasteBySource = {
		mug: 0,
		auto: 0,
		death: 0,
	}
	_erroneousFrogs = 0 // This is my new band name

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('aoedamage', {by: 'player'}, this._onAoe)
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)
	}

	_addNinki(abilityId) {
		// Helper for adding Ninki to the running tally and calculating waste. Returns the amount wasted.
		this._ninki += NINKI_BUILDERS[abilityId]
		if (this._ninki > MAX_NINKI) {
			const waste = this._ninki - MAX_NINKI
			this._wastedNinki += waste
			this._ninki = MAX_NINKI
			return waste
		}

		return 0
	}

	_onCast(event) {
		const abilityId = event.ability.guid

		if (abilityId === ACTIONS.MUG.id) {
			this._wasteBySource.mug += this._addNinki(abilityId)
		}

		if (abilityId === ACTIONS.ATTACK.id) {
			this._wasteBySource.auto += this._addNinki(abilityId)
		}

		if (NINKI_SPENDERS.hasOwnProperty(abilityId)) {
			this._ninki -= NINKI_SPENDERS[abilityId]
		}
	}

	_onAoe(event) {
		if (event.ability.guid === ACTIONS.HELLFROG_MEDIUM.id && event.hits.length === 1 &&
			(this.cooldowns.getCooldownRemaining(ACTIONS.BHAVACAKRA.id) <= 0 ||
			this.cooldowns.getCooldownRemaining(ACTIONS.TEN_CHI_JIN.id) <= 0)) {
			// If we have an Hellfrog AoE event with only one target while Bhava and/or TCJ are available, it was probably a bad life choice
			this._erroneousFrogs++
		}
	}

	_onDeath() {
		// YOU DONE FUCKED UP NOW
		//this._wastedNinki += this._ninki // Exclude this from the running total, but track it individually in case we want it in another module later
		this._wasteBySource.death += this._ninki
		this._ninki = 0
	}

	_onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: 'https://xivapi.com/i/005000/005411.png',
			content: <Fragment>
				<Trans id="nin.ninki.suggestions.waste.content">Avoid using <ActionLink {...ACTIONS.MUG}/> when above 60 Ninki and holding your Ninki spenders when near or at cap (with a few small exceptions) in order to maximize the number of spenders you can use over the course of a fight.</Trans>
			</Fragment>,
			tiers: {
				12: SEVERITY.MINOR,
				24: SEVERITY.MEDIUM,
			},
			value: this._wastedNinki,
			why: <Fragment>
				<Trans id="nin.ninki.suggestions.waste.why">Overcapping caused you to lose {this._wastedNinki} Ninki over the fight.</Trans>
			</Fragment>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.HELLFROG_MEDIUM.icon,
			content: <Fragment>
				<Trans id="nin.ninki.suggestions.frog.content">Avoid using <ActionLink {...ACTIONS.HELLFROG_MEDIUM}/> when you have one of your other spenders available (unless there are multiple targets), as it has the lowest potency of the three by a significant margin when used on only one.</Trans>
			</Fragment>,
			tiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
			},
			value: this._erroneousFrogs,
			why: <Fragment>
				<Plural
					id="nin.ninki.suggestions.frog.why"
					value={this._erroneousFrogs}
					one="You used Hellfrog Medium # time when other spenders were available."
					other="You used Hellfrog Medium # times when other spenders were available."/>
			</Fragment>,
		}))
	}
}
