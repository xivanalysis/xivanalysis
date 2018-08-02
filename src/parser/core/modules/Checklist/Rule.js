import math from 'mathjsCustom'
import {matchClosestLower} from 'utilities'

export const TARGET = {
	SUCCESS: 2,
	DECENT: 1,
	FAIL: 0,
}

const STYLES = {
	[TARGET.SUCCESS]: {text: 'text-success', color: 'green', icon: 'checkmark', autoExpand: false},
	[TARGET.DECENT]: {text: 'text-warning', color: 'yellow', icon: 'warning sign', autoExpand: true},
	[TARGET.FAIL]: {text: 'text-error', color: 'red', icon: 'remove', autoExpand: true},
}

export default class Rule {
	name = ''
	description = null
	requirements = []
	target = 95
	decentTarget = 95

	get styles() {
		//specifically check target first, so if the decentTarget is higher, we show success anyway
		const target = this.percent >= this.target ? TARGET.SUCCESS : this.percent >= this.decentTarget ? TARGET.DECENT : TARGET.FAIL
		return STYLES[target]
	}

	get percent() {
		// WoWA has a bunch of different modes for this stuff, I'm just going to use mean for now. Because I'm mean. Hue.
		// TODO: different requirement modes
		const percents = this.requirements.map(requirement => requirement.percent)
		return percents.length? math.mean(percents) : 0
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

	get styles() {
		return STYLES[this.matcher(this.tiers, this.percent)]
	}
}
