import {iconUrl} from 'data/icon'
import {Attribute} from 'event'
import {ensureActions, BonusModifier} from '../type'

// Samurai Actions

export const SAM = ensureActions({
	// -----
	// Player GCDs
	// -----
	HAKAZE: {
		id: 7477,
		name: 'Hakaze',
		icon: iconUrl(3151),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	GYOFU: {
		id: 36963,
		name: 'Gyofu',
		icon: iconUrl(3191),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	JINPU: {
		id: 7478,
		name: 'Jinpu',
		icon: iconUrl(3152),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [
				7477,
				36963,
			],
		},
		statusesApplied: ['FUGETSU'],
	},

	ENPI: {
		id: 7486,
		name: 'Enpi',
		icon: iconUrl(3155),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
	},

	SHIFU: {
		id: 7479,
		name: 'Shifu',
		icon: iconUrl(3156),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [
				7477,
				36963,
			],
		},
		statusesApplied: ['FUKA'],
	},

	IAIJUTSU: {
		id: 7867,
		name: 'Iaijutsu',
		icon: iconUrl(3159),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		castTime: 1300,
	},

	HIGANBANA: {
		id: 7489,
		name: 'Higanbana',
		icon: iconUrl(3160),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		castTime: 1300,
		statusesApplied: ['HIGANBANA'],
	},

	GEKKO: {
		id: 7481,
		name: 'Gekko',
		icon: iconUrl(3158),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potencies: [{
			value: 180,
			bonusModifiers: [],
		}, {
			value: 230,
			bonusModifiers: [BonusModifier.POSITIONAL],
		}, {
			value: 390,
			bonusModifiers: [BonusModifier.COMBO],
		}, {
			value: 440,
			bonusModifiers: [BonusModifier.POSITIONAL, BonusModifier.COMBO],
		}],
		combo: {
			from: 7478,
			end: true,
		},
	},

	MANGETSU: {
		id: 7484,
		name: 'Mangetsu',
		icon: iconUrl(3163),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [25780],
			end: true,
		},
		statusesApplied: ['FUGETSU'],
	},

	TENKA_GOKEN: {
		id: 7488,
		name: 'Tenka Goken',
		icon: iconUrl(3161),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		castTime: 1300,
	},

	TENDO_GOKEN: { //TODO: Verify Icon
		id: 36965,
		name: 'Tendo Goken',
		icon: iconUrl(3193),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		castTime: 1300,
	},

	KASHA: {
		id: 7482,
		name: 'Kasha',
		icon: iconUrl(3164),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potencies: [{
			value: 180,
			bonusModifiers: [],
		}, {
			value: 230,
			bonusModifiers: [BonusModifier.POSITIONAL],
		}, {
			value: 390,
			bonusModifiers: [BonusModifier.COMBO],
		}, {
			value: 440,
			bonusModifiers: [BonusModifier.POSITIONAL, BonusModifier.COMBO],
		}],
		combo: {
			from: 7479,
			end: true,
		},
	},

	OKA: {
		id: 7485,
		name: 'Oka',
		icon: iconUrl(3165),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [25780],
			end: true,
		},
		statusesApplied: ['FUKA'],
	},

	MIDARE_SETSUGEKKA: {
		id: 7487,
		name: 'Midare Setsugekka',
		icon: iconUrl(3162),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		castTime: 1300,
	},

	TENDO_SETSUGEKKA: { //TODO: Verify, Icon
		id: 36966,
		name: 'Tendo Setsugekka',
		icon: iconUrl(3194),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		castTime: 1300,
		gcdRecast: 3200,
	},

	YUKIKAZE: {
		id: 7480,
		name: 'Yukikaze',
		icon: iconUrl(3166),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [
				7477,
				36963,
			],
			end: true,
		},
	},

	FUKO: {
		id: 25780,
		name: 'Fuko',
		icon: iconUrl(3189),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	TSUBAME_GAESHI: {
		id: 16483,
		name: 'Tsubame Gaeshi',
		icon: iconUrl(3180),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	KAESHI_GOKEN: {
		id: 16485,
		name: 'Kaeshi: Goken',
		icon: iconUrl(3182),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		gcdRecast: 2500,
	},

	KAESHI_SETSUGEKKA: {
		id: 16486,
		name: 'Kaeshi: Setsugekka',
		icon: iconUrl(3183),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		gcdRecast: 2500,
	},

	TENDO_KAESHI_GOKEN: { //TODO Id, Icon, Recast
		id: 36967,
		name: 'Tendo Kaeshi Goken',
		icon: iconUrl(3195),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		gcdRecast: 2500,
	},

	TENDO_KAESHI_SETSUGEKKA: { //TODO Id, Icon, Recast
		id: 36968,
		name: 'Tendo Kaeshi Setsugekka',
		icon: iconUrl(3196),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		gcdRecast: 3200,
	},

	OGI_NAMIKIRI: {
		id: 25781,
		name: 'Ogi Namikiri',
		icon: iconUrl(3187),
		onGcd: true,
		castTime: 1300,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	KAESHI_NAMIKIRI: {
		id: 25782,
		name: 'Kaeshi: Namikiri',
		icon: iconUrl(3188),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	// -----
	// Player OGCDs
	// -----

	THIRD_EYE: {
		id: 7498,
		name: 'Third Eye',
		icon: iconUrl(3153),
		cooldown: 15000,
		statusesApplied: ['THIRD_EYE'],
	},
	TENGETSU: {
		id: 36962,
		name: 'Tengetsu',
		icon: iconUrl(3190),
		cooldown: 15000,
		statusesApplied: ['TENGETSU'],
	},

	MEIKYO_SHISUI: {
		id: 7499,
		name: 'Meikyo Shisui',
		icon: iconUrl(3167),
		cooldown: 55000,
		statusesApplied: [
			'MEIKYO_SHISUI',
			'TSUBAME_GAESHI_READY',
		],
		charges: 2,
		breaksCombo: true,
	},

	HISSATSU_GYOTEN: {
		id: 7492,
		name: 'Hissatsu: Gyoten',
		icon: iconUrl(3169),
		cooldown: 10000,
	},

	HISSATSU_YATEN: {
		id: 7493,
		name: 'Hissatsu: Yaten',
		icon: iconUrl(3170),
		cooldown: 10000,
		statusesApplied: ['ENHANCED_ENPI'],
	},

	MEDITATE: {
		id: 7497,
		name: 'Meditate',
		icon: iconUrl(3172),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		cooldown: 60000,
		gcdRecast: 2500,
		statusesApplied: ['MEDITATE', 'MEDITATION'],
	},

	HISSATSU_SHINTEN: {
		id: 7490,
		name: 'Hissatsu: Shinten',
		icon: iconUrl(3173),
		cooldown: 1000,
	},

	HISSATSU_KYUTEN: {
		id: 7491,
		name: 'Hissatsu: Kyuten',
		icon: iconUrl(3174),
		cooldown: 1000,
	},

	HAGAKURE: {
		id: 7495,
		name: 'Hagakure',
		icon: iconUrl(3176),
		cooldown: 40000,
	},

	IKISHOTEN: {
		id: 16482,
		name: 'Ikishoten',
		icon: iconUrl(3179),
		cooldown: 120000,
		statusesApplied: [
			'OGI_NAMIKIRI_READY',
			'ZANSHIN_READY',
		],
	},

	HISSATSU_GUREN: {
		id: 7496,
		name: 'Hissatsu: Guren',
		icon: iconUrl(3177),
		cooldown: 60000,
		cooldownGroup: 10,
	},

	HISSATSU_SENEI: {
		id: 16481,
		name: 'Hissatsu: Senei',
		icon: iconUrl(3178),
		cooldown: 60000,
		cooldownGroup: 10,
	},

	SHOHA: {
		id: 16487,
		name: 'Shoha',
		icon: iconUrl(3184),
		cooldown: 15000,
	},

	ZANSHIN: {
		id: 36964,
		name: 'Zanshin',
		icon: iconUrl(3192),
		cooldown: 1000,
	},
})
