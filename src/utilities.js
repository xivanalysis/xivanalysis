import { matchPath } from 'react-router-dom'

export const addExtraIndex = (obj, index) => {
	Object.keys(obj).forEach(key => {
		const val = obj[key]
		obj[val[index]] = val
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
