import {Layer} from 'data/layer'
import {StatusRoot} from '../root'

export const patch630: Layer<StatusRoot> = {
	patch: '6.3',
	data: {
		// PLD 6.3 rework changes
		GORING_BLADE: undefined,
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
		DIVINE_VEIL_PROC: undefined,
		BULWARK: {
			id: 77,
			name: 'Bulwark',
			icon: 'https://xivapi.com/i/010000/010156.png',
			duration: 10000,
		},
		BLADE_OF_VALOR: undefined,
		BLADE_OF_FAITH_READY: undefined,
		CONFITEOR_READY: {
			id: 3019,
			name: 'Confiteor Ready',
			icon: 'https://xivapi.com/i/012000/012520.png',
			duration: 30000,
		},
	},
}
