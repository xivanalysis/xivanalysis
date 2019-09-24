import STATUSES from 'data/STATUSES'

export default {
	// -----
	// Player GCDs
	// -----

	ARMOR_CRUSH: {
		id: 3563,
		name: 'Armor Crush',
		icon: 'https://xivapi.com/i/002000/002915.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 2242,
			potency: 440,
			end: true,
		},
	},

	HAKKE_MUJINSATSU: {
		id: 16488,
		name: 'Hakke Mujinsatsu',
		icon: 'https://xivapi.com/i/002000/002923.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 2254,
			potency: 140,
			end: true,
		},
	},

	// -----
	// Player OGCDs
	// -----

	TEN: {
		id: 2259,
		name: 'Ten',
		icon: 'https://xivapi.com/i/002000/002901.png',
		onGcd: false,
		cooldown: 0.5,
	},

	CHI: {
		id: 2261,
		name: 'Chi',
		icon: 'https://xivapi.com/i/002000/002902.png',
		onGcd: false,
		cooldown: 0.5,
	},

	JIN: {
		id: 2263,
		name: 'Jin',
		icon: 'https://xivapi.com/i/002000/002903.png',
		onGcd: false,
		cooldown: 0.5,
	},

	NINJUTSU: {
		id: 2260,
		name: 'Ninjutsu',
		icon: 'https://xivapi.com/i/002000/002904.png',
		onGcd: false,
		cooldown: 20,
	},

	FUMA_SHURIKEN: {
		id: 2265,
		name: 'Fuma Shuriken',
		icon: 'https://xivapi.com/i/002000/002907.png',
		onGcd: false,
		cooldown: 20,
	},

	KATON: {
		id: 2266,
		name: 'Katon',
		icon: 'https://xivapi.com/i/002000/002908.png',
		onGcd: false,
		cooldown: 20,
	},

	GOKA_MEKKYAKU: {
		id: 16491,
		name: 'Goka Mekkyaku',
		icon: 'https://xivapi.com/i/002000/002925.png',
		onGcd: false,
		cooldown: 20,
	},

	RAITON: {
		id: 2267,
		name: 'Raiton',
		icon: 'https://xivapi.com/i/002000/002912.png',
		onGcd: false,
		cooldown: 20,
	},

	HYOTON: {
		id: 2268,
		name: 'Hyoton',
		icon: 'https://xivapi.com/i/002000/002909.png',
		onGcd: false,
		cooldown: 20,
	},

	HYOSHO_RANRYU: {
		id: 16492,
		name: 'Hyosho Ranryu',
		icon: 'https://xivapi.com/i/002000/002926.png',
		onGcd: false,
		cooldown: 20,
	},

	HUTON: {
		id: 2269,
		name: 'Huton',
		icon: 'https://xivapi.com/i/002000/002910.png',
		onGcd: false,
		cooldown: 20,
	},

	DOTON: {
		id: 2270,
		name: 'Doton',
		icon: 'https://xivapi.com/i/002000/002911.png',
		onGcd: false,
		cooldown: 20,
	},

	SUITON: {
		id: 2271,
		name: 'Suiton',
		icon: 'https://xivapi.com/i/002000/002913.png',
		onGcd: false,
		cooldown: 20,
	},

	RABBIT_MEDIUM: {
		id: 2272,
		name: 'Rabbit Medium',
		icon: 'https://xivapi.com/i/002000/002914.png',
		onGcd: false,
		cooldown: 20,
	},

	KASSATSU: {
		id: 2264,
		name: 'Kassatsu',
		icon: 'https://xivapi.com/i/002000/002906.png',
		onGcd: false,
		cooldown: 60,
		statusesApplied: [STATUSES.KASSATSU],
	},

	DREAM_WITHIN_A_DREAM: {
		id: 3566,
		name: 'Dream Within A Dream',
		icon: 'https://xivapi.com/i/002000/002918.png',
		onGcd: false,
		cooldown: 60,
	},

	HELLFROG_MEDIUM: {
		id: 7401,
		name: 'Hellfrog Medium',
		icon: 'https://xivapi.com/i/002000/002920.png',
		onGcd: false,
		cooldown: 1,
	},

	BHAVACAKRA: {
		id: 7402,
		name: 'Bhavacakra',
		icon: 'https://xivapi.com/i/002000/002921.png',
		onGcd: false,
		cooldown: 1,
	},

	TEN_CHI_JIN: {
		id: 7403,
		name: 'Ten Chi Jin',
		icon: 'https://xivapi.com/i/002000/002922.png',
		onGcd: false,
		cooldown: 100,
		statusesApplied: [STATUSES.TEN_CHI_JIN],
	},

	SHUKUCHI: {
		id: 2262,
		name: 'Shukuchi',
		icon: 'https://xivapi.com/i/002000/002905.png',
		onGcd: false,
		cooldown: 60,
	},

	MEISUI: {
		id: 16489,
		name: 'Meisui',
		icon: 'https://xivapi.com/i/002000/002924.png',
		onGcd: false,
		cooldown: 60,
	},

	BUNSHIN: {
		id: 16493,
		name: 'Bunshin',
		icon: 'https://xivapi.com/i/002000/002927.png',
		onGcd: false,
		cooldown: 110,
	},
}
