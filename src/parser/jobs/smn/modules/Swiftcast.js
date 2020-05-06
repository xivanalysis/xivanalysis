import {SEVERITY} from 'parser/core/modules/Suggestions'
import {SwiftcastModule} from 'parser/core/modules/Swiftcast'
import {DWT_LENGTH, DWT_CAST_TIME_MOD} from './DWT'

const MISSED_SEVERITIES = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}

export default class Swiftcast extends SwiftcastModule {
	static handle = 'swiftcast'

	severityTiers = MISSED_SEVERITIES
	_dwtActive = false
	_dwtActiveTimestamp = 0

	constructor(...args) {
		super(...args)

		this.addEventHook('cast', {to: 'player'}, this._onCast)
		this.addEventHook('normaliseddamage', {by: 'player', abilityId: this.data.actions.DEATHFLARE.id}, this._endDWT)
		this.addEventHook('death', {to: 'player'}, this._endDWT)
	}

	_onCast(event) {
		const guid = event.ability.guid

		if (guid === this.data.actions.DREADWYRM_TRANCE.id) {
			this.debug(`DWT now active ${this.parser.formatTimestamp(event.timestamp)}`)
			this._dwtActive = true
			this._dwtActiveTimestamp = event.timestamp
			return
		}

		if (this._dwtActive && event.timestamp - this._dwtActiveTimestamp > DWT_LENGTH) {
			this._endDWT(event)
		}
	}

	_endDWT(event) {
		this.debug(`Ending DWT ${this.parser.formatTimestamp(event.timestamp)}`)
		this._dwtActive = false
	}

	considerSwiftAction(event) {
		this.debug(`DWT Active (${this._dwtActive}): ${event.name}`)
		if (this._dwtActive && event.castTime + DWT_CAST_TIME_MOD <= 0) {
			return false
		}
		return true
	}
}
