import {Attribute} from 'event'
import {ensureActions} from '../type'

export const NIN = ensureActions({
	// -----
	// Player GCDs
	// -----

	SPINNING_EDGE: {
		id: 2240,
		name: 'Spinning Edge',
		icon: 'https://xivapi.com/i/000000/000601.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potency: 230,
		combo: {
			start: true,
		},
	},

	GUST_SLASH: {
		id: 2242,
		name: 'Gust Slash',
		icon: 'https://xivapi.com/i/000000/000602.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potency: 100,
		combo: {
			from: 2240,
			potency: 340,
		},
	},

	AEOLIAN_EDGE: {
		id: 2255,
		name: 'Aeolian Edge',
		icon: 'https://xivapi.com/i/000000/000605.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potency: 100,
		combo: {
			from: 2242,
			potency: 480, // TODO - *Cries in positionals*
			end: true,
		},
	},

	SHADOW_FANG: {
		id: 2257,
		name: 'Shadow Fang',
		icon: 'https://xivapi.com/i/000000/000606.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potency: 200,
		cooldown: 70000,
		gcdRecast: 2500,
		statusesApplied: ['SHADOW_FANG'],
	},

	DEATH_BLOSSOM: {
		id: 2254,
		name: 'Death Blossom',
		icon: 'https://xivapi.com/i/000000/000615.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potency: 120,
		combo: {
			start: true,
		},
	},

	THROWING_DAGGER: {
		id: 2247,
		name: 'Throwing Dagger',
		icon: 'https://xivapi.com/i/000000/000614.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potency: 120,
		breaksCombo: true,
	},

	ARMOR_CRUSH: {
		id: 3563,
		name: 'Armor Crush',
		icon: 'https://xivapi.com/i/002000/002915.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
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
		speedAttribute: Attribute.SKILL_SPEED,
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
		cooldown: 20000,
		gcdRecast: 500,
		charges: 2,
		cooldownGroup: 9,
	},

	TEN_KASSATSU: {
		id: 18805,
		name: 'Ten',
		icon: 'https://xivapi.com/i/002000/002901.png',
		onGcd: true,
		cooldown: 500,
	},

	CHI: {
		id: 2261,
		name: 'Chi',
		icon: 'https://xivapi.com/i/002000/002902.png',
		onGcd: true,
		cooldown: 20000,
		gcdRecast: 500,
		charges: 2,
		cooldownGroup: 9,
	},

	CHI_KASSATSU: {
		id: 18806,
		name: 'Chi',
		icon: 'https://xivapi.com/i/002000/002902.png',
		onGcd: true,
		cooldown: 500,
	},

	JIN: {
		id: 2263,
		name: 'Jin',
		icon: 'https://xivapi.com/i/002000/002903.png',
		onGcd: true,
		cooldown: 20000,
		gcdRecast: 500,
		charges: 2,
		cooldownGroup: 9,
	},

	JIN_KASSATSU: {
		id: 18807,
		name: 'Jin',
		icon: 'https://xivapi.com/i/002000/002903.png',
		onGcd: true,
		cooldown: 500,
	},

	NINJUTSU: {
		id: 2260,
		name: 'Ninjutsu',
		icon: 'https://xivapi.com/i/002000/002904.png',
		onGcd: true,
		cooldown: 1500,
	},

	FUMA_SHURIKEN: {
		id: 2265,
		name: 'Fuma Shuriken',
		icon: 'https://xivapi.com/i/002000/002907.png',
		onGcd: true,
		cooldown: 1500,
	},

	// I swear to shit, SE
	FUMA_SHURIKEN_TCJ_TEN: {
		id: 18873,
		name: 'Fuma Shuriken',
		icon: 'https://xivapi.com/i/002000/002907.png',
		onGcd: true,
		cooldown: 1000,
	},

	FUMA_SHURIKEN_TCJ_CHI: {
		id: 18874,
		name: 'Fuma Shuriken',
		icon: 'https://xivapi.com/i/002000/002907.png',
		onGcd: true,
		cooldown: 1000,
	},

	FUMA_SHURIKEN_TCJ_JIN: {
		id: 18875,
		name: 'Fuma Shuriken',
		icon: 'https://xivapi.com/i/002000/002907.png',
		onGcd: true,
		cooldown: 1000,
	},

	KATON: {
		id: 2266,
		name: 'Katon',
		icon: 'https://xivapi.com/i/002000/002908.png',
		onGcd: true,
		cooldown: 1500,
	},

	KATON_TCJ: {
		id: 18876,
		name: 'Katon',
		icon: 'https://xivapi.com/i/002000/002908.png',
		onGcd: true,
		cooldown: 1000,
	},

	GOKA_MEKKYAKU: {
		id: 16491,
		name: 'Goka Mekkyaku',
		icon: 'https://xivapi.com/i/002000/002925.png',
		onGcd: true,
		cooldown: 1500,
	},

	RAITON: {
		id: 2267,
		name: 'Raiton',
		icon: 'https://xivapi.com/i/002000/002912.png',
		onGcd: true,
		cooldown: 1500,
	},

	RAITON_TCJ: {
		id: 18877,
		name: 'Raiton',
		icon: 'https://xivapi.com/i/002000/002912.png',
		onGcd: true,
		cooldown: 1000,
	},

	HYOTON: {
		id: 2268,
		name: 'Hyoton',
		icon: 'https://xivapi.com/i/002000/002909.png',
		onGcd: true,
		cooldown: 1500,
	},

	HYOTON_TCJ: {
		id: 18878,
		name: 'Hyoton',
		icon: 'https://xivapi.com/i/002000/002909.png',
		onGcd: true,
		cooldown: 1000,
	},

	HYOSHO_RANRYU: {
		id: 16492,
		name: 'Hyosho Ranryu',
		icon: 'https://xivapi.com/i/002000/002926.png',
		onGcd: true,
		cooldown: 1500,
	},

	HUTON: {
		id: 2269,
		name: 'Huton',
		icon: 'https://xivapi.com/i/002000/002910.png',
		onGcd: true,
		cooldown: 1500,
	},

	HUTON_TCJ: {
		id: 18879,
		name: 'Huton',
		icon: 'https://xivapi.com/i/002000/002910.png',
		onGcd: true,
		cooldown: 1500,
	},

	DOTON: {
		id: 2270,
		name: 'Doton',
		icon: 'https://xivapi.com/i/002000/002911.png',
		onGcd: true,
		cooldown: 1500,
		statusesApplied: ['DOTON'],
	},

	DOTON_TCJ: {
		id: 18880,
		name: 'Doton',
		icon: 'https://xivapi.com/i/002000/002911.png',
		onGcd: true,
		cooldown: 1500,
		statusesApplied: ['DOTON'],
	},

	SUITON: {
		id: 2271,
		name: 'Suiton',
		icon: 'https://xivapi.com/i/002000/002913.png',
		onGcd: true,
		cooldown: 1500,
		statusesApplied: ['SUITON'],
	},

	SUITON_TCJ: {
		id: 18881,
		name: 'Suiton',
		icon: 'https://xivapi.com/i/002000/002913.png',
		onGcd: true,
		cooldown: 1500,
		statusesApplied: ['SUITON'],
	},

	RABBIT_MEDIUM: {
		id: 2272,
		name: 'Rabbit Medium',
		icon: 'https://xivapi.com/i/002000/002914.png',
		onGcd: true,
		cooldown: 1500,
	},

	// -----
	// Player OGCDs
	// -----

	MUG: {
		id: 2248,
		name: 'Mug',
		icon: 'https://xivapi.com/i/000000/000613.png',
		onGcd: false,
		cooldown: 120000,
	},

	ASSASSINATE: {
		id: 2246,
		name: 'Assassinate',
		icon: 'https://xivapi.com/i/000000/000612.png',
		onGcd: false,
		cooldown: 60000,
	},

	TRICK_ATTACK: {
		id: 2258,
		name: 'Trick Attack',
		icon: 'https://xivapi.com/i/000000/000618.png',
		onGcd: false,
		cooldown: 60000,
		statusesApplied: ['TRICK_ATTACK_VULNERABILITY_UP'],
	},

	SHADE_SHIFT: {
		id: 2241,
		name: 'Shade Shift',
		icon: 'https://xivapi.com/i/000000/000607.png',
		onGcd: false,
		cooldown: 120000,
		statusesApplied: ['SHADE_SHIFT'],
	},

	KASSATSU: {
		id: 2264,
		name: 'Kassatsu',
		icon: 'https://xivapi.com/i/002000/002906.png',
		onGcd: false,
		cooldown: 60000,
		statusesApplied: ['KASSATSU'],
	},

	DREAM_WITHIN_A_DREAM: {
		id: 3566,
		name: 'Dream Within A Dream',
		icon: 'https://xivapi.com/i/002000/002918.png',
		onGcd: false,
		cooldown: 60000,
		statusesApplied: ['ASSASSINATE_READY'],
	},

	HELLFROG_MEDIUM: {
		id: 7401,
		name: 'Hellfrog Medium',
		icon: 'https://xivapi.com/i/002000/002920.png',
		onGcd: false,
		cooldown: 1000,
	},

	BHAVACAKRA: {
		id: 7402,
		name: 'Bhavacakra',
		icon: 'https://xivapi.com/i/002000/002921.png',
		onGcd: false,
		cooldown: 1000,
	},

	TEN_CHI_JIN: {
		id: 7403,
		name: 'Ten Chi Jin',
		icon: 'https://xivapi.com/i/002000/002922.png',
		onGcd: false,
		cooldown: 120000,
		statusesApplied: ['TEN_CHI_JIN'],
	},

	SHUKUCHI: {
		id: 2262,
		name: 'Shukuchi',
		icon: 'https://xivapi.com/i/002000/002905.png',
		onGcd: false,
		cooldown: 60000,
		charges: 2,
	},

	MEISUI: {
		id: 16489,
		name: 'Meisui',
		icon: 'https://xivapi.com/i/002000/002924.png',
		onGcd: false,
		cooldown: 120000,
	},

	BUNSHIN: {
		id: 16493,
		name: 'Bunshin',
		icon: 'https://xivapi.com/i/002000/002927.png',
		onGcd: false,
		cooldown: 90000,
		statusesApplied: ['BUNSHIN'],
	},
})
