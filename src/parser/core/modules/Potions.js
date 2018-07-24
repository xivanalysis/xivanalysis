import React, {Fragment} from 'react'

import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

// Infusions are 30s, standard are 15.
// Using 20 so lag/slight timing offsets don't miss the trigger
const SHORT_POTION_THRESHOLD = 20

export default class Potions extends Module {
	static handle = 'potions'
	static dependencies = [
		'suggestions',
	]

	_start = null
	_usingShortPotion = false

	constructor(...args) {
		super(...args)

		const filter = {
			to: 'player',
			abilityId: STATUSES.MEDICATED.id,
		}
		this.addHook('applybuff', filter, this._onApplyMedicated)
		this.addHook('removebuff', filter, this._onRemoveMedicated)
		this.addHook('complete', this._onComplete)
	}

	_onApplyMedicated(event) {
		// Track the application of the pot
		this._start = event.timestamp
	}

	_onRemoveMedicated(event) {
		const potionLength = (event.timestamp - this._start) / 1000
		if (potionLength <= SHORT_POTION_THRESHOLD) {
			this._usingShortPotion = true
		}
	}

	_onComplete() {
		// Not checking pot timing on completion, need a concrete end time for that.

		if (this._usingShortPotion) {
			this.suggestions.add(new Suggestion({
				// TODO: Would be nice to be able to suggest the correct pot for their current class, inc. icon...
				icon: 'https://secure.xivdb.com/img/game_local/2/22450.jpg',
				content: <Fragment>
					It looks like you used a pre-Stormblood potion. Openers and rotations generally assume the use of infusions, which last for <em>twice</em> the duration. It's likely the shorter duration will have caused important skills to miss the damage boost.
				</Fragment>,
				why: 'Used a short potion instead of an infusion.',
				severity: SEVERITY.MEDIUM,
			}))
		}
	}
}
