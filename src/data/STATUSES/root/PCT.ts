import {ensureStatuses} from '../type'

// TODO: Fill in the rest of this
export const PCT = ensureStatuses({
	AETHERHUES: {
		id: 3675,
		name: 'Aetherhues',
		icon: '13801',
		duration: 30000,
	},
	AETHERHUES_II: {
		id: 3676,
		name: 'Aetherhues II',
		icon: '13802',
		duration: 30000,
	},
	TEMPURA_COAT: {
		id: 3686,
		name: 'Tempura Coat',
		icon: '13809',
		duration: 10000,
	},
	TEMPURA_GRASSA: {
		id: 3687,
		name: 'Tempura Grassa',
		icon: '13810',
		duration: 10000,
	},
	SMUDGE: {
		id: 3684,
		name: 'Smudge',
		icon: '13807',
		duration: 5000,
	},
	HAMMER_TIME: {
		id: 3680,
		name: 'Hammer Time',
		icon: '18677', // TODO, stack-less
		duration: 30000,
		stacksApplied: 3,
	},
	SUBTRACTIVE_PALLETTE: {
		id: 3674,
		name: 'Subtractive Pallette',
		icon: '18673', // TODO, stack-less
		duration: 30000,
		stacksApplied: 3,
	},
	MONOCHROME_TONES: {
		id: 3691,
		name: 'Monochrome Tones',
		icon: '13814',
	},
	STARRY_MUSE: {
		id: 3685,
		name: 'Starry Muse',
		icon: '13808',
		duration: 20000,
	},
	SUBTRACTIVE_SPECTRUM: {
		id: 3690,
		name: 'Subtractive Spectrum',
		icon: '13813',
		duration: 30000,
	},
	INSPIRATION: {
		id: 3689,
		name: 'Inspiration',
		icon: '13811',
		duration: 30000,
	},
	HYPERPHANTASIA: {
		id: 3688,
		name: 'Hyperphantasia',
		icon: '18155', // TODO, stack number-less?
		duration: 30000,
		stacksApplied: 5,
	},
	STARSTRUCK: {
		id: 3681,
		name: 'Starstruck',
		icon: '13806',
		duration: 20000,
	},
	RAINBOW_BRIGHT: {
		id: 3679,
		name: 'Rainbow Bright',
		icon: '13805',
		duration: 20000,
	},

	// Star Prism's cure is apparently basically a 1 tic 'status effect'
	STAR_PRISM: {
		id: 3683,
		name: 'Star Prism',
		icon: '13812',
	},
})
