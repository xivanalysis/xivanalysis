import math from "mathjsCustom"

export default class Rule {
	name = ""

	description = null

	requirements = []

	target = 95
	// TODO: Target mode percent/value

	get percent() {
		// wowa has a bunch of different modes for this stuff, i'm just going to use median for now
		// TODO: different requirement modes
		return math.median(this.requirements.map(requirement => requirement.percent));
	}

	constructor(options) {
		Object.keys(options || {}).forEach(key => {
			this[key] = options[key];
		});
	}
}
