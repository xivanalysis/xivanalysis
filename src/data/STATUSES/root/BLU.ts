import {iconUrl} from 'data/icon'
import {ensureStatuses} from '../type'

export const BLU = ensureStatuses({
	PETRIFICATION: {
		id: 1,
		name: 'Petrification',
		icon: iconUrl(215001),
		duration: 20000,
	},
	STUN: {
		id: 2,
		name: 'Stun',
		icon: iconUrl(215004),
		duration: 3000, // duration: 6000 if applied by Faze, duration: 4000 if applied by Sticky Tongue, duration: 1000 if applied by Perpetual Ray
	},
	SLEEP: {
		id: 3,
		name: 'Sleep',
		icon: iconUrl(215013),
		duration: 30000, // duration: 40000 if applied by Chirp
	},
	SLOW: {
		id: 9,
		name: 'Slow',
		icon: iconUrl(215009),
		duration: 15000, // duration: 20000 if applied by White Knight's Tour
	},
	BIND: {
		id: 13,
		name: 'Bind',
		icon: iconUrl(215003),
		duration: 20000,
	},
	HEAVY: {
		id: 14,
		name: 'Heavy',
		icon: iconUrl(215002),
		duration: 15000, // duration: 30000 if applied by 4-tonze Weight, duration: 10000 if applied by Reflux
	},
	BLIND: {
		id: 15,
		name: 'Blind',
		icon: iconUrl(215012),
		duration: 15000, // duration: 30000 if applied by Ink Jet
	},
	PARALYSIS: {
		id: 17,
		name: 'Paralysis',
		icon: iconUrl(215006),
		duration: 15000, // duration: 6000 if applied by Glower, duration: 9000 if applied by The Dragon's Voice, duration 30000 if applied by Mind Blast or Abyssal Transfixion
	},
	AQUA_BREATH: {
		id: 1736,
		name: 'Dropsy',
		icon: iconUrl(213514),
		duration: 12000,
	},
	BLEEDING: {
		id: 1714,
		name: 'Bleeding',
		icon: iconUrl(213501),
		duration: 30000, // duration: 15000 if applied by Aetherial Spark, duration: 60000 if applied by Nightbloom
	},
	BRISTLE: {
		id: 1716,
		name: 'Boost',
		icon: iconUrl(213503),
		duration: 30000,
	},
	ICE_SPIKES: {
		id: 1720,
		name: 'Ice Spikes',
		icon: iconUrl(213507),
		duration: 15000,
	},
	OFF_GUARD: {
		id: 1717,
		name: 'Off-guard',
		icon: iconUrl(213504),
		duration: 15000,
	},
	MALODOROUS: {
		id: 1715,
		name: 'Malodorous',
		icon: iconUrl(213502),
		duration: 15000,
	},
	BAD_BREATH_POISON: {
		id: 18,
		name: 'Poison',
		icon: iconUrl(215007),
		duration: 15000,
	},
	DIAMONDBACK: {
		id: 1722,
		name: 'Diamondback',
		icon: iconUrl(213509),
		duration: 10000,
	},
	MIGHTY_GUARD: {
		id: 1719,
		name: 'Mighty Guard',
		icon: iconUrl(213506),
	},
	TOAD_OIL: {
		id: 1737,
		name: 'Toad Oil',
		icon: iconUrl(213515),
		duration: 180000,
	},
	WAXING_NOCTURNE: {
		id: 1718,
		name: 'Waxing Nocturne',
		icon: iconUrl(213505),
		duration: 15000,
	},
	WANING_NOCTURNE: {
		id: 1727,
		name: 'Waning Nocturne',
		icon: iconUrl(213512),
		duration: 15000,
	},
	DEEP_FREEZE: {
		id: 1731,
		name: 'Deep Freeze',
		icon: iconUrl(213513),
		duration: 12000, // duration: 20000 if applied by Northerlies, duration: 10000 if applied by White Death
	},
	DOOM: {
		id: 1738,
		name: 'Doom',
		icon: iconUrl(213516),
		duration: 15000,
	},
	PECULIAR_LIGHT: {
		id: 1721,
		name: 'Peculiar Light',
		icon: iconUrl(213508),
		duration: 15000,
	},
	FEATHER_RAIN: {
		id: 1723,
		name: 'Windburn',
		icon: iconUrl(213510),
		duration: 6000,
	},
	VEIL_OF_THE_WHORL: {
		id: 1724,
		name: 'Veil of the Whorl',
		icon: iconUrl(213511),
		duration: 30000,
	},
	GOBSKIN: {
		id: 2114,
		name: 'Gobskin',
		icon: iconUrl(213517),
		duration: 30000,
	},
	MAGIC_HAMMER: {
		id: 2115,
		name: 'Conked',
		icon: iconUrl(213518),
		duration: 10000,
	},
	AVAIL_MEATILY_SHIELDED: {
		id: 2116,
		name: 'Meatily Shielded',
		icon: iconUrl(213519),
		duration: 12000,
	},
	AVAIL_MEAT_SHIELD: {
		id: 2117,
		name: 'Meat Shield',
		icon: iconUrl(213520),
		duration: 12000,
	},
	WHISTLE: {
		id: 2118,
		name: 'Harmonized',
		icon: iconUrl(213521),
		duration: 30000,
	},
	CACTGUARD: {
		id: 2119,
		name: 'Cactguard',
		icon: iconUrl(213522),
		duration: 6000,
	},
	DEVOUR: {
		id: 2120,
		name: 'HP Boost',
		icon: iconUrl(213523),
		duration: 15000,
	},
	CONDENSED_LIBRA_ASTRAL: {
		id: 2121,
		name: 'Astral Attenuation',
		icon: iconUrl(213524),
		duration: 30000,
	},
	CONDENSED_LIBRA_UMBRAL: {
		id: 2122,
		name: 'Umbral Attenuation',
		icon: iconUrl(213525),
		duration: 30000,
	},
	CONDENSED_LIBRA_PHYSICAL: {
		id: 2123,
		name: 'Physical Attenuation',
		icon: iconUrl(213526),
		duration: 30000,
	},
	MIMICRY_TANK: {
		id: 2124,
		name: 'Aetherial Mimicry: Tank',
		icon: iconUrl(213527),
	},
	MIMICRY_DPS: {
		id: 2125,
		name: 'Aetherial Mimicry: DPS',
		icon: iconUrl(213528),
	},
	MIMICRY_HEALER: {
		id: 2126,
		name: 'Aetherial Mimicry: Healer',
		icon: iconUrl(213529),
	},
	BRUSH_WITH_DEATH: {
		id: 2127,
		name: 'Brush with Death',
		icon: iconUrl(213530),
		duration: 600000,
	},
	SURPANAKHA: {
		id: 2130,
		name: 'Surpanakha\'s Fury',
		icon: iconUrl(219581),
		duration: 3000,
		stacksApplied: 1,
	},
	PHANTOM_FLURRY: {
		id: 2502,
		name: 'Phantom Flurry',
		icon: iconUrl(213541),
		duration: 5000,
	},
	COLD_FOG: {
		id: 2493,
		name: 'Cold Fog',
		icon: iconUrl(213532),
		duration: 5000,
	},
	TOUCH_OF_FROST: {
		id: 2494,
		name: 'Touch of Frost',
		icon: iconUrl(213533),
		duration: 15000,
	},
	TINGLING: {
		id: 2492,
		name: 'Tingling',
		icon: iconUrl(213531),
		duration: 15000,
	},
	ANGELS_SNACK: {
		id: 2495,
		name: 'Angel\'s Snack',
		icon: iconUrl(213534),
		duration: 15000,
	},
	CHELONIAN_GATE: {
		id: 2496,
		name: 'Chelonian Gate',
		icon: iconUrl(213535),
		duration: 10000,
	},
	AUSPICIOUS_TRANCE: {
		id: 2497,
		name: 'Auspicious Trance',
		icon: iconUrl(213536),
	},
	BASIC_INSTINCT: {
		id: 2498,
		name: 'Basic Instinct',
		icon: iconUrl(213537),
	},
	INCENDIARY_BURNS: {
		id: 2499,
		name: 'Incendiary Burns',
		icon: iconUrl(213538),
		duration: 15000,
	},
	DRAGON_FORCE: {
		id: 2500,
		name: 'Dragon Force',
		icon: iconUrl(213539),
		duration: 15000,
	},
	LIGHTHEADED: {
		id: 2501,
		name: 'Lightheaded',
		icon: iconUrl(213540),
		duration: 5000,
	},
	SCHILTRON: {
		id: 3631,
		name: 'Schiltron',
		icon: iconUrl(213542),
		duration: 15000,
	},
	BREATH_OF_MAGIC: {
		id: 3712,
		name: 'Breath of Magic',
		icon: iconUrl(213553),
		duration: 60000,
	},
	BEGRIMED: {
		id: 3636,
		name: 'Begrimed',
		icon: iconUrl(213546),
		duration: 9000,
	},
	SPICK_AND_SPAN: {
		id: 3637,
		name: 'Spick-and-span',
		icon: iconUrl(219447),
		duration: 15000,
	},
	BLU_PHYSICAL_VULN_DOWN: {
		id: 3638,
		name: 'Physical Vulnerability Down',
		icon: iconUrl(213547),
		duration: 10000,
	},
	BLU_MAGIC_VULN_DOWN: {
		id: 3639,
		name: 'Magic Vulnerability Down',
		icon: iconUrl(213548),
		duration: 10000,
	},
	WINGED_REPROBATION: {
		id: 3640,
		name: 'Winged Reprobation',
		icon: iconUrl(219454),
	},
	WINGED_REDEMPTION: {
		id: 3641,
		name: 'Winged Redemption',
		icon: iconUrl(213549),
		duration: 10000,
	},
	CANDY_CANE: {
		id: 3642,
		name: 'Candy Cane',
		icon: iconUrl(213550),
		duration: 10000,
	},
	MORTAL_FLAME: {
		id: 3643,
		name: 'Mortal Flame',
		icon: iconUrl(213551),
	},
	APOKALYPSIS: {
		id: 3644,
		name: 'Apokalypsis',
		icon: iconUrl(213552),
		duration: 10000,
	},
})
