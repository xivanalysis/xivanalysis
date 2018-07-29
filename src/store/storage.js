export function loadState() {
	try {
		const serialized = localStorage.getItem('state')
		if (serialized == null) {
			return
		}

		return JSON.parse(serialized)

	} catch (err) {
		return
	}
}

export function saveState(state) {
	localStorage.setItem('state', JSON.stringify(state))
}
