import {Layer} from 'data/layer'
import {StatusRoot} from '../root'
import {SHARED} from '../root/SHARED'

export const patch540: Layer<StatusRoot> = {
	patch: '5.4',
	data: {
		// MNK 5.4 status updates
		GREASED_LIGHTNING: {duration: undefined},
		PERFECT_BALANCE: {duration: 15000, stacksApplied: 6},
		RIDDLE_OF_EARTH: {duration: 6000},

		// MNK 5.4 status additions
		FORMLESS_FIST: {
			id: 2513,
			name: 'Formless Fist',
			icon: 'https://xivapi.com/i/012000/012535.png',
			duration: 15000,
		},
		// Some shit for 6SS's speed buff

		// MNK 5.4 status deletions
		GREASED_LIGHTNING_II: SHARED.UNKNOWN,
		GREASED_LIGHTNING_III: SHARED.UNKNOWN,
		GREASED_LIGHTNING_IV: SHARED.UNKNOWN,
		EARTHS_REPLY: SHARED.UNKNOWN,
	},
}
