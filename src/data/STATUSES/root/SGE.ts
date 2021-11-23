import {ensureStatuses} from '../type'

const SGE_STUB = 190705000

export const SGE = ensureStatuses({
	EUKRASIA: {
		id: SGE_STUB,
		name: 'Eukrasia',
		icon: '',
	},
	EUKRASIAN_DIAGNOSIS: {
		id: SGE_STUB + 1,
		name: 'Eukrasian Diagnosis',
		icon: '',
		duration: 30000,
	},
	DIFFERENTIAL_DIAGNOSIS: {
		id: SGE_STUB + 2,
		name: 'Differential Diagnosis',
		icon: '',
		duration: 30000,
	},
	HAIMA: {
		id: SGE_STUB + 20,
		name: 'Haima',
		icon: '',
		duration: 30000,
	},
	HAIMATINON: {
		id: SGE_STUB + 3,
		name: 'Haimatinon',
		icon: '',
		duration: 30000,
	},
	EUKRASIAN_PROGNOSIS: { // Tooltips imply this is a separate status, unlike SCH/Noct AST
		id: SGE_STUB + 4,
		name: 'Eukrasian Prognosis',
		icon: '',
		duration: 30000,
	},
	PANHAIMA: {
		id: SGE_STUB + 21,
		name: 'Panhaima',
		icon: '',
		duration: 30000,
	},
	PANHAIMATINON: {
		id: SGE_STUB + 5,
		name: 'Panhaimatinon',
		icon: '',
		duration: 30000,
	},
	PHYSIS: {
		id: SGE_STUB + 6,
		name: 'Physis',
		icon: '',
		duration: 21000,
	},
	PHYSIS_II: {
		id: SGE_STUB + 7,
		name: 'Physis II',
		icon: '',
		duration: 15000,
	},
	KARDIA: { // The buff the SGE receives when Kardia is active
		id: SGE_STUB + 8,
		name: 'Kardia',
		icon: '',
	},
	KARDION: { // The buff the Kardia target receives, this target will be healed
		id: SGE_STUB + 9,
		name: 'Kardion',
		icon: '',
	},
	SOTERIA: {
		id: SGE_STUB + 10,
		name: 'Soteria',
		icon: '',
		duration: 10000,
	},
	ZOE: {
		id: SGE_STUB + 11,
		name: 'Zoe',
		icon: '',
		duration: 30000,
	},
	KRASIS: {
		id: SGE_STUB + 12,
		name: 'Krasis',
		icon: '',
		duration: 10000,
	},
	KERACHOLE: {
		id: SGE_STUB + 13,
		name: 'Kerachole',
		icon: '',
		duration: 15000,
	},
	KERAKEIA: { // Not sure which of these is the damage taken and which is the regen portion of Kerachole
		id: SGE_STUB + 14,
		name: 'Kerakeia',
		icon: '',
		duration: 15000,
	},
	TAUROCHOLE: {
		id: SGE_STUB + 15,
		name: 'Taurochole',
		icon: '',
		duration: 15000,
	},
	EUKRASIAN_DOSIS: {
		id: SGE_STUB + 16,
		name: 'Eukrasian Dosis',
		icon: '',
		duration: 30000,
	},
	EUKRASIAN_DOSIS_II: {
		id: SGE_STUB + 17,
		name: 'Eukrasian Dosis II',
		icon: '',
		duration: 30000,
	},
	EUKRASIAN_DOSIS_III: {
		id: SGE_STUB + 18,
		name: 'Eukrasian Dosis III',
		icon: '',
		duration: 30000,
	},
	PNEUMA: {
		id: SGE_STUB + 19,
		name: 'Pneuma',
		icon: '',
		duration: 20000,
	},
})
