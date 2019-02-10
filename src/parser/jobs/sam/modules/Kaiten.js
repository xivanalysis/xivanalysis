import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const KAITEN_GCDS = {

	//These actions are bad to use kaiten under, however end of fight rushing may cause exceptions
	[ACTIONS.HAKAZE.id]: 1,
	[ACTIONS.JINPU.id]: 1,
	[ACTIONS.ENPI.id]: 1,
	[ACTIONS.SHIFU.id]: 1,
	[ACTIONS.FUGA.id]: 1,
	[ACTIONS.GEKKO.id]: 1,
	[ACTIONS.MANGETSU.id]: 1,
	[ACTIONS.KASHA.id]: 1,
	[ACTIONS.OKA.id]: 1,
	[ACTIONS.YUKIKAZE.id]: 1,

	[ACTIONS.HIGANBANA.id]: 0, //ALWAYS WITH KAITEN
	[ACTIONS.TENKA_GOKEN.id]: 0,
	[ACTIONS.MIDARE_SETSUGEKKA.id]: 0, //ALWAYS WITH KAITEN

}

export default class Kaiten extends Module {
	static handle = 'kaiten'
	static dependencies = [
		'combatants',
		'suggestions',
	]

	_badKaitenCasts = 0
	_missedKaitenCasts = 0

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const abilityId = event.ability.guid

		if (this.combatants.selected.hasStatus(STATUSES.KAITEN.id) && KAITEN_GCDS.hasOwnProperty(abilityId)) {
			this._badKaitenCasts += KAITEN_GCDS[abilityId] // Sen moves won't increment this, everything else will
		}

		if ((abilityId === ACTIONS.MIDARE_SETSUGEKKA.id || abilityId === ACTIONS.HIGANBANA.id) && !this.combatants.selected.hasStatus(STATUSES.KAITEN.id)) {
			this._missedKaitenCasts += 1 //Everytime Midare or Higan is used without kaiten, this will go up by 1.
		}
	}

	_onComplete() {
		if (this._badKaitenCasts > 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.HISSATSU_KAITEN.icon,
				content: <Fragment>
				Avoid using <ActionLink {...ACTIONS.HISSATSU_KAITEN}/> on any GCDs besides <ActionLink {...ACTIONS.IAIJUTSU}/>s moves. These actions are worth it because of the potency gain per kenki spent.
				</Fragment>,
				tiers: {
					1: SEVERITY.MINOR,
					3: SEVERITY.MEDIUM,
					5: SEVERITY.MAJOR,
				},
				why: <Fragment>
					You used Kaiten {this._badKaitenCasts} time{this._badKaitenCasts !== 1 && 's'} on non-optimal GCDs.
				</Fragment>,
			}))
		}

		if (this._missedKaitenCasts > 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.HISSATSU_KAITEN.icon,
				content: <Fragment>
                                Always use <ActionLink {...ACTIONS.HISSATSU_KAITEN}/> on <ActionLink {...ACTIONS.MIDARE_SETSUGEKKA}/> and <ActionLink {...ACTIONS.HIGANBANA}/>. The gain on these actions from kaiten is too great to miss.
				</Fragment>,
				tiers: {
					1: SEVERITY.MINOR,
					3: SEVERITY.MEDIUM,
					5: SEVERITY.MAJOR,
				},
				why: <Fragment>
                                        You failed to Kaiten {this._missedKaitenCasts} time{this._missedKaitenCasts !== 1 && 's'} on either  on <ActionLink {...ACTIONS.MIDARE_SETSUGEKKA}/> and/or <ActionLink {...ACTIONS.HIGANBANA}/>
				</Fragment>,
			}))
		}

	}
}
