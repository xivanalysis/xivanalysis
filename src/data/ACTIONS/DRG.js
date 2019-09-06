import STATUSES from 'data/STATUSES'

export default {
	// -----
	// Player GCDs
	// -----
	DOOM_SPIKE: {
		id: 86,
		name: 'Doom Spike',
		icon: 'https://xivapi.com/i/000000/000306.png',
		onGcd: true,
		potency: 170,
		combo: {
			start: true,
		},
	},

	FANG_AND_CLAW: {
		id: 3554,
		name: 'Fang and Claw',
		icon: 'https://xivapi.com/i/002000/002582.png',
		onGcd: true,
		potency: 360,
	},

	WHEELING_THRUST: {
		id: 3556,
		name: 'Wheeling Thrust',
		icon: 'https://xivapi.com/i/002000/002584.png',
		onGcd: true,
		potency: 360,
	},

	RAIDEN_THRUST: {
		id: 16479,
		name: 'Raiden Thrust',
		icon: 'https://xivapi.com/i/002000/002592.png',
		onGcd: true,
		potency: 330,
		combo: {
			start: true,
		},
	},

	SONIC_THRUST: {
		id: 7397,
		name: 'Sonic Thrust',
		icon: 'https://xivapi.com/i/002000/002586.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 86,
			potency: 200,
		},
	},

	COERTHAN_TORMENT: {
		id: 16477,
		name: 'Coerthan Torment',
		icon: 'https://xivapi.com/i/002000/002590.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 7397,
			potency: 230,
			end: true,
		},
	},

	// -----
	// Player OGCDs
	// -----
	JUMP: {
		id: 92,
		name: 'Jump',
		icon: 'https://xivapi.com/i/002000/002576.png',
		cooldown: 30,
	},

	HIGH_JUMP: {
		id: 16478,
		name: 'High Jump',
		icon: 'https://xivapi.com/i/002000/002591.png',
		cooldown: 30,
	},

	ELUSIVE_JUMP: {
		id: 94,
		name: 'Elusive Jump',
		icon: 'https://xivapi.com/i/002000/002577.png',
		cooldown: 30,
	},

	SPINESHATTER_DIVE: {
		id: 95,
		name: 'Spineshatter Dive',
		icon: 'https://xivapi.com/i/002000/002580.png',
		cooldown: 60,
	},

	DRAGONFIRE_DIVE: {
		id: 96,
		name: 'Dragonfire Dive',
		icon: 'https://xivapi.com/i/002000/002578.png',
		cooldown: 120,

	},

	BATTLE_LITANY: {
		id: 3557,
		name: 'Battle Litany',
		icon: 'https://xivapi.com/i/002000/002585.png',
		cooldown: 180,
		statusesApplied: [STATUSES.BATTLE_LITANY],
	},

	BLOOD_OF_THE_DRAGON: {
		id: 3553,
		name: 'Blood Of The Dragon',
		icon: 'https://xivapi.com/i/002000/002581.png',
		cooldown: 30,
	},

	GEIRSKOGUL: {
		id: 3555,
		name: 'Geirskogul',
		icon: 'https://xivapi.com/i/002000/002583.png',
		cooldown: 30,
	},

	DRAGON_SIGHT: {
		id: 7398,
		name: 'Dragon Sight',
		icon: 'https://xivapi.com/i/002000/002587.png',
		cooldown: 120,
		statusesApplied: [STATUSES.RIGHT_EYE, STATUSES.LEFT_EYE, STATUSES.RIGHT_EYE_SOLO],
	},

	MIRAGE_DIVE: {
		id: 7399,
		name: 'Mirage Dive',
		icon: 'https://xivapi.com/i/002000/002588.png',
		cooldown: 1,
		potency: 250,
	},

	NASTROND: {
		id: 7400,
		name: 'Nastrond',
		icon: 'https://xivapi.com/i/002000/002589.png',
		cooldown: 10,
	},

	STARDIVER: {
		id: 16480,
		name: 'Stardiver',
		icon: 'https://xivapi.com/i/002000/002593.png',
		cooldown: 30,
	},
}
