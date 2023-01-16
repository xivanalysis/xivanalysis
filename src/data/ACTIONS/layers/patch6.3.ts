import {Layer} from 'data/layer'
import {ActionRoot} from '../root'

export const patch630: Layer<ActionRoot> = {
	patch: '6.3',
	data: {
		// BRD - Nature's Minne CD change
		NATURES_MINNE: {cooldown: 120000},
		// DRG - Life Surge CD change
		LIFE_SURGE: {cooldown: 40000},
		// WHM - Assize CD change
		ASSIZE: {cooldown: 40000},

		// PLD 6.3 rework changes
		GORING_BLADE: {
			cooldown: 60000,
			combo: undefined,
			statusesApplied: undefined,
		},
		ROYAL_AUTHORITY: {
			statusesApplied: ['SWORD_OATH', 'DIVINE_MIGHT'],
		},
		CONFITEOR: {
			combo: undefined,
		},
		BLADE_OF_FAITH: {
			combo: undefined,
		},
		BLADE_OF_TRUTH: {
			combo: undefined,
		},
		BLADE_OF_VALOR: {
			combo: undefined,
		},
		BULWARK: {
			id: 22,
			name: 'Bulwark',
			icon: 'https://xivapi.com/i/000000/000167.png',
			onGcd: false,
			cooldown: 90000,
			statusesApplied: ['BULWARK'],
		},
		DIVINE_VEIL: {statusesApplied: ['DIVINE_VEIL']},
	},
}
