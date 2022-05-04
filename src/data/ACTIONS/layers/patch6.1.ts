import {Layer} from 'data/layer'
import {ActionRoot} from '../root'
import {SHARED} from '../root/SHARED'

export const patch610: Layer<ActionRoot> = {
	patch: '6.1',
	data: {
		// NIN 6.1 raid buff changes
		TRICK_ATTACK: {statusesApplied: []},
		MUG: {statusesApplied: ['MUG_VULNERABILITY_UP']},

		// Tank 6.1 cooldown changes
		DEFIANCE: {cooldown: 3000},
		GRIT: {cooldown: 3000},
		IRON_WILL: {cooldown: 3000},
		ROYAL_GUARD: {cooldown: 3000},

		//SAM 6.1 action changes:
		HISSATSU_KAITEN: SHARED.UNKNOWN, //Kaiten was removed. But is job critical for pre-6.1 analysis.
		// Potency buffs, very important, breaks postionals without them.
		GEKKO: {
			potency: 330,
		},
		KASHA: {
			potency: 330,
		},
		// DNC 6.1 changes
		FLOURISH: {
			statusesApplied: [
				'FLOURISHING_SYMMETRY',
				'FLOURISHING_FLOW',
				'THREEFOLD_FAN_DANCE',
				'FOURFOLD_FAN_DANCE',
			],
		},

		// SMN 6.1 changes
		SEARING_LIGHT: {
			icon: 'https://xivapi.com/i/002000/002780.png',
			statusesApplied: ['SEARING_LIGHT'],
		},
		RUBY_RITE: {
			gcdRecast: 3000,
		},
		RUBY_CATASTROPHE: {
			gcdRecast: 3000,
		},

		// WHM 6.1 changes
		REGEN: {
			mpCost: 400,
		},
		LITURGY_OF_THE_BELL_ACTIVATION: {
			id: 28509,
			name: 'Liturgy of the Bell (Detonate)',
			icon: 'https://xivapi.com/i/002000/002649.png',
			cooldown: 1000,
		},

		PET_SEARING_LIGHT: {
			statusesApplied: [],
		},
	},
}
