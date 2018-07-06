import CoreAoE from 'parser/core/modules/AoE'

const EASTERLY_NAME = 'Easterly'

export default class AoE extends CoreAoE {
	_easterlyIds = []

	constructor(...args) {
		super(...args)

		// It'd be nice to reference them by ID or something but it's not possible at the moment.
		this._easterlyIds = this.parser.report.enemies
			.filter(enemy => enemy.name === EASTERLY_NAME)
			.map(enemy => enemy.id)
	}

	isValidHit(event) {
		if (!super.isValidHit(event)) {
			return false
		}

		// Easterlies aren't valid targets
		return !this._easterlyIds.includes(event.targetID)
	}
}
