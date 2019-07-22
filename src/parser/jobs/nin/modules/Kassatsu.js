import {Trans, Plural} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

export default class Kassatsu extends Module {
	static handle = 'kassatsu'
	static dependencies = [
		'combatants',
		'suggestions',
	]

	_kassatsuSpent = false
	_kassatsuWastes = 0
	_kassatsuUses = {
		[ACTIONS.FUMA_SHURIKEN.id]: 0,
		[ACTIONS.GOKA_MEKKYAKU.id]: 0,
		[ACTIONS.RAITON.id]: 0,
		[ACTIONS.HYOSHO_RANRYU.id]: 0,
		[ACTIONS.HUTON.id]: 0,
		[ACTIONS.DOTON.id]: 0,
		[ACTIONS.SUITON.id]: 0,
		[ACTIONS.RABBIT_MEDIUM.id]: 0,
	}

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player', abilityId: Object.keys(this._kassatsuUses).map(Number)}, this._onNinjutsuCast)
		this.addHook('removebuff', {by: 'player', abilityId: STATUSES.KASSATSU.id}, this._onRemoveKassatsu)
		this.addHook('complete', this._onComplete)
	}

	_onNinjutsuCast(event) {
		const abilityId = event.ability.guid
		if (this.combatants.selected.hasStatus(STATUSES.KASSATSU.id)) {
			this._kassatsuUses[abilityId]++
			this._kassatsuSpent = true
		}
	}

	_onRemoveKassatsu() {
		if (!this._kassatsuSpent) {
			this._kassatsuWastes++
		}

		// Reset the flag for the next time it's cast
		this._kassatsuSpent = false
	}

	_onComplete() {
		if (this._kassatsuWastes > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.KASSATSU.icon,
				content: <Trans id="nin.kassatsu.suggestions.waste.content">
					Be careful not to let <ActionLink {...ACTIONS.KASSATSU}/> fall off, as it wastes a 30% potency buff and means that you're delaying your Ninjutsu casts significantly.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="nin.kassatsu.suggestions.waste.why">
					You allowed Kassatsu to fall off <Plural value={this._kassatsuWastes} one="# time" other="# times"/>.
				</Trans>,
			}))
		}

		if (this._kassatsuUses[ACTIONS.HUTON.id] > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.HUTON.icon,
				content: <Trans id="nin.kassatsu.suggestions.huton.content">
					Avoid using <ActionLink {...ACTIONS.HUTON}/> under <ActionLink {...ACTIONS.KASSATSU}/>, as it does no damage and completely wastes the 30% potency buff Kassatsu provides.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="nin.kassatsu.suggestions.huton.why">
					You cast Huton <Plural value={this._kassatsuUses[ACTIONS.HUTON.id]} one="# time" other="# times"/> under Kassatsu.
				</Trans>,
			}))
		}

		if (this._kassatsuUses[ACTIONS.DOTON.id] > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DOTON.icon,
				content: <Trans id="nin.kassatsu.suggestions.doton.content">
					Avoid using <ActionLink {...ACTIONS.DOTON}/> under <ActionLink {...ACTIONS.KASSATSU}/> even in AoE situations, as it has a lower potency than <ActionLink {...ACTIONS.GOKA_MEKKYAKU}/> even if every tick hits.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="nin.kassatsu.suggestions.doton.why">
					You cast Doton <Plural value={this._kassatsuUses[ACTIONS.DOTON.id]} one="# time" other="# times"/> under Kassatsu.
				</Trans>,
			}))
		}

		if (this._kassatsuUses[ACTIONS.SUITON.id] > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.SUITON.icon,
				content: <Trans id="nin.kassatsu.suggestions.suiton.content">
					Avoid using <ActionLink {...ACTIONS.SUITON}/> under <ActionLink {...ACTIONS.KASSATSU}/> unless using it to set up for a critically important <ActionLink {...ACTIONS.TRICK_ATTACK}/>. It's generally best to use it on <ActionLink {...ACTIONS.HYOSHO_RANRYU}/> while Trick Attack is up, as its cooldown should align it with every window.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="nin.kassatsu.suggestions.suiton.why">
					You cast Suiton <Plural value={this._kassatsuUses[ACTIONS.SUITON.id]} one="# time" other="# times"/> under Kassatsu.
				</Trans>,
			}))
		}

		if (this._kassatsuUses[ACTIONS.RABBIT_MEDIUM.id] > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.RABBIT_MEDIUM.icon,
				content: <Trans id="nin.kassatsu.suggestions.rabbit.content">
					Be especially careful not to flub your mudras under <ActionLink {...ACTIONS.KASSATSU}/>, as <ActionLink {...ACTIONS.RABBIT_MEDIUM}/> does no damage and completely wastes the 30% potency buff Kassatsu provides.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="nin.kassatsu.suggestions.rabbit.why">
					You cast Rabbit Medium <Plural value={this._kassatsuUses[ACTIONS.RABBIT_MEDIUM.id]} one="# time" other="# times"/> under Kassatsu.
				</Trans>,
			}))
		}
	}
}
