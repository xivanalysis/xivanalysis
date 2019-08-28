// Putting all role actions in one file 'cus a lot of them are shared between multiple roles
export default {
	// Tank Actions
	RAMPART: {
		id: 7531,
		name: 'Rampart',
		icon: 'https://xivapi.com/i/000000/000801.png',
		cooldown: 90,
		duration: 20,
	},

	LOW_BLOW: {
		id: 7540,
		name: 'Low Blow',
		icon: 'https://xivapi.com/i/000000/000802.png',
		cooldown: 25,
	},

	PROVOKE: {
		id: 7533,
		name: 'Provoke',
		icon: 'https://xivapi.com/i/000000/000803.png',
		cooldown: 40,
	},

	CONVALESCENCE: {
		id: 7532,
		name: 'Convalescence',
		icon: 'https://xivapi.com/i/000000/000804.png',
		cooldown: 120,
	},

	ANTICIPATION: {
		id: 7536,
		name: 'Anticipation',
		icon: 'https://xivapi.com/i/000000/000805.png',
		cooldown: 60,
	},

	REPRISAL: {
		id: 7535,
		name: 'Reprisal',
		icon: 'https://xivapi.com/i/000000/000806.png',
		cooldown: 60,
		duration: 5,
	},

	AWARENESS: {
		id: 7534,
		name: 'Awareness',
		icon: 'https://xivapi.com/i/000000/000807.png',
		cooldown: 120,
	},

	INTERJECT: {
		id: 7538,
		name: 'Interject',
		icon: 'https://xivapi.com/i/000000/000808.png',
		cooldown: 30,
	},

	ULTIMATUM: {
		id: 7539,
		name: 'Ultimatum',
		icon: 'https://xivapi.com/i/000000/000809.png',
		cooldown: 90,
	},

	SHIRK: {
		id: 7537,
		name: 'Shirk',
		icon: 'https://xivapi.com/i/000000/000810.png',
		cooldown: 120,
	},

	// Healer Actions
	CLERIC_STANCE: {
		id: 7567,
		name: 'Cleric Stance',
		icon: 'https://xivapi.com/i/000000/000881.png',
		cooldown: 90,
	},

	BREAK: {
		id: 7558,
		name: 'Break',
		icon: 'https://xivapi.com/i/000000/000862.png',
		onGcd: true,
		castTime: 2.5,
		mpCost: 0,
		mpCostFactor: 0,
	},

	PROTECT: {
		id: 7572,
		name: 'Protect',
		icon: 'https://xivapi.com/i/000000/000883.png',
		onGcd: true,
		cooldown: 2.5,
		castTime: 3,
		mpCost: 0,
		mpCostFactor: 0,
	},

	ESUNA: {
		id: 7568,
		name: 'Esuna',
		icon: 'https://xivapi.com/i/000000/000884.png',
		onGcd: true,
		cooldown: 2.5,
		castTime: 1,
		mpCost: 600,
		mpCostFactor: 5,
	},

	LUCID_DREAMING: {
		id: 7562,
		name: 'Lucid Dreaming',
		icon: 'https://xivapi.com/i/000000/000865.png',
		cooldown: 60,
		duration: 21,
	},

	SWIFTCAST: {
		id: 7561,
		name: 'Swiftcast',
		icon: 'https://xivapi.com/i/000000/000866.png',
		cooldown: 60,
		duration: 10,
	},

	EYE_FOR_AN_EYE: {
		id: 7569,
		name: 'Eye for an Eye',
		icon: 'https://xivapi.com/i/000000/000887.png',
		cooldown: 180,
	},

	LARGESSE: {
		id: 7570,
		name: 'Largesse',
		icon: 'https://xivapi.com/i/000000/000888.png',
		cooldown: 90,
	},

	SURECAST: {
		id: 7559,
		name: 'Surecast',
		icon: 'https://xivapi.com/i/000000/000869.png',
		cooldown: 120,
		duration: 6,
	},

	RESCUE: {
		id: 7571,
		name: 'Rescue',
		icon: 'https://xivapi.com/i/000000/000890.png',
		cooldown: 150,
	},

	// Physical Ranged DPS
	SECOND_WIND: {
		id: 7541,
		name: 'Second Wind',
		icon: 'https://xivapi.com/i/000000/000821.png',
		cooldown: 120,
	},

	FOOT_GRAZE: {
		id: 7553,
		name: 'Foot Graze',
		icon: 'https://xivapi.com/i/000000/000842.png',
		cooldown: 30,
	},

	LEG_GRAZE: {
		id: 7554,
		name: 'Leg Graze',
		icon: 'https://xivapi.com/i/000000/000843.png',
		cooldown: 30,
	},

	PELOTON: {
		id: 7557,
		name: 'Peloton',
		icon: 'https://xivapi.com/i/000000/000844.png',
		cooldown: 5,
	},

	INVIGORATE: {
		id: 7544,
		name: 'Invigorate',
		icon: 'https://xivapi.com/i/000000/000825.png',
		cooldown: 120,
	},

	TACTICIAN: {
		id: 7555,
		name: 'Tactician',
		icon: 'https://xivapi.com/i/000000/000846.png',
		cooldown: 180,
		duration: 15,
	},

	REFRESH: {
		id: 7556,
		name: 'Refresh',
		icon: 'https://xivapi.com/i/000000/000847.png',
		cooldown: 180,
	},

	HEAD_GRAZE: {
		id: 7551,
		name: 'Head Graze',
		icon: 'https://xivapi.com/i/000000/000848.png',
		cooldown: 30,
	},

	ARM_GRAZE: {
		id: 7552,
		name: 'Arm Graze',
		icon: 'https://xivapi.com/i/000000/000849.png',
		cooldown: 25,
	},

	PALISADE: {
		id: 7550,
		name: 'Palisade',
		icon: 'https://xivapi.com/i/000000/000850.png',
		cooldown: 150,
		duration: 15,
	},

	// Magical Ranged DPS
	ADDLE: {
		id: 7560,
		name: 'Addle',
		icon: 'https://xivapi.com/i/000000/000861.png',
		cooldown: 90,
		duration: 10,
	},

	DRAIN: {
		id: 7564,
		name: 'Drain',
		icon: 'https://xivapi.com/i/000000/000863.png',
		onGcd: true,
		castTime: 2.5,
	},

	DIVERSION: {
		id: 7545,
		name: 'Diversion',
		icon: 'https://xivapi.com/i/000000/000827.png',
		cooldown: 120,
	},

	MANA_SHIFT: {
		id: 7565,
		name: 'Mana Shift',
		icon: 'https://xivapi.com/i/000000/000867.png',
		cooldown: 120,
	},

	APOCATASTASIS: {
		id: 7563,
		name: 'Apocatastasis',
		icon: 'https://xivapi.com/i/000000/000868.png',
		cooldown: 90,
	},

	ERASE: {
		id: 7566,
		name: 'Erase',
		icon: 'https://xivapi.com/i/000000/000870.png',
		cooldown: 90,
	},

	// Melee DPS
	ARMS_LENGTH: {
		id: 7548,
		name: 'Arm&apos;s Length',
		icon: 'https://xivapi.com/i/000000/000822.png',
		cooldown: 90,
	},

	LEG_SWEEP: {
		id: 7863,
		name: 'Leg Sweep',
		icon: 'https://xivapi.com/i/000000/000824.png',
		cooldown: 40,
	},

	BLOODBATH: {
		id: 7542,
		name: 'Bloodbath',
		icon: 'https://xivapi.com/i/000000/000823.png',
		cooldown: 90,
	},

	GOAD: {
		id: 7543,
		name: 'Goad',
		icon: 'https://xivapi.com/i/000000/000826.png',
		cooldown: 180,
	},

	FEINT: {
		id: 7549,
		name: 'Feint',
		icon: 'https://xivapi.com/i/000000/000828.png',
		cooldown: 120,
		duration: 10,
	},

	CRUTCH: {
		id: 7547,
		name: 'Crutch',
		icon: 'https://xivapi.com/i/000000/000829.png',
		cooldown: 90,
	},

	TRUE_NORTH: {
		id: 7546,
		name: 'True North',
		icon: 'https://xivapi.com/i/000000/000830.png',
		cooldown: 90,
		duration: 10,
	},
}
