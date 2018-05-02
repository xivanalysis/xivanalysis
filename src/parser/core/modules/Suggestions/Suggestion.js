export const SEVERITY = {
	MAJOR: 1,
	MEDIUM: 2,
	MINOR: 3
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
