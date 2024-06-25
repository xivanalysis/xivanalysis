import {iconUrl} from 'data/icon'
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
			icon: iconUrl(12521),
			duration: 30000,
			stacksApplied: 1,
		},
		DIVINE_VEIL: {
			id: 727,
			name: 'Divine Veil',
			icon: iconUrl(12509),
			duration: 30000,
		},
		DIVINE_VEIL_PROC: SHARED.UNKNOWN,
		BULWARK: {
			id: 77,
			name: 'Bulwark',
			icon: iconUrl(10156),
			duration: 10000,
		},
		BLADE_OF_VALOR: SHARED.UNKNOWN,
		BLADE_OF_FAITH_READY: SHARED.UNKNOWN,
		CONFITEOR_READY: {
			id: 3019,
			name: 'Confiteor Ready',
			icon: iconUrl(12520),
			duration: 30000,
		},

		// WAR 6.3 changes
		SHAKE_IT_OFF: {duration: 30000},
		SHAKE_IT_OFF_OVER_TIME: {
			id: 2108,
			name: 'Shake It Off (Over Time)',
			icon: iconUrl(12567),
			duration: 15000,
		},

		// MNK - Riddle of Earth changes
		RIDDLE_OF_EARTH: {stacksApplied: undefined},
		EARTHS_REPLY: {
			id: 1180,
			name: "Earth's Reply",
			icon: iconUrl(12531),
			duration: 15000,
		},

		// MCH 6.3 changes
		OVERHEATED: {
			id: 2688,
			name: 'Overheated',
			icon: iconUrl(18385),
			duration: 10000,
		},
	},
}
