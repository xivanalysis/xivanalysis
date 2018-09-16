/**
 * @author Yumiya
 */

import Module from '../../core/Module'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'

export default class RoyalRoadValidator extends Module {
	static handle = 'rrvalidator'
	static dependencies = []

	_rrCasts = 0
	_rrRemovals = 0
	_sleeveCasts = 0

	_isBadParse = false

	constructor(...args) {
		super(...args)

		this.addHook('cast', this._onCast)
		this.addHook('removebuff', this._onRemove)
		this.addHook('removedebuff', this._onRemove)
		this.addHook('complete', this._onComplete)

	}

	_onCast(event) {
		if (event.ability.guid === ACTIONS.ROYAL_ROAD.id) {
			this._rrCasts++
			return
		}
		if (event.ability.guid === ACTIONS.SLEEVE_DRAW.id) {
			this._sleeveCasts++
			return
		}
	}

	_onRemove(event) {
		if (event.ability.guid === STATUSES.ENHANCED_ROYAL_ROAD.id || event.ability.guid === STATUSES.EXPANDED_ROYAL_ROAD.id || event.ability.guid === STATUSES.EXTENDED_ROYAL_ROAD.id) {
			this._rrRemovals++
		}
	}

	_onComplete() {

		if (this._rrCasts === this._sleeveCasts && this._rrCasts === this._rrRemovals) {
			this._isBadParse = true
		}
	}

	isBadParse() {
		return this._isBadParse
	}

}
