import {ensureStatuses} from '../type'

export const BLU = ensureStatuses({
	PETRIFICATION: {
		id: 1,
		name: 'Petrification',
		icon: 'https://xivapi.com/i/015000/015001.png',
		duration: 20000,
	},
	STUN: {
		id: 2,
		name: 'Stun',
		icon: 'https://xivapi.com/i/015000/015004.png',
		duration: 3000, // duration: 6000 if applied by Faze, duration: 4000 if applied by Sticky Tongue, duration: 1000 if applied by Perpetual Ray
	},
	SLEEP: {
		id: 3,
		name: 'Sleep',
		icon: 'https://xivapi.com/i/015000/015013.png',
		duration: 30000, // duration: 40000 if applied by Chirp
	},
	SLOW: {
		id: 9,
		name: 'Slow',
		icon: 'https://xivapi.com/i/015000/015009.png',
		duration: 15000, // duration: 20000 if applied by White Knight's Tour
	},
	BIND: {
		id: 13,
		name: 'Bind',
		icon: 'https://xivapi.com/i/015000/015003.png',
		duration: 20000,
	},
	HEAVY: {
		id: 14,
		name: 'Heavy',
		icon: 'https://xivapi.com/i/015000/015002.png',
		duration: 15000, // duration: 30000 if applied by 4-tonze Weight, duration: 10000 if applied by Reflux
	},
	BLIND: {
		id: 15,
		name: 'Blind',
		icon: 'https://xivapi.com/i/015000/015012.png',
		duration: 15000, // duration: 30000 if applied by Ink Jet
	},
	PARALYSIS: {
		id: 17,
		name: 'Paralysis',
		icon: 'https://xivapi.com/i/015000/015006.png',
		duration: 15000, // duration: 6000 if applied by Glower, duration: 9000 if applied by The Dragon's Voice, duration 30000 if applied by Mind Blast or Abyssal Transfixion
	},
	AQUA_BREATH: {
		id: 1736,
		name: 'Dropsy',
		icon: 'https://xivapi.com/i/013000/013514.png',
		duration: 12000,
	},
	BLEEDING: {
		id: 1714,
		name: 'Bleeding',
		icon: 'https://xivapi.com/i/013000/013501.png',
		duration: 30000, // duration: 15000 if applied by Aetherial Spark, duration: 60000 if applied by Nightbloom
	},
	BRISTLE: {
		id: 1716,
		name: 'Boost',
		icon: 'https://xivapi.com/i/013000/013503.png',
		duration: 30000,
	},
	ICE_SPIKES: {
		id: 1720,
		name: 'Ice Spikes',
		icon: 'https://xivapi.com/i/013000/013507.png',
		duration: 15000,
	},
	OFF_GUARD: {
		id: 1717,
		name: 'Off-guard',
		icon: 'https://xivapi.com/i/013000/013504.png',
		duration: 15000,
	},
	MALODOROUS: {
		id: 1715,
		name: 'Malodorous',
		icon: 'https://xivapi.com/i/013000/013502.png',
		duration: 15000,
	},
	BAD_BREATH_POISON: {
		id: 18,
		name: 'Poison',
		icon: 'https://xivapi.com/i/015000/015007.png',
		duration: 15000,
	},
	DIAMONDBACK: {
		id: 1722,
		name: 'Diamondback',
		icon: 'https://xivapi.com/i/013000/013509.png',
		duration: 10000,
	},
	MIGHTY_GUARD: {
		id: 1719,
		name: 'Mighty Guard',
		icon: 'https://xivapi.com/i/013000/013506.png',
	},
	TOAD_OIL: {
		id: 1737,
		name: 'Toad Oil',
		icon: 'https://xivapi.com/i/013000/013515.png',
		duration: 180000,
	},
	WAXING_NOCTURNE: {
		id: 1718,
		name: 'Waxing Nocturne',
		icon: 'https://xivapi.com/i/013000/013505.png',
		duration: 15000,
	},
	WANING_NOCTURNE: {
		id: 1727,
		name: 'Waning Nocturne',
		icon: 'https://xivapi.com/i/013000/013512.png',
		duration: 15000,
	},
	DEEP_FREEZE: {
		id: 1731,
		name: 'Deep Freeze',
		icon: 'https://xivapi.com/i/013000/013513.png',
		duration: 12000, // duration: 20000 if applied by Northerlies, duration: 10000 if applied by White Death
	},
	DOOM: {
		id: 1738,
		name: 'Doom',
		icon: 'https://xivapi.com/i/013000/013516.png',
		duration: 15000,
	},
	PECULIAR_LIGHT: {
		id: 1721,
		name: 'Peculiar Light',
		icon: 'https://xivapi.com/i/013000/013508.png',
		duration: 15000,
	},
	FEATHER_RAIN: {
		id: 1723,
		name: 'Windburn',
		icon: 'https://xivapi.com/i/013000/013510.png',
		duration: 6000,
	},
	VEIL_OF_THE_WHORL: {
		id: 1724,
		name: 'Veil of the Whorl',
		icon: 'https://xivapi.com/i/013000/013511.png',
		duration: 30000,
	},
	GOBSKIN: {
		id: 2114,
		name: 'Gobskin',
		icon: 'https://xivapi.com/i/013000/013517.png',
		duration: 30000,
	},
	MAGIC_HAMMER: {
		id: 2115,
		name: 'Conked',
		icon: 'https://xivapi.com/i/013000/013518.png',
		duration: 10000,
	},
	AVAIL_MEATILY_SHIELDED: {
		id: 2116,
		name: 'Meatily Shielded',
		icon: 'https://xivapi.com/i/013000/013519.png',
		duration: 12000,
	},
	AVAIL_MEAT_SHIELD: {
		id: 2117,
		name: 'Meat Shield',
		icon: 'https://xivapi.com/i/013000/013520.png',
		duration: 12000,
	},
	WHISTLE: {
		id: 2118,
		name: 'Harmonized',
		icon: 'https://xivapi.com/i/013000/013521.png',
		duration: 30000,
	},
	CACTGUARD: {
		id: 2119,
		name: 'Cactguard',
		icon: 'https://xivapi.com/i/013000/013522.png',
		duration: 6000,
	},
	DEVOUR: {
		id: 2120,
		name: 'HP Boost',
		icon: 'https://xivapi.com/i/013000/013523.png',
		duration: 15000,
	},
	CONDENSED_LIBRA_ASTRAL: {
		id: 2121,
		name: 'Astral Attenuation',
		icon: 'https://xivapi.com/i/013000/013524.png',
		duration: 30000,
	},
	CONDENSED_LIBRA_UMBRAL: {
		id: 2122,
		name: 'Umbral Attenuation',
		icon: 'https://xivapi.com/i/013000/013525.png',
		duration: 30000,
	},
	CONDENSED_LIBRA_PHYSICAL: {
		id: 2123,
		name: 'Physical Attenuation',
		icon: 'https://xivapi.com/i/013000/013526.png',
		duration: 30000,
	},
	MIMICRY_TANK: {
		id: 2124,
		name: 'Aetherial Mimicry: Tank',
		icon: 'https://xivapi.com/i/013000/013527.png',
	},
	MIMICRY_DPS: {
		id: 2125,
		name: 'Aetherial Mimicry: DPS',
		icon: 'https://xivapi.com/i/013000/013528.png',
	},
	MIMICRY_HEALER: {
		id: 2126,
		name: 'Aetherial Mimicry: Healer',
		icon: 'https://xivapi.com/i/013000/013529.png',
	},
	BRUSH_WITH_DEATH: {
		id: 2127,
		name: 'Brush with Death',
		icon: 'https://xivapi.com/i/013000/013530.png',
		duration: 600000,
	},
	SURPANAKHA: {
		id: 2130,
		name: 'Surpanakha\'s Fury',
		icon: 'https://xivapi.com/i/019000/019581.png',
		duration: 3000,
		stacksApplied: 1,
	},
	PHANTOM_FLURRY: {
		id: 2502,
		name: 'Phantom Flurry',
		icon: 'https://xivapi.com/i/013000/013541.png',
		duration: 5000,
	},
	COLD_FOG: {
		id: 2493,
		name: 'Cold Fog',
		icon: 'https://xivapi.com/i/013000/013532.png',
		duration: 5000,
	},
	TOUCH_OF_FROST: {
		id: 2494,
		name: 'Touch of Frost',
		icon: 'https://xivapi.com/i/013000/013533.png',
		duration: 15000,
	},
	TINGLING: {
		id: 2492,
		name: 'Tingling',
		icon: 'https://xivapi.com/i/013000/013531.png',
		duration: 15000,
	},
	ANGELS_SNACK: {
		id: 2495,
		name: 'Angel\'s Snack',
		icon: 'https://xivapi.com/i/013000/013534.png',
		duration: 15000,
	},
	CHELONIAN_GATE: {
		id: 2496,
		name: 'Chelonian Gate',
		icon: 'https://xivapi.com/i/013000/013535.png',
		duration: 10000,
	},
	AUSPICIOUS_TRANCE: {
		id: 2497,
		name: 'Auspicious Trance',
		icon: 'https://xivapi.com/i/013000/013536.png',
	},
	BASIC_INSTINCT: {
		id: 2498,
		name: 'Basic Instinct',
		icon: 'https://xivapi.com/i/013000/013537.png',
	},
	INCENDIARY_BURNS: {
		id: 2499,
		name: 'Incendiary Burns',
		icon: 'https://xivapi.com/i/013000/013538.png',
		duration: 15000,
	},
	DRAGON_FORCE: {
		id: 2500,
		name: 'Dragon Force',
		icon: 'https://xivapi.com/i/013000/013539.png',
		duration: 15000,
	},
	LIGHTHEADED: {
		id: 2501,
		name: 'Lightheaded',
		icon: 'https://xivapi.com/i/013000/013540.png',
		duration: 5000,
	},
	SCHILTRON: {
		id: 3631,
		name: 'Schiltron',
		icon: 'https://xivapi.com/i/013000/013542.png',
		duration: 15000,
	},
	BREATH_OF_MAGIC: {
		id: 3712,
		name: 'Breath of Magic',
		icon: 'https://xivapi.com/i/013000/013553.png',
		duration: 60000,
	},
	BEGRIMED: {
		id: 3636,
		name: 'Begrimed',
		icon: 'https://xivapi.com/i/013000/013546.png',
		duration: 9000,
	},
	SPICK_AND_SPAN: {
		id: 3637,
		name: 'Spick-and-span',
		icon: 'https://xivapi.com/i/019000/019447.png',
		duration: 15000,
	},
	BLU_PHYSICAL_VULN_DOWN: {
		id: 3638,
		name: 'Physical Vulnerability Down',
		icon: 'https://xivapi.com/i/013000/013547.png',
		duration: 10000,
	},
	BLU_MAGIC_VULN_DOWN: {
		id: 3639,
		name: 'Magic Vulnerability Down',
		icon: 'https://xivapi.com/i/013000/013548.png',
		duration: 10000,
	},
	WINGED_REPROBATION: {
		id: 3640,
		name: 'Winged Reprobation',
		icon: 'https://xivapi.com/i/019000/019454.png',
	},
	WINGED_REDEMPTION: {
		id: 3641,
		name: 'Winged Redemption',
		icon: 'https://xivapi.com/i/013000/013549.png',
		duration: 10000,
	},
	CANDY_CANE: {
		id: 3642,
		name: 'Candy Cane',
		icon: 'https://xivapi.com/i/013000/013550.png',
		duration: 10000,
	},
	MORTAL_FLAME: {
		id: 3643,
		name: 'Mortal Flame',
		icon: 'https://xivapi.com/i/013000/013551.png',
	},
	APOKALYPSIS: {
		id: 3644,
		name: 'Apokalypsis',
		icon: 'https://xivapi.com/i/013000/013552.png',
		duration: 10000,
	},
})
