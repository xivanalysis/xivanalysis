import {Layer} from 'data/layer'
import {StatusRoot} from '../root'

export const patch540: Layer<StatusRoot> = {
	patch: '5.4',
	data: {
		// MNK 5.4 status updates
		GREASED_LIGHTNING: {duration: undefined},
		PERFECT_BALANCE: {duration: 18, stacksApplied: 6},

		// MNK 5.4 status additions
		FORMLESS_FIST: {
			id: 0,
			name: 'Formless Fist',
			icon: 'https://xivapi.com/i/000000/000000.png',
			duration: 15,
		},
		// Some shit for 6SS's speed buff
	},
}
