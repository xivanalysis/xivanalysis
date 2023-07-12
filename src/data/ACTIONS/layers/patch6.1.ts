import {Layer} from 'data/layer'
import {ActionRoot} from '../root'
import {SHARED} from '../root/SHARED'
import {BonusModifier} from '../type'

export const patch610: Layer<ActionRoot> = {
	patch: '6.1',
	data: {
		// NIN 6.1 raid buff changes
		TRICK_ATTACK: {statusesApplied: ['TRICK_ATTACK']},
		MUG: {statusesApplied: ['MUG_VULNERABILITY_UP']},
		ARMOR_CRUSH: {
			potencies: [{
				value: 140,
				bonusModifiers: [],
			}, {
				value: 200,
				bonusModifiers: [BonusModifier.POSITIONAL],
			}, {
				value: 360,
				bonusModifiers: [BonusModifier.COMBO],
			}, {
				value: 420,
				bonusModifiers: [BonusModifier.POSITIONAL, BonusModifier.COMBO],
			}],
		},
		AEOLIAN_EDGE: {
			potencies: [{
				value: 140,
				bonusModifiers: [],
			}, {
				value: 200,
				bonusModifiers: [BonusModifier.POSITIONAL],
			}, {
				value: 380,
				bonusModifiers: [BonusModifier.COMBO],
			}, {
				value: 440,
				bonusModifiers: [BonusModifier.POSITIONAL, BonusModifier.COMBO],
			}],
		},

		// Tank 6.1 cooldown changes
		DEFIANCE: {cooldown: 3000},
		GRIT: {cooldown: 3000},
		IRON_WILL: {cooldown: 3000},
		ROYAL_GUARD: {cooldown: 3000},

		//SAM 6.1 action changes:
		HISSATSU_KAITEN: SHARED.UNKNOWN, //Kaiten was removed. But is job critical for pre-6.1 analysis.
		// Potency buffs, very important, breaks postionals without them.
		GEKKO: {
			potencies: [{
				value: 120,
				bonusModifiers: [],
			}, {
				value: 170,
				bonusModifiers: [BonusModifier.POSITIONAL],
			}, {
				value: 330,
				bonusModifiers: [BonusModifier.COMBO],
			}, {
				value: 370,
				bonusModifiers: [BonusModifier.POSITIONAL, BonusModifier.COMBO],
			}],
		},
		KASHA: {
			potencies: [{
				value: 120,
				bonusModifiers: [],
			}, {
				value: 170,
				bonusModifiers: [BonusModifier.POSITIONAL],
			}, {
				value: 330,
				bonusModifiers: [BonusModifier.COMBO],
			}, {
				value: 380,
				bonusModifiers: [BonusModifier.POSITIONAL, BonusModifier.COMBO],
			}],
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
		RUBY_RUIN_III: {
			gcdRecast: 3000,
		},
		RUBY_OUTBURST: {
			gcdRecast: 3000,
		},
		RUBY_RITE: {
			gcdRecast: 3000,
		},
		RUBY_CATASTROPHE: {
			gcdRecast: 3000,
		},

		PET_SEARING_LIGHT: {
			statusesApplied: [],
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

		//PLD 6.1 changes
		CLEMENCY: {
			breaksCombo: undefined,
		},
		HOLY_SPIRIT: {
			breaksCombo: undefined,
		},
		HOLY_CIRCLE: {
			breaksCombo: undefined,
		},
		REQUIESCAT: {
			statusesApplied: ['REQUIESCAT', 'BLADE_OF_FAITH_READY'],
		},
		CONFITEOR: {
			combo: undefined,
		},
		BLADE_OF_FAITH: {
			combo: {
				start: true,
			},
		},
	},
}
