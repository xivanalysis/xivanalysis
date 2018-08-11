import {Trans, Plural} from '@lingui/react'
import React, {Fragment} from 'react'

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
				content: <Fragment>
					<Trans id="nin.kassatsu.suggestions.waste.content">Be careful not to let <ActionLink {...ACTIONS.KASSATSU}/> fall off, as it wastes a guaranteed crit and means that you&apos;re delaying your Ninjutsu casts significantly.</Trans>
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: <Fragment>
					<Plural
						id="nin.kassatsu.suggestions.waste.why"
						value={this._kassatsuWastes}
						one="You allowed Kassatsu to fall off # time."
						other="You allowed Kassatsu to fall off # times."/>
				</Fragment>,
			}))
		}

		if (this._kassatsuUses[ACTIONS.KATON.id] > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.KATON.icon,
				content: <Fragment>
					<Trans id="nin.kassatsu.suggestions.katon.content">Avoid using <ActionLink {...ACTIONS.KATON}/> under <ActionLink {...ACTIONS.KASSATSU}/> unless using it against multiple targets. On single targets, it&apos;s better to use <ActionLink {...ACTIONS.FUMA_SHURIKEN}/> or <ActionLink {...ACTIONS.RAITON}/>.</Trans>
				</Fragment>,
				severity: SEVERITY.MINOR,
				why: <Fragment>
					<Plural
						id="nin.kassatsu.suggestions.katon.why"
						value={this._kassatsuUses[ACTIONS.KATON.id]}
						one="You cast Katon # time under Kassatsu."
						other="You cast Katon # times under Kassatsu."/>
				</Fragment>,
			}))
		}

		if (this._kassatsuUses[ACTIONS.HYOTON.id] > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.HYOTON.icon,
				content: <Fragment>
					<Trans id="nin.kassatsu.suggestions.hyoton.content">Avoid using <ActionLink {...ACTIONS.HYOTON}/> under <ActionLink {...ACTIONS.KASSATSU}/>. Both <ActionLink {...ACTIONS.FUMA_SHURIKEN}/> and <ActionLink {...ACTIONS.RAITON}/> do significantly more damage.</Trans>
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: <Fragment>
					<Plural
						id="nin.kassatsu.suggestions.hyoton.why"
						value={this._kassatsuUses[ACTIONS.HYOTON.id]}
						one="You cast Hyoton # time under Kassatsu."
						other="You cast Hyoton # times under Kassatsu."/>
				</Fragment>,
			}))
		}

		if (this._kassatsuUses[ACTIONS.HUTON.id] > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.HUTON.icon,
				content: <Fragment>
					<Trans id="nin.kassatsu.suggestions.huton.content">Avoid using <ActionLink {...ACTIONS.HUTON}/> under <ActionLink {...ACTIONS.KASSATSU}/>, as it does no damage and completely wastes the guaranteed crit Kassatsu provides.</Trans>
				</Fragment>,
				severity: SEVERITY.MAJOR,
				why: <Fragment>
					<Plural
						id="nin.kassatsu.suggestions.huton.why"
						value={this._kassatsuUses[ACTIONS.HUTON.id]}
						one="You cast Huton # time under Kassatsu."
						other="You cast Huton # times under Kassatsu."/>
				</Fragment>,
			}))
		}

		if (this._kassatsuUses[ACTIONS.DOTON.id] > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DOTON.icon,
				content: <Fragment>
					<Trans id="nin.kassatsu.suggestions.doton.content">Avoid using <ActionLink {...ACTIONS.DOTON}/> under <ActionLink {...ACTIONS.KASSATSU}/> unless using it against multiple targets that you expect to die slowly. If the targets will die in under 15 seconds, <ActionLink {...ACTIONS.KATON}/> is the better AoE option.</Trans>
				</Fragment>,
				severity: SEVERITY.MINOR,
				why: <Fragment>
					<Plural
						id="nin.kassatsu.suggestions.doton.why"
						value={this._kassatsuUses[ACTIONS.DOTON.id]}
						one="You cast Doton # time under Kassatsu."
						other="You cast Doton # times under Kassatsu."/>
				</Fragment>,
			}))
		}

		if (this._kassatsuUses[ACTIONS.SUITON.id] > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.SUITON.icon,
				content: <Fragment>
					<Trans id="nin.kassatsu.suggestions.suiton.content">Avoid using <ActionLink {...ACTIONS.SUITON}/> under <ActionLink {...ACTIONS.KASSATSU}/> unless using it to set up for a critically important <ActionLink {...ACTIONS.TRICK_ATTACK}/>. Otherwise, reserve it for <ActionLink {...ACTIONS.FUMA_SHURIKEN}/> and <ActionLink {...ACTIONS.RAITON}/>, as they both do significantly more damage.</Trans>
				</Fragment>,
				severity: SEVERITY.MINOR,
				why: <Fragment>
					<Plural
						id="nin.kassatsu.suggestions.suiton.why"
						value={this._kassatsuUses[ACTIONS.SUITON.id]}
						one="You cast Suiton # time under Kassatsu."
						other="You cast Suiton # times under Kassatsu."/>
				</Fragment>,
			}))
		}

		if (this._kassatsuUses[ACTIONS.RABBIT_MEDIUM.id] > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.RABBIT_MEDIUM.icon,
				content: <Fragment>
					<Trans id="nin.kassatsu.suggestions.rabbit.content">Be especially careful not to flub your mudras under <ActionLink {...ACTIONS.KASSATSU}/>, as <ActionLink {...ACTIONS.RABBIT_MEDIUM}/> does no damage and completely wastes the guaranteed crit Kassatsu provides.</Trans>
				</Fragment>,
				severity: SEVERITY.MAJOR,
				why: <Fragment>
					<Plural
						id="nin.kassatsu.suggestions.rabbit.why"
						value={this._kassatsuUses[ACTIONS.RABBIT_MEDIUM.id]}
						one="You cast Rabbit Medium # time under Kassatsu."
						other="You cast Rabbit Medium # times under Kassatsu."/>
				</Fragment>,
			}))
		}
	}
}
