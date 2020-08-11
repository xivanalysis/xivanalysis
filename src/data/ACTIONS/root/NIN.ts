import {ensureActions} from '../type'

export const NIN = ensureActions({
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
			potency: 460,
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

	TEN: {
		id: 2259,
		name: 'Ten',
		icon: 'https://xivapi.com/i/002000/002901.png',
		onGcd: true,
		cooldown: 20,
		gcdRecast: 0.5,
		charges: 2,
	},

	TEN_NEW: {
		id: 18805,
		name: 'Ten',
		icon: 'https://xivapi.com/i/002000/002901.png',
		onGcd: true,
		cooldown: 20,
		gcdRecast: 0.5,
	},

	CHI: {
		id: 2261,
		name: 'Chi',
		icon: 'https://xivapi.com/i/002000/002902.png',
		onGcd: true,
		cooldown: 20,
		gcdRecast: 0.5,
		charges: 2,
	},

	CHI_NEW: {
		id: 18806,
		name: 'Chi',
		icon: 'https://xivapi.com/i/002000/002902.png',
		onGcd: true,
		cooldown: 20,
		gcdRecast: 0.5,
		charges: 2,
	},

	JIN: {
		id: 2263,
		name: 'Jin',
		icon: 'https://xivapi.com/i/002000/002903.png',
		onGcd: true,
		cooldown: 20,
		gcdRecast: 0.5,
		charges: 2,
	},

	JIN_NEW: {
		id: 18807,
		name: 'Jin',
		icon: 'https://xivapi.com/i/002000/002903.png',
		onGcd: true,
		cooldown: 20,
		gcdRecast: 0.5,
		charges: 2,
	},

	NINJUTSU: {
		id: 2260,
		name: 'Ninjutsu',
		icon: 'https://xivapi.com/i/002000/002904.png',
		onGcd: true,
		gcdRecast: 1.5,
	},

	FUMA_SHURIKEN: {
		id: 2265,
		name: 'Fuma Shuriken',
		icon: 'https://xivapi.com/i/002000/002907.png',
		onGcd: true,
		gcdRecast: 1.5,
	},

	// I swear to shit, SE
	FUMA_SHURIKEN_TCJ_TEN: {
		id: 18873,
		name: 'Fuma Shuriken',
		icon: 'https://xivapi.com/i/002000/002907.png',
		onGcd: true,
		gcdRecast: 1,
	},

	FUMA_SHURIKEN_TCJ_CHI: {
		id: 18874,
		name: 'Fuma Shuriken',
		icon: 'https://xivapi.com/i/002000/002907.png',
		onGcd: true,
		gcdRecast: 1,
	},

	FUMA_SHURIKEN_TCJ_JIN: {
		id: 18875,
		name: 'Fuma Shuriken',
		icon: 'https://xivapi.com/i/002000/002907.png',
		onGcd: true,
		gcdRecast: 1,
	},

	KATON: {
		id: 2266,
		name: 'Katon',
		icon: 'https://xivapi.com/i/002000/002908.png',
		onGcd: true,
		gcdRecast: 1.5,
	},

	KATON_TCJ: {
		id: 18876,
		name: 'Katon',
		icon: 'https://xivapi.com/i/002000/002908.png',
		onGcd: true,
		gcdRecast: 1,
	},

	GOKA_MEKKYAKU: {
		id: 16491,
		name: 'Goka Mekkyaku',
		icon: 'https://xivapi.com/i/002000/002925.png',
		onGcd: true,
		gcdRecast: 1.5,
	},

	RAITON: {
		id: 2267,
		name: 'Raiton',
		icon: 'https://xivapi.com/i/002000/002912.png',
		onGcd: true,
		gcdRecast: 1.5,
	},

	RAITON_TCJ: {
		id: 18877,
		name: 'Raiton',
		icon: 'https://xivapi.com/i/002000/002912.png',
		onGcd: true,
		gcdRecast: 1,
	},

	HYOTON: {
		id: 2268,
		name: 'Hyoton',
		icon: 'https://xivapi.com/i/002000/002909.png',
		onGcd: true,
		gcdRecast: 1.5,
	},

	HYOTON_TCJ: {
		id: 18878,
		name: 'Hyoton',
		icon: 'https://xivapi.com/i/002000/002909.png',
		onGcd: true,
		gcdRecast: 1,
	},

	HYOSHO_RANRYU: {
		id: 16492,
		name: 'Hyosho Ranryu',
		icon: 'https://xivapi.com/i/002000/002926.png',
		onGcd: true,
		gcdRecast: 1.5,
	},

	HUTON: {
		id: 2269,
		name: 'Huton',
		icon: 'https://xivapi.com/i/002000/002910.png',
		onGcd: true,
		gcdRecast: 1.5,
	},

	HUTON_TCJ: {
		id: 18879,
		name: 'Huton',
		icon: 'https://xivapi.com/i/002000/002910.png',
		onGcd: true,
		gcdRecast: 1.5,
	},

	DOTON: {
		id: 2270,
		name: 'Doton',
		icon: 'https://xivapi.com/i/002000/002911.png',
		onGcd: true,
		gcdRecast: 1.5,
		statusesApplied: ['DOTON'],
	},

	DOTON_TCJ: {
		id: 18880,
		name: 'Doton',
		icon: 'https://xivapi.com/i/002000/002911.png',
		onGcd: true,
		gcdRecast: 1.5,
		statusesApplied: ['DOTON'],
	},

	SUITON: {
		id: 2271,
		name: 'Suiton',
		icon: 'https://xivapi.com/i/002000/002913.png',
		onGcd: true,
		gcdRecast: 1.5,
		statusesApplied: ['SUITON'],
	},

	SUITON_TCJ: {
		id: 18881,
		name: 'Suiton',
		icon: 'https://xivapi.com/i/002000/002913.png',
		onGcd: true,
		gcdRecast: 1.5,
		statusesApplied: ['SUITON'],
	},

	RABBIT_MEDIUM: {
		id: 2272,
		name: 'Rabbit Medium',
		icon: 'https://xivapi.com/i/002000/002914.png',
		onGcd: true,
		gcdRecast: 1.5,
	},

	// -----
	// Player OGCDs
	// -----

	KASSATSU: {
		id: 2264,
		name: 'Kassatsu',
		icon: 'https://xivapi.com/i/002000/002906.png',
		onGcd: false,
		cooldown: 60,
		statusesApplied: ['KASSATSU'],
	},

	DREAM_WITHIN_A_DREAM: {
		id: 3566,
		name: 'Dream Within A Dream',
		icon: 'https://xivapi.com/i/002000/002918.png',
		onGcd: false,
		cooldown: 60,
		statusesApplied: ['ASSASSINATE_READY'],
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
		cooldown: 120,
		statusesApplied: ['TEN_CHI_JIN'],
	},

	SHUKUCHI: {
		id: 2262,
		name: 'Shukuchi',
		icon: 'https://xivapi.com/i/002000/002905.png',
		onGcd: false,
		cooldown: 60,
		charges: 2,
	},

	MEISUI: {
		id: 16489,
		name: 'Meisui',
		icon: 'https://xivapi.com/i/002000/002924.png',
		onGcd: false,
		cooldown: 120,
	},

	BUNSHIN: {
		id: 16493,
		name: 'Bunshin',
		icon: 'https://xivapi.com/i/002000/002927.png',
		onGcd: false,
		cooldown: 90,
		statusesApplied: ['BUNSHIN'],
	},
})
