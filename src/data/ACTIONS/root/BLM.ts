import {iconUrl} from 'data/icon'
import {Attribute} from 'event'
import {ensureActions} from '../type'

export const BLM = ensureActions({
	BLIZZARD_I: {
		id: 142,
		name: 'Blizzard',
		icon: iconUrl(454),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2500,
		mpCost: 400,
	},
	BLIZZARD_II: {
		id: 25793,
		name: 'Blizzard II',
		icon: iconUrl(2668),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3000,
		mpCost: 800,
	},
	BLIZZARD_III: {
		id: 154,
		name: 'Blizzard III',
		icon: iconUrl(456),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3500,
		mpCost: 800,
	},
	BLIZZARD_IV: {
		id: 3576,
		name: 'Blizzard IV',
		icon: iconUrl(2659),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2500,
		mpCost: 800,
	},
	FREEZE: {
		id: 159,
		name: 'Freeze',
		icon: iconUrl(2653),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2800,
		mpCost: 1000,
	},
	UMBRAL_SOUL: {
		id: 16506,
		name: 'Umbral Soul',
		icon: iconUrl(2666),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	FIRE_I: {
		id: 141,
		name: 'Fire',
		icon: iconUrl(451),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2500,
		mpCost: 800,
	},
	FIRE_II: {
		id: 147,
		name: 'Fire II',
		icon: iconUrl(452),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3000,
		mpCost: 1500,
	},
	FIRE_III: {
		id: 152,
		name: 'Fire III',
		icon: iconUrl(453),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3500,
		mpCost: 2000,
	},
	FIRE_IV: {
		id: 3577,
		name: 'Fire IV',
		icon: iconUrl(2660),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2800,
		mpCost: 800,
	},
	FLARE: {
		id: 162,
		name: 'Flare',
		icon: iconUrl(2652),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 4000,
	},
	DESPAIR: {
		id: 16505,
		name: 'Despair',
		icon: iconUrl(2665),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3000,
	},
	FLARE_STAR: {
		id: 36989,
		name: 'Flare Star',
		icon: 'https://xivapi.com/i/002000/002652.png', // TODO
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3000,
	},
	THUNDER_III: {
		id: 153,
		name: 'Thunder III',
		icon: iconUrl(459),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		statusesApplied: ['THUNDER_III'],
	},
	HIGH_THUNDER: {
		id: 36986,
		name: 'High Thunder',
		icon: 'https://xivapi.com/i/000000/000459.png', // TODO
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		statusesApplied: ['HIGH_THUNDER'],
	},
	THUNDER_IV: {
		id: 7420,
		name: 'Thunder IV',
		icon: iconUrl(2662),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		statusesApplied: ['THUNDER_IV'],
	},
	HIGH_THUNDER_II: {
		id: 36987,
		name: 'High Thunder II',
		icon: 'https://xivapi.com/i/002000/002662.png', // TODO
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		statusesApplied: ['HIGH_THUNDER_II'],
	},
	SCATHE: {
		id: 156,
		name: 'Scathe',
		icon: iconUrl(462),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		mpCost: 800,
	},
	FOUL: {
		id: 7422,
		name: 'Foul',
		icon: iconUrl(2664),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	XENOGLOSSY: {
		id: 16507,
		name: 'Xenoglossy',
		icon: iconUrl(2667),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	TRANSPOSE: {
		id: 149,
		name: 'Transpose',
		icon: iconUrl(466),
		cooldown: 5000,
	},
	MANAFONT: {
		id: 158,
		name: 'Manafont',
		icon: iconUrl(2651),
		cooldown: 120000,
	},
	MANAWARD: {
		id: 157,
		name: 'Manaward',
		icon: iconUrl(463),
		cooldown: 120000,
		statusesApplied: ['MANAWARD'],
	},
	AETHERIAL_MANIPULATION: {
		id: 155,
		name: 'Aetherial Manipulation',
		icon: iconUrl(467),
		cooldown: 10000,
	},
	LEY_LINES: {
		id: 3573,
		name: 'Ley Lines',
		icon: iconUrl(2656),
		cooldown: 120000,
		statusesApplied: ['LEY_LINES'],
	},
	BETWEEN_THE_LINES: {
		id: 7419,
		name: 'Between the Lines',
		icon: iconUrl(2661),
		cooldown: 3000,
	},
	RETRACE: {
		id: 36988,
		name: 'Retrace',
		icon: 'https://xivapi.com/i/002000/002656.png', // TODO
		cooldown: 40000,
	},
	TRIPLECAST: {
		id: 7421,
		name: 'Triplecast',
		icon: iconUrl(2663),
		cooldown: 60000,
		statusesApplied: ['TRIPLECAST'],
		charges: 2,
	},
	HIGH_FIRE_II: {
		id: 25794,
		name: 'High Fire II',
		icon: iconUrl(2669),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3000,
		mpCost: 1500,
	},
	HIGH_BLIZZARD_II: {
		id: 25795,
		name: 'High Blizzard II',
		icon: iconUrl(2670),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3000,
		mpCost: 800,
	},
	AMPLIFIER: {
		id: 25796,
		name: 'Amplifier',
		icon: iconUrl(2671),
		cooldown: 120000,
	},
	PARADOX: {
		id: 25797,
		name: 'Paradox',
		icon: iconUrl(2672),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		mpCost: 1600,
	},
})
