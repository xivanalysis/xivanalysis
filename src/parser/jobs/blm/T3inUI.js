import React, {Fragment} from 'react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'


export default class T3inUI extends Module {
	static handle = 't3inui'
	static dependencies = [
		'combatants',
		'cooldowns',
		'suggestions',
		'gauge',
	]

	_T3 = false
	_UI = 0
	_UIEndingInT3 = 0

	constructor(...args) {
		super(...args)
		this.addHook('begincast', {by: 'player'}, this._onBegin)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('complete', this._onComplete)
	}
	//keep track of hard casted T3s followed by fast F3s.
	_onBegin(event) {
		const abilityId = event.ability.guid

		this._UI = this.gauge.getUI()

		if (!(abilityId === ACTIONS.FIRE_III.id)) {
			this._T3 = false
		}
		if (abilityId === ACTIONS.THUNDER_III.id) {
			this._T3 = true
		}
	}

	//check if that exact event happens
	_onCast(event) {
		const abilityId = event.ability.guid
		if (this._T3 && abilityId === ACTIONS.FIRE_III.id && this._UI === 3) {
			this._UIEndingInT3 ++
		}
	}

	_onComplete() {
		//Suggestions for ending UI in T3
		if (this._UIEndingInT3) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.THUNDER_III.icon,
				content: <Fragment>
					You ended your Umbral Ice with a non-proc <ActionLink {...ACTIONS.THUNDER_III}/>. This can lead to MP issues and thus to less <ActionLink {...ACTIONS.FIRE_IV}/> under Astral Fire.
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: <Fragment>
					You ended Umbral Ice {this._UIEndingInT3} time{this._UIEndingInT3 > 1 && 's'} with Thunder III.
				</Fragment>,
			}))
		}
	}
}
