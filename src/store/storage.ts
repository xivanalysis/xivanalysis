import {autorun, set, toJS} from 'mobx'

interface Stores {
	[key: string]: object
}

export function configureStorage(stores: Stores) {
	// Remove the old state key from the redux storage
	// We're not storing enough stuff in LS at this point for it to
	// be worth trying to port the details across.
	localStorage.removeItem('state')

	for (const key in stores) {
		if (!stores[key]) { continue }
		const store = stores[key]

		const serialised = localStorage.getItem(key)
		if (serialised) {
			set(store, JSON.parse(serialised))
		}

		autorun(() => {
			localStorage.setItem(key, JSON.stringify(toJS(store)))
		})
	}
}
