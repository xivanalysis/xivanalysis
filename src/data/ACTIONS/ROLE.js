import STATUSES from 'data/STATUSES'

// Putting all role actions in one file 'cus a lot of them are shared between multiple roles
export default {
	// Tank Actions
	RAMPART: {
		id: 7531,
		name: 'Rampart',
		icon: 'https://xivapi.com/i/000000/000801.png',
		cooldown: 90,
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

	REPRISAL: {
		id: 7535,
		name: 'Reprisal',
		icon: 'https://xivapi.com/i/000000/000806.png',
		cooldown: 60,
	},

	INTERJECT: {
		id: 7538,
		name: 'Interject',
		icon: 'https://xivapi.com/i/000000/000808.png',
		cooldown: 30,
	},

	SHIRK: {
		id: 7537,
		name: 'Shirk',
		icon: 'https://xivapi.com/i/000000/000810.png',
		cooldown: 120,
	},

	// Healer Actions
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
		statusesApplied: [STATUSES.LUCID_DREAMING],
	},

	SWIFTCAST: {
		id: 7561,
		name: 'Swiftcast',
		icon: 'https://xivapi.com/i/000000/000866.png',
		cooldown: 60,
		statusesApplied: [STATUSES.SWIFTCAST],
	},

	SURECAST: {
		id: 7559,
		name: 'Surecast',
		icon: 'https://xivapi.com/i/000000/000869.png',
		cooldown: 120,
		statusesApplied: [STATUSES.SURECAST],
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

	HEAD_GRAZE: {
		id: 7551,
		name: 'Head Graze',
		icon: 'https://xivapi.com/i/000000/000848.png',
		cooldown: 30,
	},

	// Magical Ranged DPS
	ADDLE: {
		id: 7560,
		name: 'Addle',
		icon: 'https://xivapi.com/i/000000/000861.png',
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

	FEINT: {
		id: 7549,
		name: 'Feint',
		icon: 'https://xivapi.com/i/000000/000828.png',
		cooldown: 120,
	},

	TRUE_NORTH: {
		id: 7546,
		name: 'True North',
		icon: 'https://xivapi.com/i/000000/000830.png',
		cooldown: 90,
	},
}
