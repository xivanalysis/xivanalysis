import React, {Fragment} from 'react'
//import {Icon, Message} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const MEIKYO_GCDS = {

	//These actions are bad to use under meikyo
	[ACTIONS.HAKAZE.id]: 1,
	[ACTIONS.JINPU.id]: 1,
	[ACTIONS.ENPI.id]: 1,
	[ACTIONS.SHIFU.id]: 1,
	[ACTIONS.FUGA.id]: 1,
	[ACTIONS.GEKKO.id]: 1,
	[ACTIONS.MANGETSU.id]: 1,
	[ACTIONS.OKA.id]: 1,

	[ACTIONS.GEKKO.id]: 0,
	[ACTIONS.YUKIKAZE.id]: 0,
	[ACTIONS.KASHA.id]: 0,
}

export default class Meikyo extends Module {
	static handle = 'meikyo'
	static dependencies = [
		'combatants',
		'suggestions',
	]

	_currentMeikyoCasts = 0 //keep track of total casts under current buff window
	_missedMeikyoCasts = 0 // Missed = missed + (3 - current)
	_badMeikyoCasts = 0 // Non-combo finishers increase

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('removebuff', {by: 'player', abilityId: STATUSES.MEIKYO_SHISUI.id}, this._onRemoveMS)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const abilityId = event.ability.guid

		if (abilityId === ACTIONS.MEIKYO_SHISUI.id) {
			this._currentMeikyoCasts = 0
		}

		if (this.combatants.selected.hasStatus(STATUSES.MEIKYO_SHISUI.id) && MEIKYO_GCDS.hasOwnProperty(abilityId)) {
			this._badMeikyoCasts += MEIKYO_GCDS[abilityId] // Sen generator moves won't increment this, everything else will
			this._currentMeikyoCasts++
		}
	}

	_onRemoveMS() {
		this._missedMeikyoCasts += (3 - this._currentMeikyoCasts)
	}

	_onComplete() {

		if (this._badMeikyoCasts > 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.MEIKYO_SHISUI.icon,
				content: <Fragment>
				While under the effects of  <ActionLink {...ACTIONS.MEIKYO_SHISUI}/> you should only use <ActionLink {...ACTIONS.GEKKO}/>, <ActionLink {...ACTIONS.KASHA}/>, and <ActionLink {...ACTIONS.YUKIKAZE}/> - these actions allow you to gather Sens faster.
				</Fragment>,
				tiers: {
					1: SEVERITY.MEDIUM,
					2: SEVERITY.MAJOR,
				},
				value: this._badMeikyoCasts,
				why: <Fragment>
					You did not use sen moves {this._badMeikyoCasts} time{this._badMeikyoCasts !== 1 && 's'} under the effect of Meikyo Shisui.
				</Fragment>,
			}))
		}

		if (this._missedMeikyoCasts > 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.MEIKYO_SHISUI.icon,
				content: <Fragment>
                                Always make sure to get 3 GCDs under the effect of Meikyo Shisui.
				</Fragment>,
				tiers: {
					1: SEVERITY.MEDIUM,
					2: SEVERITY.MAJOR,
				},
				value: this._missedMeikyoCasts,
				why: <Fragment>
                                        You missed {this._missedMeikyoCasts} GCD{this._missedMeikyoCasts !== 1 && 's'} under the effect of Meikyo Shisui.
				</Fragment>,
			}))
		}

	}
}
