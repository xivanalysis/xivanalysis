import CoreDeath from 'parser/core/modules/Death'

// I think this is right?
const TERAFLARE_ID = 9961

export default class Death extends CoreDeath {
	_teraflareCast = false

	constructor(...args) {
		super(...args)

		this.addHook('damage', {to: 'player', abilityId: TERAFLARE_ID}, this._onTeraflare)
	}

	_onTeraflare() {
		this._teraflareCast = true
	}

	shouldCountDeath() {
		if (!this._teraflareCast) { return true }

		// Teraflare being cast gives one free death~
		this._teraflareCast = false
		return false
	}
}
