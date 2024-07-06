import {iconUrl} from 'data/icon'
import {Attribute} from 'event'
import {ensureActions, BonusModifier} from '../type'

export const NIN = ensureActions({
	// -----
	// Player GCDs
	// -----

	SPINNING_EDGE: {
		id: 2240,
		name: 'Spinning Edge',
		icon: iconUrl(601),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	GUST_SLASH: {
		id: 2242,
		name: 'Gust Slash',
		icon: iconUrl(602),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 2240,
		},
	},

	AEOLIAN_EDGE: {
		id: 2255,
		name: 'Aeolian Edge',
		icon: iconUrl(605),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potency: 200,
		combo: {
			from: 2242,
			end: true,
		},
		potencies: [{
			value: 200,
			bonusModifiers: [],
		}, {
			value: 260,
			bonusModifiers: [BonusModifier.POSITIONAL],
		}, {
			value: 380,
			bonusModifiers: [BonusModifier.COMBO],
		}, {
			value: 440,
			bonusModifiers: [BonusModifier.POSITIONAL, BonusModifier.COMBO],
		}],
	},

	DEATH_BLOSSOM: {
		id: 2254,
		name: 'Death Blossom',
		icon: iconUrl(615),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	THROWING_DAGGER: {
		id: 2247,
		name: 'Throwing Dagger',
		icon: iconUrl(614),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	ARMOR_CRUSH: {
		id: 3563,
		name: 'Armor Crush',
		icon: iconUrl(2915),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potency: 220,
		combo: {
			from: 2242,
			end: true,
		},
		potencies: [{
			value: 220,
			bonusModifiers: [],
		}, {
			value: 280,
			bonusModifiers: [BonusModifier.POSITIONAL],
		}, {
			value: 420,
			bonusModifiers: [BonusModifier.COMBO],
		}, {
			value: 480,
			bonusModifiers: [BonusModifier.POSITIONAL, BonusModifier.COMBO],
		}],
	},

	HAKKE_MUJINSATSU: {
		id: 16488,
		name: 'Hakke Mujinsatsu',
		icon: iconUrl(2923),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 2254,
			end: true,
		},
	},

	FORKED_RAIJU: {
		id: 25777,
		name: 'Forked Raiju',
		icon: iconUrl(2931),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	FLEETING_RAIJU: {
		id: 25778,
		name: 'Fleeting Raiju',
		icon: iconUrl(2932),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	PHANTOM_KAMAITACHI: {
		id: 25774,
		name: 'Phantom Kamaitachi',
		icon: iconUrl(2929),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	PHANTOM_KAMAITACHI_BUNSHIN: {
		id: 25775,
		name: 'Phantom Kamaitachi',
		icon: iconUrl(2929),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	TEN: {
		id: 2259,
		name: 'Ten',
		icon: iconUrl(2901),
		onGcd: true,
		cooldown: 20000,
		gcdRecast: 500,
		charges: 2,
		cooldownGroup: 9,
	},

	TEN_KASSATSU: {
		id: 18805,
		name: 'Ten',
		icon: iconUrl(2901),
		onGcd: true,
		cooldown: 500,
	},

	CHI: {
		id: 2261,
		name: 'Chi',
		icon: iconUrl(2902),
		onGcd: true,
		cooldown: 20000,
		gcdRecast: 500,
		charges: 2,
		cooldownGroup: 9,
	},

	CHI_KASSATSU: {
		id: 18806,
		name: 'Chi',
		icon: iconUrl(2902),
		onGcd: true,
		cooldown: 500,
	},

	JIN: {
		id: 2263,
		name: 'Jin',
		icon: iconUrl(2903),
		onGcd: true,
		cooldown: 20000,
		gcdRecast: 500,
		charges: 2,
		cooldownGroup: 9,
	},

	JIN_KASSATSU: {
		id: 18807,
		name: 'Jin',
		icon: iconUrl(2903),
		onGcd: true,
		cooldown: 500,
	},

	NINJUTSU: {
		id: 2260,
		name: 'Ninjutsu',
		icon: iconUrl(2904),
		onGcd: true,
		cooldown: 1500,
	},

	FUMA_SHURIKEN: {
		id: 2265,
		name: 'Fuma Shuriken',
		icon: iconUrl(2907),
		onGcd: true,
		cooldown: 1500,
	},

	// I swear to shit, SE
	FUMA_SHURIKEN_TCJ_TEN: {
		id: 18873,
		name: 'Fuma Shuriken',
		icon: iconUrl(2907),
		onGcd: true,
		cooldown: 1000,
	},

	FUMA_SHURIKEN_TCJ_CHI: {
		id: 18874,
		name: 'Fuma Shuriken',
		icon: iconUrl(2907),
		onGcd: true,
		cooldown: 1000,
	},

	FUMA_SHURIKEN_TCJ_JIN: {
		id: 18875,
		name: 'Fuma Shuriken',
		icon: iconUrl(2907),
		onGcd: true,
		cooldown: 1000,
	},

	KATON: {
		id: 2266,
		name: 'Katon',
		icon: iconUrl(2908),
		onGcd: true,
		cooldown: 1500,
	},

	KATON_TCJ: {
		id: 18876,
		name: 'Katon',
		icon: iconUrl(2908),
		onGcd: true,
		cooldown: 1000,
	},

	GOKA_MEKKYAKU: {
		id: 16491,
		name: 'Goka Mekkyaku',
		icon: iconUrl(2925),
		onGcd: true,
		cooldown: 1500,
	},

	RAITON: {
		id: 2267,
		name: 'Raiton',
		icon: iconUrl(2912),
		onGcd: true,
		cooldown: 1500,
		statusesApplied: ['RAIJU_READY'],
	},

	RAITON_TCJ: {
		id: 18877,
		name: 'Raiton',
		icon: iconUrl(2912),
		onGcd: true,
		cooldown: 1000,
	},

	HYOTON: {
		id: 2268,
		name: 'Hyoton',
		icon: iconUrl(2909),
		onGcd: true,
		cooldown: 1500,
	},

	HYOTON_TCJ: {
		id: 18878,
		name: 'Hyoton',
		icon: iconUrl(2909),
		onGcd: true,
		cooldown: 1000,
	},

	HYOSHO_RANRYU: {
		id: 16492,
		name: 'Hyosho Ranryu',
		icon: iconUrl(2926),
		onGcd: true,
		cooldown: 1500,
	},

	HUTON: {
		id: 2269,
		name: 'Huton',
		icon: iconUrl(2910),
		onGcd: true,
		cooldown: 1500,
		statusesApplied: ['SHADOW_WALKER'],
	},

	HUTON_TCJ: {
		id: 18879,
		name: 'Huton',
		icon: iconUrl(2910),
		onGcd: true,
		cooldown: 1500,
		statusesApplied: ['SHADOW_WALKER'],
	},

	DOTON: {
		id: 2270,
		name: 'Doton',
		icon: iconUrl(2911),
		onGcd: true,
		cooldown: 1500,
		statusesApplied: ['DOTON'],
	},

	DOTON_TCJ: {
		id: 18880,
		name: 'Doton',
		icon: iconUrl(2911),
		onGcd: true,
		cooldown: 1500,
		statusesApplied: ['DOTON'],
	},

	SUITON: {
		id: 2271,
		name: 'Suiton',
		icon: iconUrl(2913),
		onGcd: true,
		cooldown: 1500,
		statusesApplied: ['SHADOW_WALKER'],
	},

	SUITON_TCJ: {
		id: 18881,
		name: 'Suiton',
		icon: iconUrl(2913),
		onGcd: true,
		cooldown: 1500,
		statusesApplied: ['SHADOW_WALKER'],
	},

	RABBIT_MEDIUM: {
		id: 2272,
		name: 'Rabbit Medium',
		icon: iconUrl(2914),
		onGcd: true,
		cooldown: 1500,
	},

	// -----
	// Player OGCDs
	// -----

	MUG: {
		id: 2248,
		name: 'Mug',
		icon: iconUrl(613),
		onGcd: false,
		cooldown: 120000,
		statusesApplied: ['MUG'],
	},

	ASSASSINATE: {
		id: 2246,
		name: 'Assassinate',
		icon: iconUrl(612),
		onGcd: false,
		cooldown: 60000,
	},

	TRICK_ATTACK: {
		id: 2258,
		name: 'Trick Attack',
		icon: iconUrl(618),
		onGcd: false,
		cooldown: 60000,
		statusesApplied: ['TRICK_ATTACK'],
		potencies: [{
			value: 300,
			bonusModifiers: [],
		}, {
			value: 400,
			bonusModifiers: [BonusModifier.POSITIONAL],
		}],
	},

	SHADE_SHIFT: {
		id: 2241,
		name: 'Shade Shift',
		icon: iconUrl(607),
		onGcd: false,
		cooldown: 120000,
		statusesApplied: ['SHADE_SHIFT'],
	},

	KASSATSU: {
		id: 2264,
		name: 'Kassatsu',
		icon: iconUrl(2906),
		onGcd: false,
		cooldown: 60000,
		statusesApplied: ['KASSATSU'],
	},

	DREAM_WITHIN_A_DREAM: {
		id: 3566,
		name: 'Dream Within A Dream',
		icon: iconUrl(2918),
		onGcd: false,
		cooldown: 60000,
	},

	HELLFROG_MEDIUM: {
		id: 7401,
		name: 'Hellfrog Medium',
		icon: iconUrl(2920),
		onGcd: false,
		cooldown: 1000,
	},

	DOKUMORI: {
		id: 36957,
		name: 'Dokumori',
		icon: iconUrl(619),
		onGcd: false,
		cooldown: 120000,
		statusesApplied: ['DOKUMORI', 'HIGI'],
	},

	BHAVACAKRA: {
		id: 7402,
		name: 'Bhavacakra',
		icon: iconUrl(2921),
		onGcd: false,
		cooldown: 1000,
	},

	TEN_CHI_JIN: {
		id: 7403,
		name: 'Ten Chi Jin',
		icon: iconUrl(2922),
		onGcd: false,
		cooldown: 120000,
		statusesApplied: ['TEN_CHI_JIN', 'TENRI_JINDO_READY'],
	},

	SHUKUCHI: {
		id: 2262,
		name: 'Shukuchi',
		icon: iconUrl(2905),
		onGcd: false,
		cooldown: 60000,
		charges: 2,
	},

	MEISUI: {
		id: 16489,
		name: 'Meisui',
		icon: iconUrl(2924),
		onGcd: false,
		cooldown: 120000,
		statusesApplied: ['MEISUI'],
	},

	BUNSHIN: {
		id: 16493,
		name: 'Bunshin',
		icon: iconUrl(2927),
		onGcd: false,
		cooldown: 90000,
		statusesApplied: ['BUNSHIN'],
	},

	KUNAIS_BANE: {
		id: 36958,
		name: 'Kunai\'s Bane',
		icon: iconUrl(620),
		onGcd: false,
		cooldown: 60000,
		statusesApplied: ['KUNAIS_BANE'],
	},

	DEATHFROG_MEDIUM: {
		id: 36959,
		name: 'Deathfrog Medium',
		icon: iconUrl(2934),
		onGcd: false,
		cooldown: 1000,
	},

	ZESHO_MEPPO: {
		id: 36960,
		name: 'Zesho Meppo',
		icon: iconUrl(2933),
		onGcd: false,
		cooldown: 1000,
	},

	TENRI_JINDO: {
		id: 36961,
		name: 'Tenri Jindo',
		icon: iconUrl(2935),
		onGcd: false,
		cooldown: 1000,
	},
})
