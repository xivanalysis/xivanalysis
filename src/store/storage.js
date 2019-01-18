import _ from 'lodash'

// We only want to store some keys of state - things like report are load-specific
const ALLOWED_KEYS = [
	'settings',
]

// Load state from LS
export function loadState() {
	try {
		const serialized = localStorage.getItem('state')
		if (serialized == null) {
			return
		}

		// Only pull allowed keys out of the LS
		const parsed = JSON.parse(serialized)
		return _.pick(parsed, ALLOWED_KEYS)
	} catch (err) {
		return
	}
}

// Save state back into LS
export function saveState(state) {
	if (!state) { return }

	// Only save permitted keys
	const saved = _.pick(state, ALLOWED_KEYS)
	localStorage.setItem('state', JSON.stringify(saved))
}
