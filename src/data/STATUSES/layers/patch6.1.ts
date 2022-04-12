import {Layer} from 'data/layer'
import {StatusRoot} from '../root'
import {SHARED} from '../root/SHARED'

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
		TRICK_ATTACK_VULNERABILITY_UP: SHARED.UNKNOWN,

		// SCH 6.1 duration changes
		EXPEDIENCE: {duration: 10000},
	},
}
