import React, {Fragment} from 'react'

import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {ActionLink} from 'components/ui/DbLink'

// Should this be in the actions data?
const ROUSE_DURATION = 20000

export default class Rouse extends Module {
	static dependencies = [
		'gauge',
		'pets',
		'suggestions',
	]

	_lastRouse = null
	_wasted = 0

	on_cast_byPlayer(event) {
		if (event.ability.guid !== ACTIONS.ROUSE.id) {
			return
		}
		this._lastRouse = event.timestamp
	}

	on_summonpet(event) {
		const diff = event.timestamp - this._lastRouse
		// TODO: Might need to check if the rush is in the opener, 'cus you don't want to be wasting rouse by using it before a petswap.
		if (this._lastRouse === null || diff > ROUSE_DURATION || this.gauge.isRushing()) {
			return
		}
		this._wasted += ROUSE_DURATION - diff
	}

	on_complete() {
		if (this._wasted > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.ROUSE.icon,
				content: <Fragment>
					Avoid casting <ActionLink {...ACTIONS.ROUSE}/> less than {this.parser.formatDuration(ROUSE_DURATION)} before you swap pets or summon bahamut. Rouse is lost the moment your current pet despawns.
				</Fragment>,
				severity: this._wasted > ROUSE_DURATION? SEVERITY.MAJOR : this._wasted > 5000? SEVERITY.MEDIUM : SEVERITY.MINOR,
				why: `${this.parser.formatDuration(this._wasted)} of Rouse wasted.`,
			}))
		}
	}
}
