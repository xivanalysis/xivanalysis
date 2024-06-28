import {iconUrl} from 'data/icon'
import {Attribute} from 'event'
import {ensureActions} from '../type'

export const PLD = ensureActions({
	// -----
	// Player GCDs
	// -----
	FAST_BLADE: {
		id: 9,
		name: 'Fast Blade',
		icon: iconUrl(158),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},
	RIOT_BLADE: {
		id: 15,
		name: 'Riot Blade',
		icon: iconUrl(156),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 9,
		},
	},
	RAGE_OF_HALONE: {
		id: 21,
		name: 'Rage Of Halone',
		icon: iconUrl(155),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 15,
			end: true,
		},
	},
	ROYAL_AUTHORITY: {
		id: 3539,
		name: 'Royal Authority',
		icon: iconUrl(2507),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 15,
			end: true,
		},
		statusesApplied: ['SWORD_OATH', 'DIVINE_MIGHT'],
	},
	SHIELD_LOB: {
		id: 24,
		name: 'Shield Lob',
		icon: iconUrl(164),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},
	SHIELD_BASH: {
		id: 16,
		name: 'Shield Bash',
		icon: iconUrl(154),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: true,
	},
	TOTAL_ECLIPSE: {
		id: 7381,
		name: 'Total Eclipse',
		icon: iconUrl(2511),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},
	PROMINENCE: {
		id: 16457,
		name: 'Prominence',
		icon: iconUrl(2516),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 7381,
			end: true,
		},
		statusesApplied: ['DIVINE_MIGHT'],
	},
	GORING_BLADE: {
		id: 3538,
		name: 'Goring Blade',
		icon: iconUrl(2506),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		cooldown: 60000,
		gcdRecast: 2500,
	},
	CLEMENCY: {
		id: 3541,
		name: 'Clemency',
		icon: iconUrl(2509),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
	},
	HOLY_SPIRIT: {
		id: 7384,
		name: 'Holy Spirit',
		icon: iconUrl(2514),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
	},
	HOLY_CIRCLE: {
		id: 16458,
		name: 'Holy Circle',
		icon: iconUrl(2517),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
	},
	ATONEMENT: {
		id: 16460,
		name: 'Atonement',
		icon: iconUrl(2519),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
	},
	CONFITEOR: {
		id: 16459,
		name: 'Confiteor',
		icon: iconUrl(2518),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		combo: {
			start: true,
		},
	},
	BLADE_OF_FAITH: {
		id: 25748,
		name: 'Blade of Faith',
		icon: iconUrl(2952),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		combo: {
			from: 16459,
		},
	},
	BLADE_OF_TRUTH: {
		id: 25749,
		name: 'Blade of Truth',
		icon: iconUrl(2953),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		combo: {
			from: 25748,
		},
	},
	BLADE_OF_VALOR: {
		id: 25750,
		name: 'Blade of Valor',
		icon: iconUrl(2954),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		combo: {
			from: 25749,
			end: true,
		},
	},

	// -----
	// Player oGCDs
	// -----
	FIGHT_OR_FLIGHT: {
		id: 20,
		name: 'Fight Or Flight',
		icon: iconUrl(166),
		onGcd: false,
		cooldown: 60000,
		statusesApplied: ['FIGHT_OR_FLIGHT'],
	},
	IRON_WILL: {
		id: 28,
		name: 'Iron Will',
		icon: iconUrl(2505),
		onGcd: false,
		cooldown: 2000,
	},
	RELEASE_IRON_WILL: {
		id: 32065,
		name: 'Release Iron Will',
		icon: 'https://xivapi.com/i/002000/002521.png',
		onGcd: false,
		cooldown: 1000,
	},
	SENTINEL: {
		id: 17,
		name: 'Sentinel',
		icon: iconUrl(151),
		onGcd: false,
		cooldown: 120000,
		statusesApplied: ['SENTINEL'],
	},
	CIRCLE_OF_SCORN: {
		id: 23,
		name: 'Circle Of Scorn',
		icon: iconUrl(161),
		onGcd: false,
		cooldown: 30000,
		statusesApplied: ['CIRCLE_OF_SCORN'],
	},
	COVER: {
		id: 27,
		name: 'Cover',
		icon: iconUrl(2501),
		onGcd: false,
		cooldown: 120000,
		statusesApplied: ['COVER', 'COVERED'],
	},
	SPIRITS_WITHIN: {
		id: 29,
		name: 'Spirits Within',
		icon: iconUrl(2503),
		onGcd: false,
		cooldown: 30000,
	},
	HALLOWED_GROUND: {
		id: 30,
		name: 'Hallowed Ground',
		icon: iconUrl(2502),
		onGcd: false,
		cooldown: 420000,
		statusesApplied: ['HALLOWED_GROUND'],
	},
	BULWARK: {
		id: 22,
		name: 'Bulwark',
		icon: 'https://xivapi.com/i/000000/000167.png',
		onGcd: false,
		cooldown: 90000,
		statusesApplied: ['BULWARK'],
	},
	SHELTRON: {
		id: 3542,
		name: 'Sheltron',
		icon: iconUrl(2510),
		onGcd: false,
		cooldown: 5000,
		statusesApplied: ['SHELTRON'],
	},
	DIVINE_VEIL: {
		id: 3540,
		name: 'Divine Veil',
		icon: iconUrl(2508),
		onGcd: false,
		cooldown: 90000,
		statusesApplied: ['DIVINE_VEIL'],
	},
	INTERVENTION: {
		id: 7382,
		name: 'Intervention',
		icon: iconUrl(2512),
		onGcd: false,
		cooldown: 10000,
		statusesApplied: ['INTERVENTION'],
	},
	REQUIESCAT: {
		id: 7383,
		name: 'Requiescat',
		icon: iconUrl(2513),
		onGcd: false,
		cooldown: 60000,
		statusesApplied: ['REQUIESCAT', 'CONFITEOR_READY'],
	},
	PASSAGE_OF_ARMS: {
		id: 7385,
		name: 'Passage Of Arms',
		icon: iconUrl(2515),
		onGcd: false,
		cooldown: 120000,
		statusesApplied: ['PASSAGE_OF_ARMS'],
	},
	INTERVENE: {
		id: 16461,
		name: 'Intervene',
		icon: iconUrl(2520),
		onGcd: false,
		cooldown: 30000,
		charges: 2,
	},
	HOLY_SHELTRON: {
		id: 25746,
		name: 'Holy Sheltron',
		icon: iconUrl(2950),
		onGcd: false,
		cooldown: 5000,
		statusesApplied: ['HOLY_SHELTRON'],
	},
	EXPIACION: {
		id: 25747,
		name: 'Expiacion',
		icon: iconUrl(2951),
		onGcd: false,
		cooldown: 30000,
	},
})
