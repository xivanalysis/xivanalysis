import {DisplayOrder} from 'parser/core/Analyser'
import {matchClosestLower} from 'utilities'

export const TARGET = {
	SUCCESS: 2,
	WARN: 1,
	FAIL: undefined,
}

const DEFAULT_TARGET = 95

export default class Rule {
	name = ''
	description = null
	requirements = []
	target = DEFAULT_TARGET
	displayOrder = DisplayOrder.DEFAULT
	showProgress = true

	get tier() {
		return matchClosestLower(
			{[this.target]: TARGET.SUCCESS},
			this.percent,
		)
	}

	get percent() {
		const weightedPercents = this.requirements.reduce((aggregate, requirement) => aggregate + requirement.percent * requirement.weight, 0)
		const totalWeight = this.requirements.reduce((aggregate, requirement) => aggregate + requirement.weight, 0)
		return totalWeight !== 0 ? weightedPercents / totalWeight : 0
	}

	constructor(options) {
		Object.keys(options || {}).forEach(key => {
			this[key] = options[key]
		})
	}
}

export class TieredRule extends Rule {
	constructor(options) {
		super({
			tiers: {},
			matcher: matchClosestLower,
			...options,
		})
	}

	get tier() {
		return this.matcher(this.tiers, this.percent)
	}
}
