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

		// SGE 6.1 changes
		SOTERIA: {stacksApplied: 4},

		// DNC 6.1 changes
		SILKEN_SYMMETRY: {
			name: 'Silken Symmetry',
		},
		SILKEN_FLOW: {
			name: 'Silken Flow',
		},
		FLOURISHING_SYMMETRY: {
			id: 3017,
			name: 'Flourishing Symmetry',
			icon: 'https://xivapi.com/i/013000/013725.png',
			duration: 30000,
		},
		FLOURISHING_FLOW: {
			id: 3018,
			name: 'Flourishing Flow',
			icon: 'https://xivapi.com/i/013000/013726.png',
			duration: 30000,
		},
	},
}
