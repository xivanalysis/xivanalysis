import {iconUrl} from 'data/icon'
import {ensureStatuses} from '../type'
import {SHARED} from './SHARED'

export const MNK = ensureStatuses({
	OPO_OPO_FORM: {
		id: 107,
		name: 'Opo-Opo Form',
		icon: iconUrl(10212),
		duration: 30000,
	},

	RAPTOR_FORM: {
		id: 108,
		name: 'Raptor Form',
		icon: iconUrl(10213),
		duration: 30000,
	},

	COEURL_FORM: {
		id: 109,
		name: 'Coeurl Form',
		icon: iconUrl(10214),
		duration: 30000,
	},

	DISCIPLINED_FIST: {
		id: 3001,
		name: 'Disciplined Fist',
		icon: iconUrl(12538),
		duration: 15000,
	},

	DEMOLISH: {
		id: 246,
		name: 'Demolish',
		icon: iconUrl(10218),
		duration: 18000,
	},

	MANTRA: {
		id: 102,
		name: 'Mantra',
		icon: iconUrl(10206),
		duration: 15000,
	},

	PERFECT_BALANCE: {
		id: 110,
		name: 'Perfect Balance',
		icon: iconUrl(10217),
		duration: 30000,
		stacksApplied: 3,
	},

	BROTHERHOOD: {
		id: 1185,
		name: 'Brotherhood',
		icon: iconUrl(12532),
		duration: 15000,
	},

	MEDITATIVE_BROTHERHOOD: {
		id: 1182,
		name: 'Meditative Brotherhood',
		icon: iconUrl(12529),
		duration: 15000,
	},

	RIDDLE_OF_EARTH: {
		id: 1179,
		name: 'Riddle of Earth',
		icon: iconUrl(12527),
		duration: 10000,
		stacksApplied: 3,
	},

	EARTHS_REPLY: SHARED.UNKNOWN, // Added in patch 6.3 layer

	RIDDLE_OF_FIRE: {
		id: 1181,
		name: 'Riddle of Fire',
		icon: iconUrl(12528),
		duration: 20000,
	},

	RIDDLE_OF_WIND: {
		id: 2687,
		name: 'Riddle of Wind',
		icon: iconUrl(12537),
		duration: 15000,
	},

	FORMLESS_FIST: {
		id: 2513,
		name: 'Formless Fist',
		icon: iconUrl(12535),
		duration: 30000,
	},

	LEADEN_FIST: {
		id: 1861,
		name: 'Leaden Fist',
		icon: iconUrl(12533),
		duration: 30000,
	},

	ANATMAN: {
		id: 1862,
		name: 'Anatman',
		icon: iconUrl(12534),
		duration: 30000,
	},
})
