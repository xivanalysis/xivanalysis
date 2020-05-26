import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
// import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'

export default class ArcanaUndrawUsage extends Module {
	static handle = 'arcanaundraws'
	static dependencies = [
		'suggestions',
	]

	constructor(...args) {
		super(...args)

		this.addEventHook('cast', {by: 'player'}, this._onCast)
		this.addEventHook('complete', this._onComplete)
		this._badUndraws = []
	}

	_onCast(event) {

		this._saveIfBadUndraw(event)

	}

	_saveIfBadUndraw(event) {
		const actionId = event.ability.guid

		// It's a OGCD Arcana Undraw. GET IT.
		if (actionId === ACTIONS.UNDRAW.id) {
			this._badUndraws.push(event)
		}
	}

	_onComplete() {

		const badUndraws = this._badUndraws

		if (badUndraws > 0) {
			this.suggestions.add(new Suggestion({
				icon: 'https://xivapi.com/i/003000/003108.png', // Undraw action
				content: <Fragment>
					<Trans id="ast.arcana-undraw-usage.suggestions.content">
                    Due to Draw starting its cooldown the moment it's used, there is no longer any reason to <ActionLink {...ACTIONS.UNDRAW} /> instead of playing it or converting it with <ActionLink {...ACTIONS.MINOR_ARCANA} /></Trans>
				</Fragment>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="ast.arcana-undraw-usage.suggestions.why">
					{badUndraws.length} instances of using undraw.</Trans>,
			}))
		}

	}

}

