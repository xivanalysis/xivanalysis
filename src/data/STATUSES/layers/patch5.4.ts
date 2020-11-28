import {Layer} from 'data/layer'
import {StatusRoot} from '../root'

export const patch540: Layer<StatusRoot> = {
	patch: '5.4',
	data: {
		// MNK 5.4 status updates
		PERFECT_BALANCE: {duration: 18},
		FORMLESS_FIST: {
			id: 0,
			name: 'Formless Fist',
			icon: 'https://xivapi.com/i/000000/000000.png',
			duration: 15,
		},
	},
}
