import {matchClosestLower} from 'utilities'

export const SEVERITY = {
	// NOTE: Don't use MORBID, It's for deaths. I _will_ block the PRs on this.
	MORBID: 0,
	MAJOR: 1,
	MEDIUM: 2,
	MINOR: 3,
	// The matchClosest fall back to undefined, so let's use that for ignore too
	IGNORE: undefined,
}

export default class Suggestion {
	icon = '' // TODO: default image
	content = ''
	why = ''
	severity = SEVERITY.MEDIUM

	constructor(options) {
		Object.keys(options || {}).forEach(key => {
			this[key] = options[key]
		})
	}
}

export class TieredSuggestion extends Suggestion {
	constructor(options) {
		super({
			tiers: {},
			value: 0,
			matcher: matchClosestLower,
			...options,
		})
	}

	get severity() {
		return this.matcher(this.tiers, this.value)
	}

	// noop setter so it doesn't die from the base class
	set severity(value) { /* noop */ }
}
