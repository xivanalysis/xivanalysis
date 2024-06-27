import {iconUrl} from 'data/icon'
import {ensureStatuses} from '../type'

// TODO: Fill in the rest of this
export const BLM = ensureStatuses({
	THUNDER_I: {
		id: 161,
		name: 'Thunder',
		icon: iconUrl(10457),
	},
	THUNDER_II: {
		id: 162,
		name: 'Thunder II',
		icon: iconUrl(10458),
	},
	THUNDER_III: {
		id: 163,
		name: 'Thunder III',
		icon: iconUrl(10459),
		duration: 30000,
	},
	THUNDER_IV: {
		id: 1210,
		name: 'Thunder IV',
		icon: iconUrl(12657),
		duration: 18000,
	},
	TRIPLECAST: {
		id: 1211,
		name: 'Triplecast',
		icon: iconUrl(12658),
	},
	FIRESTARTER: {
		id: 165,
		name: 'Firestarter',
		icon: iconUrl(10460),
		duration: 30000,
	},
	THUNDERCLOUD: {
		id: 164,
		name: 'Thundercloud',
		icon: iconUrl(10461),
		duration: 40000,
	},
	LEY_LINES: {
		id: 737,
		name: 'Ley Lines',
		icon: iconUrl(12653),
		duration: 30000,
	},
	CIRCLE_OF_POWER: {
		id: 738,
		name: 'Circle Of Power',
		icon: iconUrl(12654),
		speedModifier: 0.85,
	},
	SHARPCAST: {
		id: 867,
		name: 'Sharpcast',
		icon: iconUrl(12655),
		duration: 30000,
	},
	MANAWARD: {
		id: 168,
		name: 'Manaward',
		icon: iconUrl(10456),
		duration: 20000,
	},
	ENHANCED_FLARE: {
		id: 2960,
		name: 'Enhanced Flare',
		icon: iconUrl(12659),
	},
})
