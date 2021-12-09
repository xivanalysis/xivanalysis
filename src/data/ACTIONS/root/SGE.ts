import {Attribute} from 'event'
import {ensureActions} from '../type'

export const SGE = ensureActions({
	/** Single-Target Heals/Shields */
	DIAGNOSIS: {
		id: 24284,
		name: 'Diagnosis',
		icon: 'https://xivapi.com/i/003000/003652.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},
	EUKRASIAN_DIAGNOSIS: {
		id: 24291,
		name: 'Eukrasian Diagnosis',
		icon: 'https://xivapi.com/i/003000/003659.png',
		onGcd: true,
		gcdRecast: 1500,
		mpCost: 900,
		statusesApplied: ['EUKRASIAN_DIAGNOSIS', 'DIFFERENTIAL_DIAGNOSIS'],
	},
	HAIMA: {
		id: 24305,
		name: 'Haima',
		icon: 'https://xivapi.com/i/003000/003673.png',
		cooldown: 120000,
		statusesApplied: ['HAIMA', 'HAIMATINON'],
	},
	EGEIRO: {
		id: 24287,
		name: 'Egeiro',
		icon: 'https://xivapi.com/i/003000/003655.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 8000,
		mpCost: 2400,
	},

	/** AoE Heals/Shield */
	PROGNOSIS: {
		id: 24286,
		name: 'Prognosis',
		icon: 'https://xivapi.com/i/003000/003654.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2000,
		mpCost: 800,
	},
	EUKRASIAN_PROGNOSIS: {
		id: 24292,
		name: 'Eukrasian Prognosis',
		icon: 'https://xivapi.com/i/003000/003660.png',
		onGcd: true,
		gcdRecast: 1500,
		mpCost: 900,
		statusesApplied: ['EUKRASIAN_PROGNOSIS'],
	},
	PANHAIMA: {
		id: 24311,
		name: 'Panhaima',
		icon: 'https://xivapi.com/i/003000/003679.png',
		cooldown: 120000,
		statusesApplied: ['PANHAIMA', 'PANHAIMATINON'],
	},
	PHYSIS: {
		id: 24288,
		name: 'Physis',
		icon: 'https://xivapi.com/i/003000/003656.png',
		cooldown: 60000,
		statusesApplied: ['PHYSIS'],
	},
	PHYSIS_II: {
		id: 24302,
		name: 'Physis II',
		icon: 'https://xivapi.com/i/003000/003670.png',
		cooldown: 60000,
		statusesApplied: ['PHYSIS_II', 'AUTOPHYSIS'],
	},
	HOLOS: {
		id: 24310,
		name: 'Holos',
		icon: 'https://xivapi.com/i/003000/003678.png',
		cooldown: 60000,
	},
	PEPSIS: {
		id: 24301,
		name: 'Pepsis',
		icon: 'https://xivapi.com/i/003000/003669.png',
		cooldown: 15000,
	},

	/** Utility */
	KARDIA: {
		id: 24285,
		name: 'Kardia',
		icon: 'https://xivapi.com/i/003000/003653.png',
		cooldown: 5000,
		statusesApplied: ['KARDIA', 'KARDION'],
	},
	EUKRASIA: {
		id: 24290,
		name: 'Eukrasia',
		icon: 'https://xivapi.com/i/003000/003658.png',
		onGcd: true,
		gcdRecast: 1000,
		statusesApplied: ['EUKRASIA'],
	},
	SOTERIA: {
		id: 24294,
		name: 'Kardia',
		icon: 'https://xivapi.com/i/003000/003662.png',
		cooldown: 90000,
		statusesApplied: ['SOTERIA'],
	},
	ICARUS: {
		id: 24295,
		name: 'Icarus',
		icon: 'https://xivapi.com/i/003000/003663.png',
		cooldown: 45000,
	},
	ZOE: {
		id: 24300,
		name: 'Zoe',
		icon: 'https://xivapi.com/i/003000/003668.png',
		cooldown: 90000,
		statusesApplied: ['ZOE'],
	},
	KRASIS: {
		id: 24317,
		name: 'Krasis',
		icon: 'https://xivapi.com/i/003000/003685.png',
		cooldown: 60000,
		statusesApplied: ['KRASIS'],
	},

	/** Addersgall abilities */
	RHIZOMATA: {
		id: 24309,
		name: 'Rhizomata',
		icon: 'https://xivapi.com/i/003000/003677.png',
		cooldown: 90000,
	},
	DRUOCHOLE: {
		id: 24296,
		name: 'Druochole',
		icon: 'https://xivapi.com/i/003000/003664.png',
		cooldown: 1000,
	},
	IXOCHOLE: {
		id: 24299,
		name: 'Ixochole',
		icon: 'https://xivapi.com/i/003000/003667.png',
		cooldown: 30000,
	},
	KERACHOLE: {
		id: 24298,
		name: 'Kerachole',
		icon: 'https://xivapi.com/i/003000/003666.png',
		cooldown: 30000,
		statusesApplied: ['KERACHOLE', 'KERAKEIA'],
	},
	TAUROCHOLE: {
		id: 24303,
		name: 'Taurochole',
		icon: 'https://xivapi.com/i/003000/003671.png',
		cooldown: 45000,
		statusesApplied: ['TAUROCHOLE'],
	},

	/** Single-Target DPS Spells */
	DOSIS: {
		id: 24283,
		name: 'Dosis',
		icon: 'https://xivapi.com/i/003000/003651.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},
	DOSIS_II: {
		id: 24306,
		name: 'Dosis II',
		icon: 'https://xivapi.com/i/003000/003674.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},
	DOSIS_III: {
		id: 24312,
		name: 'Dosis III',
		icon: 'https://xivapi.com/i/003000/003680.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},
	EUKRASIAN_DOSIS: {
		id: 24293,
		name: 'Eukrasian Dosis',
		icon: 'https://xivapi.com/i/003000/003661.png',
		onGcd: true,
		gcdRecast: 1500,
		mpCost: 400,
		statusesApplied: ['EUKRASIAN_DOSIS'],
	},
	EUKRASIAN_DOSIS_II: {
		id: 24308,
		name: 'Eukrasian Dosis II',
		icon: 'https://xivapi.com/i/003000/003676.png',
		onGcd: true,
		gcdRecast: 1500,
		mpCost: 500,
		statusesApplied: ['EUKRASIAN_DOSIS_II'],
	},
	EUKRASIAN_DOSIS_III: {
		id: 24314,
		name: 'Eukrasian Dosis III',
		icon: 'https://xivapi.com/i/003000/003682.png',
		onGcd: true,
		gcdRecast: 1500,
		mpCost: 600,
		statusesApplied: ['EUKRASIAN_DOSIS_III'],
	},

	/** AoE DPS Spells */
	TOXIKON: {
		id: 24304,
		name: 'Toxikon',
		icon: 'https://xivapi.com/i/003000/003672.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	TOXIKON_II: {
		id: 24316,
		name: 'Toxikon II',
		icon: 'https://xivapi.com/i/003000/003684.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	DYSKRASIA: {
		id: 24297,
		name: 'Dyskrasia',
		icon: 'https://xivapi.com/i/003000/003665.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		mpCost: 400,
	},
	DYSKRASIA_II: {
		id: 24315,
		name: 'Dyskrasia II',
		icon: 'https://xivapi.com/i/003000/003683.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		mpCost: 400,
	},
	PHLEGMA: {
		id: 24289,
		name: 'Phlegma',
		icon: 'https://xivapi.com/i/003000/003657.png',
		onGcd: true,
		gcdRecast: 2500,
		speedAttribute: Attribute.SPELL_SPEED,
		cooldown: 45000,
		charges: 2,
		mpCost: 400,
	},
	PHLEGMA_II: {
		id: 24307,
		name: 'Phlegma II',
		icon: 'https://xivapi.com/i/003000/003675.png',
		onGcd: true,
		gcdRecast: 2500,
		speedAttribute: Attribute.SPELL_SPEED,
		cooldown: 45000,
		charges: 2,
		mpCost: 400,
	},
	PHLEGMA_III: {
		id: 24313,
		name: 'Phlegma III',
		icon: 'https://xivapi.com/i/003000/003681.png',
		onGcd: true,
		gcdRecast: 2500,
		speedAttribute: Attribute.SPELL_SPEED,
		cooldown: 45000,
		charges: 2,
		mpCost: 400,
	},
	PNEUMA: {
		id: 24318,
		name: 'Pneuma',
		icon: 'https://xivapi.com/i/003000/003686.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		cooldown: 120000,
		mpCost: 700,
		statusesApplied: ['PNEUMA'],
	},
})
