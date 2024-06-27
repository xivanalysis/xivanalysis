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
		icon: 'https://xivapi.com/i/003000/003151.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	GYOFU: {
		id: 36963,
		name: 'Gyofu',
		icon: 'icon', //TODO: Add Icon
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	JINPU: {
		id: 7478,
		name: 'Jinpu',
		icon: 'https://xivapi.com/i/003000/003152.png',
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
		icon: 'https://xivapi.com/i/003000/003155.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
	},

	SHIFU: {
		id: 7479,
		name: 'Shifu',
		icon: 'https://xivapi.com/i/003000/003156.png',
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
		icon: 'https://xivapi.com/i/003000/003159.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		castTime: 1300,
	},

	HIGANBANA: {
		id: 7489,
		name: 'Higanbana',
		icon: 'https://xivapi.com/i/003000/003160.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		castTime: 1300,
		statusesApplied: ['HIGANBANA'],
	},

	GEKKO: {
		id: 7481,
		name: 'Gekko',
		icon: 'https://xivapi.com/i/003000/003158.png',
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
		icon: 'https://xivapi.com/i/003000/003163.png',
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
		icon: 'https://xivapi.com/i/003000/003161.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		castTime: 1300,
	},

	TENDO_GOKEN: { //TODO: Verify Icon
		id: 36965,
		name: 'Tendo Goken',
		icon: 'icon',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		castTime: 1300,
	},

	KASHA: {
		id: 7482,
		name: 'Kasha',
		icon: 'https://xivapi.com/i/003000/003164.png',
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
		icon: 'https://xivapi.com/i/003000/003165.png',
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
		icon: 'https://xivapi.com/i/003000/003162.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		castTime: 1300,
	},

	TENDO_SETSUGEKKA: { //TODO: Verify, Icon
		id: 36966,
		name: 'Tendo Setsugekka',
		icon: 'https://xivapi.com/i/003000/003162.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		castTime: 1300,
		gcdRecast: 3500,
	},

	YUKIKAZE: {
		id: 7480,
		name: 'Yukikaze',
		icon: 'https://xivapi.com/i/003000/003166.png',
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
		icon: 'https://xivapi.com/i/003000/003189.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	TSUBAME_GAESHI: {
		id: 16483,
		name: 'Tsubame Gaeshi',
		icon: 'https://xivapi.com/i/003000/003180.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	KAESHI_GOKEN: {
		id: 16485,
		name: 'Kaeshi: Goken',
		icon: 'https://xivapi.com/i/003000/003182.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		gcdRecast: 2500,
	},

	KAESHI_SETSUGEKKA: {
		id: 16486,
		name: 'Kaeshi: Setsugekka',
		icon: 'https://xivapi.com/i/003000/003183.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		gcdRecast: 2500,
	},

	TENDO_KAESHI_GOKEN: { //TODO Id, Icon, Recast
		id: 36967,
		name: 'Tendo Kaeshi Goken',
		icon: 'icon',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		gcdRecast: 2500,
	},

	TENDO_KAESHI_SETSUGEKKA: { //TODO Id, Icon, Recast
		id: 36968,
		name: 'Tendo Kaeshi Setsugekka',
		icon: 'icon',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		gcdRecast: 3500,
	},

	OGI_NAMIKIRI: {
		id: 25781,
		name: 'Ogi Namikiri',
		icon: 'https://xivapi.com/i/003000/003187.png',
		onGcd: true,
		castTime: 1300,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	KAESHI_NAMIKIRI: {
		id: 25782,
		name: 'Kaeshi: Namikiri',
		icon: 'https://xivapi.com/i/003000/003188.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	// -----
	// Player OGCDs
	// -----

	THIRD_EYE: {
		id: 7498,
		name: 'Third Eye',
		icon: 'https://xivapi.com/i/003000/003153.png',
		cooldown: 15000,
		statusesApplied: ['THIRD_EYE'],
	},
	TENGETSU: {
		id: 36962,
		name: 'Tengetsu',
		icon: 'icon',
		cooldown: 15000,
		statusesApplied: ['TENGETSU'],
	},

	MEIKYO_SHISUI: {
		id: 7499,
		name: 'Meikyo Shisui',
		icon: 'https://xivapi.com/i/003000/003167.png',
		cooldown: 55000,
		statusesApplied: [
			'MEIKYO_SHISUI',
			'TSUBAME_GAESHI_READY',
		],
		charges: 2,
	},

	HISSATSU_GYOTEN: {
		id: 7492,
		name: 'Hissatsu: Gyoten',
		icon: 'https://xivapi.com/i/003000/003169.png',
		cooldown: 10000,
	},

	HISSATSU_YATEN: {
		id: 7493,
		name: 'Hissatsu: Yaten',
		icon: 'https://xivapi.com/i/003000/003170.png',
		cooldown: 10000,
		statusesApplied: ['ENHANCED_ENPI'],
	},

	MEDITATE: {
		id: 7497,
		name: 'Meditate',
		icon: 'https://xivapi.com/i/003000/003172.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		cooldown: 60000,
		gcdRecast: 2500,
		statusesApplied: ['MEDITATE', 'MEDITATION'],
	},

	HISSATSU_SHINTEN: {
		id: 7490,
		name: 'Hissatsu: Shinten',
		icon: 'https://xivapi.com/i/003000/003173.png',
		cooldown: 1000,
	},

	HISSATSU_KYUTEN: {
		id: 7491,
		name: 'Hissatsu: Kyuten',
		icon: 'https://xivapi.com/i/003000/003174.png',
		cooldown: 1000,
	},

	HAGAKURE: {
		id: 7495,
		name: 'Hagakure',
		icon: 'https://xivapi.com/i/003000/003176.png',
		cooldown: 40000,
	},

	IKISHOTEN: {
		id: 16482,
		name: 'Ikishoten',
		icon: 'https://xivapi.com/i/003000/003179.png',
		cooldown: 120000,
		statusesApplied: [
			'OGI_NAMIKIRI_READY',
			'ZANSHIN_READY',
		],
	},

	HISSATSU_GUREN: {
		id: 7496,
		name: 'Hissatsu: Guren',
		icon: 'https://xivapi.com/i/003000/003177.png',
		cooldown: 60000,
		cooldownGroup: 10,
	},

	HISSATSU_SENEI: {
		id: 16481,
		name: 'Hissatsu: Senei',
		icon: 'https://xivapi.com/i/003000/003178.png',
		cooldown: 60000,
		cooldownGroup: 10,
	},

	SHOHA: { //TODO: Verify new icon
		id: 16487,
		name: 'Shoha',
		icon: 'https://xivapi.com/i/003000/003184.png',
		cooldown: 15000,
	},

	ZANSHIN: {
		id: 36964,
		name: 'Zanshin',
		icon: 'icon',
		cooldown: 1000,
	},
})
