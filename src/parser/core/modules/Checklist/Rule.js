import math from 'mathjsCustom'

export default class Rule {
	name = ''
	description = null
	requirements = []
	target = 95
	// TODO: Target mode percent/value

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
