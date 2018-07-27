import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS, {getAction} from 'data/ACTIONS'
import Weaving from 'parser/core/modules/Weaving'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const WEAVING_SEVERITY = {
	1: SEVERITY.MINOR,
	5: SEVERITY.MEDIUM,
	10: SEVERITY.MAJOR,
}

export default class ScholarWeaving extends Weaving {
	static handle = 'weaving'
	static dependencies = [
		'combatants',
		'castTime',
		'invuln',
		'suggestions',
	]
	static title = 'Weaving Issues'

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onScholarCast)
	}

	// Renamed so as not to overwrite parent module
	// Just for tracking pos
	_onScholarCast(event) {
		const action = getAction(event.ability.guid)
		if (!action.onGcd) {
			return
		}

		this._pos = this.combatants.selected.resources
	}

	// Now this, we want to overwrite
	_onComplete() {
		const badWeaves = this._badWeaves
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.RUIN_II.icon,
			content: <Fragment>
				<ActionLink {...ACTIONS.RUIN_II} /> may seem like a great choice for weaving,
				but because its potency is <i>absurdly</i> low compared to <ActionLink {...ACTIONS.BROIL} />,
				it is actually better to just clip your GCD with Broil than to waste your mana.
				An exception is if you are moving - so the module below only tracks instances of Ruin 2 while not moving.
			</Fragment>,
			why: `${badWeaves.length} instances of weaving with Ruin II while not moving.`,
			tiers: WEAVING_SEVERITY,
			value: badWeaves.length,
		}))
	}

	isBadWeave(weave) {
		// The first weave won't have an ability (faked event)
		// They... really shouldn't be weaving before the first GCD... I think
		// TODO: ^?
		if (!weave.gcdEvent.ability) {
			return weave.weaves.length
		}

		// Ruin 2 is just bad for weaving
		if (weave.gcdEvent.ability.guid === ACTIONS.RUIN_II.id &&
			weave.weaves.length > 0
		) {
			// ...unless you were using it for movement
			// Maybe you moved a pixel just to silence this warning.
			if (!this.movedSinceLastGcd()) {
				return true
			}
		}

		return false
	}

	// Copied over from SMN Ruin 2
	movedSinceLastGcd() {
		return (
			Math.abs(this.combatants.selected.resources.x - this._pos.x) > 1 &&
			Math.abs(this.combatants.selected.resources.y - this._pos.y) > 1
		)
	}
}
