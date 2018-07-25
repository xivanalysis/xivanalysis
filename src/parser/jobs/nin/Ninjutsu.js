import React, {Fragment} from 'react'
//import {Icon, Message} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
//import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

export default class Ninjutsu extends Module {
	static handle = 'ninjutsu'
	static dependencies = [
		'suggestions',
	]

	_hyotonCount = 0
	_rabbitCount = 0

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const abilityId = event.ability.guid

		if (abilityId === ACTIONS.HYOTON.id) {
			this._hyotonCount++
		}

		if (abilityId === ACTIONS.RABBIT_MEDIUM.id) {
			this._rabbitCount++
		}
	}

	_onComplete() {
		if (this._hyotonCount >= 1) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.HYOTON.icon,
				content: <Fragment>
					Avoid using <ActionLink {...ACTIONS.HYOTON}/>, as it&apos;s the weakest of the mudra combinations and should typically never be used in raid content.
				</Fragment>,
				severity: SEVERITY.MINOR,
				why: <Fragment>
					You cast Hyoton {this._hyotonCount} time{this._hyotonCount !== 1 && 's'}.
				</Fragment>,
			}))
		}

		if (this._rabbitCount >= 1) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.RABBIT_MEDIUM.icon,
				content: <Fragment>
					Avoid using <ActionLink {...ACTIONS.RABBIT_MEDIUM}/>, as it can cost you personal DPS at best and raid DPS at worst by reducing the number of <ActionLink {...ACTIONS.TRICK_ATTACK}/>s you can do during the fight.
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: <Fragment>
					You cast Rabbit Medium {this._rabbitCount} time{this._rabbitCount !== 1 && 's'}.
				</Fragment>,
			}))
		}
	}
}
