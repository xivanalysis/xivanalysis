const ALLOWED_KEYS = ['language', 'i18nOverlay']

export function loadState() {
	try {
		const serialized = localStorage.getItem('state')
		if (serialized == null) {
			return
		}

		const parsed = JSON.parse(serialized)
		for (const key in parsed) {
			if (! ALLOWED_KEYS.includes(key)) {
				delete parsed[key]
			}
		}

		return parsed

	} catch (err) {
		return
	}
}

export function saveState(state) {
	if (state) {
		const saved = {}
		for (const [key, val] of Object.entries(state)) {
			saved[key] = val
		}

		localStorage.setItem('state', JSON.stringify(saved))
	}
}
