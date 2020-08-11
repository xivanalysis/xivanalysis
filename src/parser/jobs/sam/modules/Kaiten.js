import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React from 'react'

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
	static title = t('sam.kaiten.title')`Kaiten`
	static dependencies = [
		'combatants',
		'suggestions',
	]

	_badKaitenCasts = 0
	_missedKaitenCasts = 0

	constructor(...args) {
		super(...args)
		this.addEventHook('cast', {by: 'player'}, this._onCast)
		this.addEventHook('complete', this._onComplete)
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
				content: <Trans id = "sam.kaiten.suggestion.badkaiten.content">
				Avoid using <ActionLink {...ACTIONS.HISSATSU_KAITEN}/> on any GCDs besides <ActionLink {...ACTIONS.IAIJUTSU}/> moves. These actions are worth it because of the potency gain per kenki spent.
				</Trans>,
				tiers: {
					1: SEVERITY.MINOR,
					3: SEVERITY.MEDIUM,
					5: SEVERITY.MAJOR,
				},
				why: <Trans id ="sam.suggestion.badkaiten.why">
					You used Kaiten  <Plural value={this._badKaitenCasts} one="# time" other="# times"/> on non-optimal GCDs.
				</Trans>,
				value: this._badKaitenCasts,
			}))
		}

		if (this._missedKaitenCasts > 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.HISSATSU_KAITEN.icon,
				content: <Trans id = "sam.kaiten.suggestion.missedkaiten.content">
                                Always use <ActionLink {...ACTIONS.HISSATSU_KAITEN}/> on <ActionLink {...ACTIONS.MIDARE_SETSUGEKKA}/> and <ActionLink {...ACTIONS.HIGANBANA}/>. The gain on these actions from kaiten is too great to miss.
				</Trans>,
				tiers: {
					1: SEVERITY.MINOR,
					3: SEVERITY.MEDIUM,
					5: SEVERITY.MAJOR,
				},
				why: <Trans id = "sam.kaiten.suggestion.missedkaiten.why">
                                        You failed to Kaiten <Plural value={this._missedKaitenCasts} one="# time" other="# times"/> on either <ActionLink {...ACTIONS.MIDARE_SETSUGEKKA}/> or <ActionLink {...ACTIONS.HIGANBANA}/>
				</Trans>,
				value: this._missedKaitenCasts,
			}))
		}

	}
}
