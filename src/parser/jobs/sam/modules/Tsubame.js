import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {TieredSuggestion, Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

export default class Tsubame  extends Module {
        static handle = 'tsubame'
        static title = t('sam.tsubame.title')`Tsubame`
	static dependencies = [
		'suggestions',
	]

	_kaeshiFailures = 0 //amount of bad kaeshi moves
	_kaeshiMidare = 0 //amount of times kaeshi was a double midare

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player', abilityId: [ACTIONS.KAESHI_HIGANBANA.id, ACTIONS.KAESHI_GOKEN.id]}, this._onBadTsubame,)
		this.addHook('cast', {by: 'player', abilityId: [ACTIONS.KAESHI_SETSUGEKKA.id]}, this._onDoubleMidare,)
		this.addHook('complete', this._onComplete,)
	}

	_onBadTsubame() {
		this._kaeshiFailures += 1
	}

	_onDoubleMidare() {
		this._kaeshiMidare += 1
	}

	_onComplete() {
		const totalUses = this._kaeshiFailures + this._kaeshiMidare
		const badUses = this._kaeshiFailures

		if (totalUses === 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.TSUBAME_GAESHI.icon,
				content: <Trans id="sam.tsubame.suggestion.notsubame.content"> <ActionLink {...ACTIONS.TSUBAME_GAESHI}/> allows you to repeat your Iaijustu skills right after you use them. To not use this skill is to deny yourself 2 <ActionLink {...ACTIONS.MIDARE_SETSUGEKKA}/> for the price of one. </Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id= "sam.tsubame.suggestion.notsubame.why"> You did not use <ActionLink {...ACTIONS.TSUBAME_GAESHI}/> at all. </Trans>,
			}))
		}

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.TSUBAME_GAESHI.icon,
			content: <Trans id="sam.tsubame.suggestion.badtsubame.content"> You used <ActionLink {...ACTIONS.TSUBAME_GAESHI}/> incorrectly. The skill should only be used to get more <ActionLink {...ACTIONS.MIDARE_SETSUGEKKA}/>. </Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			why: <Trans id="sam.tsubame.suggestion.badtsubame.why"> You used <ActionLink {...ACTIONS.TSUBAME_GAESHI}/> on the wrong sen skills {badUses} times over the course of the fight </Trans>,
			value: this._badUses,
		}))

	}

}
