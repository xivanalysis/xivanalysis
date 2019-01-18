import {autorun, set, toJS} from 'mobx'

interface Stores {
	[key: string]: object
}

export function configureStorage(stores: Stores) {
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
