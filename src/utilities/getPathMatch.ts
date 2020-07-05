import {matchPath} from 'react-router'

// This is pretty damn nasty, but it'll do for now
export function getPathMatch<Params extends { [K in keyof Params]?: string }>(pathname: string) {
	const page = matchPath<{ page: string }>(pathname, {path: '/:page?'})

	let path = '/'
	switch (page !== null && page.params.page) {
	case 'find':    path = '/find/:code/:fight?'; break
	case 'analyse': path = '/analyse/:code/:fight/:combatant'; break
	default:        // Do nothing
	}

	return matchPath<Params>(pathname, {path})
}
