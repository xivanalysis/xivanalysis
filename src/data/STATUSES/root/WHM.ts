import {iconUrl} from 'data/icon'
import {ensureStatuses} from '../type'

export const WHM = ensureStatuses({
	DIVINE_AURA: {
		id: 3904,
		name: 'Divine Aura',
		icon: iconUrl(212642),
		duration: 15000,
	},
	DIVINE_CARESS: {
		id: 3903,
		name: 'Divine Caress',
		icon: iconUrl(212641),
		duration: 10000,
	},
	DIVINE_GRACE: {
		id: 3881,
		name: 'Divine Grace',
		icon: iconUrl(212640),
		duration: 30000,
	},
	MEDICA_III: {
		id: 3880,
		name: 'Medica III',
		icon: iconUrl(212639),
		duration: 15000,
	},
	SACRED_SIGHT: {
		id: 3879,
		name: 'Sacred Sight',
		icon: iconUrl(218669),
		duration: 30000,
		stacksApplied: 3,
	},
	LITURGY_OF_THE_BELL: {
		id: 2709,
		name: 'Liturgy of the Bell',
		icon: iconUrl(218373),
		duration: 20000,
		stacksApplied: 5,
	},

	AQUAVEIL: {
		id: 2708,
		name: 'Aquaveil',
		icon: iconUrl(212638),
		duration: 8000,
	},

	DIA: {
		id: 1871,
		name: 'Dia',
		icon: iconUrl(212635),
		duration: 30000,
	},

	TEMPERANCE: {
		id: 1872,
		name: 'Temperance',
		icon: iconUrl(212634),
		duration: 20000,
	},

	CONFESSION: {
		id: 1219,
		name: 'Confession',
		icon: iconUrl(218901),
		duration: 10000,
	},

	REGEN: {
		id: 158,
		name: 'Regen',
		icon: iconUrl(212626),
		duration: 18000,
	},

	MEDICA_II: {
		id: 150,
		name: 'Medica II',
		icon: iconUrl(210413),
		duration: 15000,
	},

	AERO: {
		id: 143,
		name: 'Aero',
		icon: iconUrl(210403),
	},

	AERO_II: {
		id: 144,
		name: 'Aero II',
		icon: iconUrl(210409),
	},

	AERO_III: {
		id: 798,
		name: 'Aero III',
		icon: iconUrl(212630),
	},

	DIVINE_BENISON: {
		id: 1218,
		name: 'Divine Benison',
		icon: iconUrl(212632),
		duration: 15000,
	},

	ASYLUM: {
		id: 1911,
		name: 'Asylum',
		icon: iconUrl(212629),
		duration: 24000,
	},

	THIN_AIR: {
		id: 1217,
		name: 'Thin Air',
		icon: iconUrl(212631),
		duration: 12000,
	},

	PRESENCE_OF_MIND: {
		id: 157,
		name: 'Presence of Mind',
		icon: iconUrl(212627),
		duration: 15000,
		speedModifier: 0.80,
	},
})
