import {iconUrl} from 'data/icon'
import {Attribute} from 'event'
import {ensureActions, BonusModifier} from '../type'

// Samurai Actions

// Merge all 3 Tsubames into 1

export const SAM_COOLDOWN_GROUP = {
	TSUBAME: 16483,
}

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

	JINPU: {
		id: 7478,
		name: 'Jinpu',
		icon: iconUrl(3152),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 7477,
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
			from: 7477,
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
			value: 100,
			bonusModifiers: [],
		}, {
			value: 150,
			bonusModifiers: [BonusModifier.POSITIONAL],
		}, {
			value: 320,
			bonusModifiers: [BonusModifier.COMBO],
		}, {
			value: 370,
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

	KASHA: {
		id: 7482,
		name: 'Kasha',
		icon: iconUrl(3164),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potencies: [{
			value: 100,
			bonusModifiers: [],
		}, {
			value: 150,
			bonusModifiers: [BonusModifier.POSITIONAL],
		}, {
			value: 320,
			bonusModifiers: [BonusModifier.COMBO],
		}, {
			value: 370,
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

	YUKIKAZE: {
		id: 7480,
		name: 'Yukikaze',
		icon: iconUrl(3166),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 7477,
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

	MEIKYO_SHISUI: {
		id: 7499,
		name: 'Meikyo Shisui',
		icon: iconUrl(3167),
		cooldown: 55000,
		statusesApplied: ['MEIKYO_SHISUI'],
		charges: 2,
	},

	HISSATSU_KAITEN: {
		id: 7494,
		name: 'Hissatsu: Kaiten',
		icon: iconUrl(3168),
		cooldown: 1000,
		statusesApplied: ['KAITEN'],
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
	},

	HISSATSU_GUREN: {
		id: 7496,
		name: 'Hissatsu: Guren',
		icon: iconUrl(3177),
		cooldown: 120000,
		cooldownGroup: 10,
	},

	HISSATSU_SENEI: {
		id: 16481,
		name: 'Hissatsu: Senei',
		icon: iconUrl(3178),
		cooldown: 120000,
		cooldownGroup: 10,
	},

	TSUBAME_GAESHI: {
		id: 16483,
		name: 'Tsubame Gaeshi',
		icon: iconUrl(3180),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		cooldown: 60000,
		charges: 2,
	},

	KAESHI_HIGANBANA: {
		id: 16484,
		name: 'Kaeshi: Higanbana',
		icon: iconUrl(3181),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		cooldown: 60000,
		gcdRecast: 2500,
		cooldownGroup: SAM_COOLDOWN_GROUP.TSUBAME,
		statusesApplied: ['HIGANBANA'],
		charges: 2, //I have to give All Tsubame actions 2 charges for CDDT to function properly.
	},

	KAESHI_GOKEN: {
		id: 16485,
		name: 'Kaeshi: Goken',
		icon: iconUrl(3182),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		gcdRecast: 2500,
		cooldown: 60000,
		cooldownGroup: SAM_COOLDOWN_GROUP.TSUBAME,
		charges: 2, //I have to give All Tsubame actions 2 charges for CDDT to function properly.
	},

	KAESHI_SETSUGEKKA: {
		id: 16486,
		name: 'Kaeshi: Setsugekka',
		icon: iconUrl(3183),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		gcdRecast: 2500,
		cooldown: 60000,
		cooldownGroup: SAM_COOLDOWN_GROUP.TSUBAME,
		charges: 2, //I have to give All Tsubame actions 2 charges for CDDT to function properly.

	},

	SHOHA: {
		id: 16487,
		name: 'Shoha',
		icon: iconUrl(3184),
		cooldown: 15000,
	},

	SHOHA_II: { //WHY SE WHY
		id: 25779,
		name: 'Shoha II',
		icon: iconUrl(3185),
		cooldown: 15000,
	},
})
