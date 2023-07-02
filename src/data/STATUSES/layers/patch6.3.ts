import {Layer} from 'data/layer'
import {StatusRoot} from '../root'
import {SHARED} from '../root/SHARED'

export const patch630: Layer<StatusRoot> = {
	patch: '6.3',
	data: {
		// PLD 6.3 rework changes
		GORING_BLADE: SHARED.UNKNOWN,
		REQUIESCAT: {stacksApplied: 4},
		FIGHT_OR_FLIGHT: {duration: 20000},
		DIVINE_MIGHT: {
			id: 2673,
			name: 'Divine Might',
			icon: 'https://xivapi.com/i/012000/012521.png',
			duration: 30000,
			stacksApplied: 1,
		},
		DIVINE_VEIL: {
			id: 727,
			name: 'Divine Veil',
			icon: 'https://xivapi.com/i/012000/012509.png',
			duration: 30000,
		},
		DIVINE_VEIL_PROC: SHARED.UNKNOWN,
		BULWARK: {
			id: 77,
			name: 'Bulwark',
			icon: 'https://xivapi.com/i/010000/010156.png',
			duration: 10000,
		},
		BLADE_OF_VALOR: SHARED.UNKNOWN,
		BLADE_OF_FAITH_READY: SHARED.UNKNOWN,
		CONFITEOR_READY: {
			id: 3019,
			name: 'Confiteor Ready',
			icon: 'https://xivapi.com/i/012000/012520.png',
			duration: 30000,
		},

		// WAR 6.3 changes
		SHAKE_IT_OFF: {duration: 30000},
		SHAKE_IT_OFF_OVER_TIME: {
			id: 2108,
			name: 'Shake It Off (Over Time)',
			icon: 'https://xivapi.com/i/012000/012567.png',
			duration: 15000,
		},

		// MNK - Riddle of Earth changes
		RIDDLE_OF_EARTH: {stacksApplied: undefined},
		EARTHS_REPLY: {
			id: 1180,
			name: "Earth's Reply",
			icon: 'https://xivapi.com/i/012000/012531.png',
			duration: 15000,
		},

		// MCH 6.3 changes
		OVERHEATED: {
			id: 2688,
			name: 'Overheated',
			icon: 'https://xivapi.com/i/018000/018385.png',
			duration: 10000,
		},
	},
}
