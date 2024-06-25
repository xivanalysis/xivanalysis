import {iconUrl} from 'data/icon'
import {Layer} from 'data/layer'
import {StatusRoot} from '../root'

export const patch620: Layer<StatusRoot> = {
	patch: '6.2',
	data: {
		// SGE - New shield status for Holos
		HOLOSAKOS: {
			id: 3365,
			name: 'Holosakos',
			icon: iconUrl(12972),
			duration: 30000,
		},

		// WHM - New Lilybell duration
		LITURGY_OF_THE_BELL: {
			duration: 20000,
		},
	},
}
