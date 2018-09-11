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
		[ACTIONS.KATON.id]: 0,
		[ACTIONS.RAITON.id]: 0,
		[ACTIONS.HYOTON.id]: 0,
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
					Be careful not to let <ActionLink {...ACTIONS.KASSATSU}/> fall off, as it wastes a guaranteed crit and means that you're delaying your Ninjutsu casts significantly.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="nin.kassatsu.suggestions.waste.why">
					You allowed Kassatsu to fall off <Plural value={this._kassatsuWastes} one="# time" other="# times"/>.
				</Trans>,
			}))
		}

		if (this._kassatsuUses[ACTIONS.KATON.id] > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.KATON.icon,
				content: <Trans id="nin.kassatsu.suggestions.katon.content">
					Avoid using <ActionLink {...ACTIONS.KATON}/> under <ActionLink {...ACTIONS.KASSATSU}/> unless using it against multiple targets. On single targets, it's better to use <ActionLink {...ACTIONS.FUMA_SHURIKEN}/> or <ActionLink {...ACTIONS.RAITON}/>.
				</Trans>,
				severity: SEVERITY.MINOR,
				why: <Trans id="nin.kassatsu.suggestions.katon.why">
					You cast Katon <Plural value={this._kassatsuUses[ACTIONS.KATON.id]} one="# time" other="# times"/> under Kassatsu.
				</Trans>,
			}))
		}

		if (this._kassatsuUses[ACTIONS.HYOTON.id] > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.HYOTON.icon,
				content: <Trans id="nin.kassatsu.suggestions.hyoton.content">
					Avoid using <ActionLink {...ACTIONS.HYOTON}/> under <ActionLink {...ACTIONS.KASSATSU}/>. Both <ActionLink {...ACTIONS.FUMA_SHURIKEN}/> and <ActionLink {...ACTIONS.RAITON}/> do significantly more damage.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="nin.kassatsu.suggestions.hyoton.why">
					You cast Hyoton <Plural value={this._kassatsuUses[ACTIONS.HYOTON.id]} one="# time" other="# times"/> under Kassatsu.
				</Trans>,
			}))
		}

		if (this._kassatsuUses[ACTIONS.HUTON.id] > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.HUTON.icon,
				content: <Trans id="nin.kassatsu.suggestions.huton.content">
					Avoid using <ActionLink {...ACTIONS.HUTON}/> under <ActionLink {...ACTIONS.KASSATSU}/>, as it does no damage and completely wastes the guaranteed crit Kassatsu provides.
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
					Avoid using <ActionLink {...ACTIONS.DOTON}/> under <ActionLink {...ACTIONS.KASSATSU}/> unless using it against multiple targets that you expect to die slowly. If the targets will die in under 15 seconds, <ActionLink {...ACTIONS.KATON}/> is the better AoE option.
				</Trans>,
				severity: SEVERITY.MINOR,
				why: <Trans id="nin.kassatsu.suggestions.doton.why">
					You cast Doton <Plural value={this._kassatsuUses[ACTIONS.DOTON.id]} one="# time" other="# times"/> under Kassatsu.
				</Trans>,
			}))
		}

		if (this._kassatsuUses[ACTIONS.SUITON.id] > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.SUITON.icon,
				content: <Trans id="nin.kassatsu.suggestions.suiton.content">
					Avoid using <ActionLink {...ACTIONS.SUITON}/> under <ActionLink {...ACTIONS.KASSATSU}/> unless using it to set up for a critically important <ActionLink {...ACTIONS.TRICK_ATTACK}/>. Otherwise, reserve it for <ActionLink {...ACTIONS.FUMA_SHURIKEN}/> and <ActionLink {...ACTIONS.RAITON}/>, as they both do significantly more damage.
				</Trans>,
				severity: SEVERITY.MINOR,
				why: <Trans id="nin.kassatsu.suggestions.suiton.why">
					You cast Suiton <Plural value={this._kassatsuUses[ACTIONS.SUITON.id]} one="# time" other="# times"/> under Kassatsu.
				</Trans>,
			}))
		}

		if (this._kassatsuUses[ACTIONS.RABBIT_MEDIUM.id] > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.RABBIT_MEDIUM.icon,
				content: <Trans id="nin.kassatsu.suggestions.rabbit.content">
					Be especially careful not to flub your mudras under <ActionLink {...ACTIONS.KASSATSU}/>, as <ActionLink {...ACTIONS.RABBIT_MEDIUM}/> does no damage and completely wastes the guaranteed crit Kassatsu provides.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="nin.kassatsu.suggestions.rabbit.why">
					You cast Rabbit Medium <Plural value={this._kassatsuUses[ACTIONS.RABBIT_MEDIUM.id]} one="# time" other="# times"/> under Kassatsu.
				</Trans>,
			}))
		}
	}
}
