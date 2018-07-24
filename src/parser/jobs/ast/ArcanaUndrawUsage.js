import React, {Fragment} from 'react'

import ACTIONS from 'data/ACTIONS'
// import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'

import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {ActionLink} from 'components/ui/DbLink'

const OGCD_ARCANA_REMOVAL = [
	ACTIONS.UNDRAW_SPREAD.id,
	ACTIONS.EMPTY_ROAD.id,
	ACTIONS.UNDRAW.id,
]

export default class ArcanaUndrawUsage extends Module {
	static handle = 'arcanaundraws'
	static dependencies = [
		'castTime',
		'gcd',
		'suggestions',
	]


	constructor(...args) {
		super(...args)

		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('complete', this._onComplete)
		this._badUndraws = []
	}


	_onCast(event) {

		this._saveIfBadUndraw(event)

	}

	_saveIfBadUndraw(event) {
		const actionId = event.ability.guid

		// It's a OGCD Arcana Undraw. GET IT.
		if (OGCD_ARCANA_REMOVAL.includes(actionId)) {
			this._badUndraws.push(event)
		}
	}

	_onComplete() {

		const badUndraws = this._badUndraws
		if (badUndraws.length) {
			this.suggestions.add(new Suggestion({
				icon: 'https://secure.xivdb.com/img/game/003000/003108.png', // Undraw action
				content: <Fragment>
					<strong>Avoid using the Arcana Removal actions.</strong> (<ActionLink {...ACTIONS.UNDRAW} />) (<ActionLink {...ACTIONS.UNDRAW_SPREAD} />) (<ActionLink {...ACTIONS.EMPTY_ROAD} />) <br/>
					They take up an unnecessary oGCD usage. Instead, try using these macros. They have the advantage of being able to be used while casting something else.<br/><br/>
					<strong>Undraw:</strong><br/>
					<code>
						/statusoff "Bole Drawn"<br/>
						/statusoff "Balance Drawn"<br/>
						/statusoff "Arrow Drawn"<br/>
						/statusoff "Spear Drawn"<br/>
						/statusoff "Spire Drawn"<br/>
						/statusoff "Ewer Drawn"<br/>
						/micon "Undraw"
					</code>	<br/><br/>
					<strong>Undraw Spread:</strong><br/>
					<code>
						/statusoff "Arrow Held"<br/>
						/statusoff "Balance Held"<br/>
						/statusoff "Spire Held"<br/>
						/statusoff "Bole Held"<br/>
						/statusoff "Ewer Held"<br/>
						/statusoff "Spear Held"<br/>
						/micon "Undraw Spread"<br/>
					</code>	<br/>
					<strong>Empty Road:</strong><br/>
					<code>
						/statusoff "Expanded Royal Road"<br/>
						/statusoff "Enhanced Royal Road"<br/>
						/statusoff "Extended Royal Road"<br/>
						/micon "Empty Road"<br/>
					</code>	<br/>
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: `${badUndraws.length} instances of using an ogcd Arcana undraw action.`,
			}))
		}


	}


}

