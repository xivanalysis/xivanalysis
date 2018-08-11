import {Trans, Plural} from '@lingui/react'
import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
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
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.HYOTON.id}, this._onHyotonCast)
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.RABBIT_MEDIUM.id}, this._onRabbitCast)
		this.addHook('complete', this._onComplete)
	}

	_onHyotonCast() {
		this._hyotonCount++
	}

	_onRabbitCast() {
		this._rabbitCount++
	}

	_onComplete() {
		if (this._hyotonCount >= 1) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.HYOTON.icon,
				content: <Fragment>
					<Trans id="nin.ninjutsu.suggestions.hyoton.content">Avoid using <ActionLink {...ACTIONS.HYOTON}/>, as it&apos;s the weakest of the mudra combinations and should typically never be used in raid content.</Trans>
				</Fragment>,
				severity: SEVERITY.MINOR,
				why: <Fragment>
					<Plural
						id="nin.ninjutsu.suggestions.hyoton.why"
						value={this._hyotonCount}
						one="You cast Hyoton # time."
						other="You cast Hyoton # times."/>
				</Fragment>,
			}))
		}

		if (this._rabbitCount >= 1) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.RABBIT_MEDIUM.icon,
				content: <Fragment>
					<Trans id="nin.ninjutsu.suggestions.rabbit.content">Avoid using <ActionLink {...ACTIONS.RABBIT_MEDIUM}/>, as it can cost you personal DPS at best and raid DPS at worst by reducing the number of <ActionLink {...ACTIONS.TRICK_ATTACK}/>s you can do during the fight.</Trans>
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: <Fragment>
					<Plural
						id="nin.ninjutsu.suggestions.rabbit.why"
						value={this._rabbitCount}
						one="You cast Rabbit Medium # time."
						other="You cast Rabbit Medium # times."/>
				</Fragment>,
			}))
		}
	}
}
