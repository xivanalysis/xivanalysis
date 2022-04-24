import {Layer} from 'data/layer'
import {StatusRoot} from '../root'
import {SHARED} from '../root/SHARED'

export const patch610: Layer<StatusRoot> = {
	patch: '6.1',
	data: {
		// DRK 6.1 buff changes
		BLOOD_WEAPON: {
			duration: 15000,
			stacksApplied: 5,
		},

		// Duration varies by the remaining duration on Walking Dead when it was cleansed
		UNDEAD_REBIRTH: {
			id: 3255,
			name: 'Undead Rebirth',
			icon: 'https://xivapi.com/i/013000/013124.png',
		},

		// NIN 6.1 buff changes
		MUG_VULNERABILITY_UP: {
			id: 638,
			name: 'Vulnerability Up',
			icon: 'https://xivapi.com/i/015000/015020.png',
			duration: 20000,
		},
		TRICK_ATTACK_VULNERABILITY_UP: SHARED.UNKNOWN,

		// RPR 6.1 duration changes
		ENHANCED_HARPE: {duration: 20000},

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
