import {matchPath} from 'react-router-dom'

export const addExtraIndex = (obj, index) => {
	Object.keys(obj).forEach(key => {
		const val = obj[key]
		let newKey = val[index]
		if (!Array.isArray(newKey)) {
			newKey = [newKey]
		}
		newKey.forEach(key => obj[key] = val)
	})
	return obj
}

// This is pretty damn nasty, but it'll do for now
export const getPathMatch = pathname => {
	const page = matchPath(pathname, '/:page?')

	let path = '/'
	switch (page.params.page) {
	case 'find':    path = '/find/:code/:fight?'; break
	case 'analyse': path = '/analyse/:code/:fight/:combatant'; break
	default:        // Do nothing
	}

	return matchPath(pathname, path)
}

export const compose = (...fns) => fns.reduce(
	(f, g) => (...args) => f(g(...args))
)

/**
 * Create reverse key<->value mappings for an object and then freeze it to prevent further modifications.
 * @param {*KeyValue object to reverse map} obj
 */
export function enumify(obj) {
	for (const [key, val] of Object.entries(obj)) {
		obj[val] = key
	}
	return Object.freeze(obj)
}
