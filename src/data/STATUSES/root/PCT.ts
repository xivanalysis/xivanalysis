import {iconUrl} from 'data/icon'
import {ensureStatuses} from '../type'

export const PCT = ensureStatuses({
	AETHERHUES: {
		id: 3675,
		name: 'Aetherhues',
		icon: iconUrl(13801),
		duration: 30000,
	},
	AETHERHUES_II: {
		id: 3676,
		name: 'Aetherhues II',
		icon: iconUrl(13802),
		duration: 30000,
	},
	TEMPERA_COAT: {
		id: 3686,
		name: 'Tempera Coat',
		icon: iconUrl(13809),
		duration: 10000,
	},
	TEMPERA_GRASSA: {
		id: 3687,
		name: 'Tempera Grassa',
		icon: iconUrl(13810),
		duration: 10000,
	},
	SMUDGE: {
		id: 3684,
		name: 'Smudge',
		icon: iconUrl(13807),
		duration: 5000,
	},
	HAMMER_TIME: {
		id: 3680,
		name: 'Hammer Time',
		icon: iconUrl(18677),
		duration: 30000,
		stacksApplied: 3,
	},
	SUBTRACTIVE_PALETTE: {
		id: 3674,
		name: 'Subtractive Palette',
		icon: iconUrl(18673),
		duration: 30000,
		stacksApplied: 3,
	},
	MONOCHROME_TONES: {
		id: 3691,
		name: 'Monochrome Tones',
		icon: iconUrl(13814),
	},
	STARRY_MUSE: {
		id: 3685,
		name: 'Starry Muse',
		icon: iconUrl(13808),
		duration: 20000,
	},
	SUBTRACTIVE_SPECTRUM: {
		id: 3690,
		name: 'Subtractive Spectrum',
		icon: iconUrl(13813),
		duration: 30000,
	},
	INSPIRATION: {
		id: 3689,
		name: 'Inspiration',
		icon: iconUrl(13811),
		duration: 30000,
		speedModifier: 0.75,
	},
	HYPERPHANTASIA: {
		id: 3688,
		name: 'Hyperphantasia',
		icon: iconUrl(18155),
		duration: 30000,
		stacksApplied: 5,
	},
	STARSTRUCK: {
		id: 3681,
		name: 'Starstruck',
		icon: iconUrl(13806),
		duration: 20000,
	},
	RAINBOW_BRIGHT: {
		id: 3679,
		name: 'Rainbow Bright',
		icon: iconUrl(13805),
		duration: 20000,
	},

	// Star Prism's cure is apparently basically a 1 tic 'status effect'
	STAR_PRISM: {
		id: 3683,
		name: 'Star Prism',
		icon: iconUrl(13812),
	},
})
