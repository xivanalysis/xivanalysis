import {iconUrl} from 'data/icon'
import {ensureStatuses} from '../type'

export const WHM = ensureStatuses({
	DIVINE_AURA: {
		id: 3904,
		name: 'Divine Aura',
		icon: iconUrl(12642),
		duration: 15000,
	},
	DIVINE_CARESS: {
		id: 3903,
		name: 'Divine Caress',
		icon: iconUrl(12641),
		duration: 10000,
	},
	DIVINE_GRACE: {
		id: 3881,
		name: 'Divine Grace',
		icon: iconUrl(12640),
		duration: 30000,
	},
	MEDICA_III: {
		id: 3880,
		name: 'Medica III',
		icon: iconUrl(12639),
		duration: 15000,
	},
	SACRED_SIGHT: {
		id: 3879,
		name: 'Sacred Sight',
		icon: iconUrl(18669),
		duration: 30000,
		stacksApplied: 3,
	},
	LITURGY_OF_THE_BELL: {
		id: 2709,
		name: 'Liturgy of the Bell',
		icon: iconUrl(18373),
		duration: 20000,
		stacksApplied: 5,
	},

	AQUAVEIL: {
		id: 2708,
		name: 'Aquaveil',
		icon: iconUrl(12638),
		duration: 8000,
	},

	DIA: {
		id: 1871,
		name: 'Dia',
		icon: iconUrl(12635),
		duration: 30000,
	},

	TEMPERANCE: {
		id: 1872,
		name: 'Temperance',
		icon: iconUrl(12634),
		duration: 20000,
	},

	CONFESSION: {
		id: 1219,
		name: 'Confession',
		icon: iconUrl(18901),
		duration: 10000,
	},

	REGEN: {
		id: 158,
		name: 'Regen',
		icon: iconUrl(12626),
		duration: 18000,
	},

	MEDICA_II: {
		id: 150,
		name: 'Medica II',
		icon: iconUrl(10413),
		duration: 15000,
	},

	AERO: {
		id: 143,
		name: 'Aero',
		icon: iconUrl(10403),
	},

	AERO_II: {
		id: 144,
		name: 'Aero II',
		icon: iconUrl(10409),
	},

	AERO_III: {
		id: 798,
		name: 'Aero III',
		icon: iconUrl(12630),
	},

	DIVINE_BENISON: {
		id: 1218,
		name: 'Divine Benison',
		icon: iconUrl(12632),
		duration: 15000,
	},

	ASYLUM: {
		id: 1911,
		name: 'Asylum',
		icon: iconUrl(12629),
		duration: 24000,
	},

	THIN_AIR: {
		id: 1217,
		name: 'Thin Air',
		icon: iconUrl(12631),
		duration: 12000,
	},

	PRESENCE_OF_MIND: {
		id: 157,
		name: 'Presence of Mind',
		icon: iconUrl(12627),
		duration: 15000,
		speedModifier: 0.80,
	},
})
