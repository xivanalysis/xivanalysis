import {Layer} from 'data/layer'
import {StatusRoot} from '../root'

export const patch610: Layer<StatusRoot> = {
	patch: '6.1',
	data: {
		// NIN 6.1 buff changes
		MUG: {
			id: 3183,
			name: 'Mug',
			icon: 'https://xivapi.com/i/014000/014942.png',
			duration: 20000,
		},

		// SCH 6.1 duration changes
		EXPEDIENCE: {duration: 10000},

		// DNC 6.1 changes
		SILKEN_SYMMETRY: {
			name: 'Silken Symmetry',
		},
		SILKEN_FLOW: {
			name: 'Silken Flow',
		},
	},
}
