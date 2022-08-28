import {Layer} from 'data/layer'
import {StatusRoot} from '../root'

export const patch620: Layer<StatusRoot> = {
	patch: '6.2',
	data: {
		// SGE - New shield status for Holos
		HOLOSAKOS: {
			id: 3365,
			name: 'Holosakos',
			icon: 'https://xivapi.com/i/012000-012972.png',
			duration: 30000,
		},
	},
}
