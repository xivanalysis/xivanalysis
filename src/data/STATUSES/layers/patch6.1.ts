import {Layer} from 'data/layer'
import {StatusRoot} from '../root'
import {SHARED} from '../root/SHARED'

export const patch610: Layer<StatusRoot> = {
	patch: '6.1',
	data: {
		// NIN 6.1 buff changes
		MUG_VULNERABILITY_UP: {
			id: 638,
			name: 'Vulnerability Up',
			icon: 'https://xivapi.com/i/015000/015020.png',
			duration: 20000,
		},
		TRICK_ATTACK_VULNERABILITY_UP: SHARED.UNKNOWN,

		// SCH 6.1 duration changes
		EXPEDIENCE: {duration: 10000},

		// SGE 6.1 changes
		SOTERIA: {stacksApplied: 4},
	},
}
