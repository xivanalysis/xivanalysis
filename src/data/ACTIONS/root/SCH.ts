import {iconUrl} from 'data/icon'
import {Attribute} from 'event'
import {ensureActions} from '../type'

export const SCH = ensureActions({
	// -----
	// Player
	// -----

	BROIL_IV: {
		id: 25865,
		name: 'Broil IV',
		icon: iconUrl(2875),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
	},

	AETHERFLOW: {
		id: 166,
		name: 'Aetherflow',
		icon: iconUrl(510),
		cooldown: 60000,
	},

	RESURRECTION: {
		id: 173,
		name: 'Resurrection',
		icon: iconUrl(511),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 8000,
	},

	SCH_PHYSICK: {
		id: 190,
		name: 'Physick',
		icon: iconUrl(518),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
	},

	BIOLYSIS: {
		id: 16540,
		name: 'Biolysis',
		icon: iconUrl(2820),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		statusesApplied: ['BIOLYSIS'],
	},

	ADLOQUIUM: {
		id: 185,
		name: 'Adloquium',
		icon: iconUrl(2801),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2000,
		statusesApplied: ['GALVANIZE', 'CATALYZE'],
	},

	BROIL_III: {
		id: 16541,
		name: 'Broil III',
		icon: iconUrl(2821),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
	},

	SCH_RUIN_II: {
		id: 17870,
		name: 'Ruin II',
		icon: iconUrl(502),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	RECITATION: {
		id: 16542,
		name: 'Recitation',
		icon: iconUrl(2822),
		cooldown: 60000,
	},

	// This is the action cast by the SCH
	SCH_FEY_BLESSING: {
		id: 16543,
		name: 'Fey Blessing',
		icon: iconUrl(2854),
		cooldown: 60000,
	},

	SUMMON_SERAPH: {
		id: 16545,
		name: 'Summon Seraph',
		icon: iconUrl(2850),
		cooldown: 120000,
	},

	SCH_CONSOLATION: {
		id: 16546,
		name: 'Consolation',
		icon: iconUrl(2851),
		cooldown: 30000,
		charges: 2,
	},

	SUCCOR: {
		id: 186,
		name: 'Succor',
		icon: iconUrl(2802),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2000,
		statusesApplied: ['GALVANIZE'],
	},

	CONCITATION: {
		id: 37013,
		name: 'Conciation',
		icon: iconUrl(2880),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2000,
		statusesApplied: ['GALVANIZE'],
	},

	SACRED_SOIL: {
		id: 188,
		name: 'Sacred Soil',
		icon: iconUrl(2804),
		cooldown: 30000,
	},

	LUSTRATE: {
		id: 189,
		name: 'Lustrate',
		icon: iconUrl(2805),
		cooldown: 1000,
	},

	ART_OF_WAR: {
		id: 16539,
		name: 'Art of War',
		icon: iconUrl(2819),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	ART_OF_WAR_II: {
		id: 25866,
		name: 'Art of War II',
		icon: iconUrl(2876),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	PROTRACTION: {
		id: 25867,
		name: 'Protraction',
		icon: iconUrl(2877),
		cooldown: 60000,
		statusesApplied: ['PROTRACTION'],
	},

	EXPEDIENT: {
		id: 25868,
		name: 'Expedient',
		icon: iconUrl(2878),
		cooldown: 120000,
		statusesApplied: ['EXPEDIENCE', 'DESPERATE_MEASURES'],
	},

	INDOMITABILITY: {
		id: 3583,
		name: 'Indomitability',
		icon: iconUrl(2806),
		cooldown: 30000,
	},

	BROIL: {
		id: 3584,
		name: 'Broil',
		icon: iconUrl(2807),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
	},

	DEPLOYMENT_TACTICS: {
		id: 3585,
		name: 'Deployment Tactics',
		icon: iconUrl(2808),
		cooldown: 90000,
	},

	EMERGENCY_TACTICS: {
		id: 3586,
		name: 'Emergency Tactics',
		icon: iconUrl(2809),
		cooldown: 15000,
		statusesApplied: ['EMERGENCY_TACTICS'],
	},

	DISSIPATION: {
		id: 3587,
		name: 'Dissipation',
		icon: iconUrl(2810),
		cooldown: 180000,
		statusesApplied: ['DISSIPATION'],
	},

	EXCOGITATION: {
		id: 7434,
		name: 'Excogitation',
		icon: iconUrl(2813),
		cooldown: 45000,
		statusesApplied: ['EXCOGITATION'],
	},

	BROIL_II: {
		id: 7435,
		name: 'Broil II',
		icon: iconUrl(2814),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
	},

	BIO_II: {
		id: 17865,
		name: 'Bio II',
		icon: iconUrl(504),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		statusesApplied: ['BIO_II'],
	},

	CHAIN_STRATAGEM: {
		id: 7436,
		name: 'Chain Stratagem',
		icon: iconUrl(2815),
		cooldown: 120000,
		statusesApplied: ['CHAIN_STRATAGEM', 'IMPACT_IMMINENT'],
	},

	// Baneful Impaction
	BANEFUL_IMPACTION: {
		id: 37012,
		name: 'Baneful Impaction',
		icon: iconUrl(2879),
		cooldown: 300,
		statusesApplied: ['BANEFUL_IMPACTION'],
	},

	SCH_AETHERPACT: {
		id: 7437,
		name: 'Aetherpact',
		icon: iconUrl(2816),
		cooldown: 3000,
	},

	DISSOLVE_UNION: {
		id: 7869,
		name: 'Dissolve Union',
		icon: iconUrl(2817),
		cooldown: 1000,
	},

	SCH_WHISPERING_DAWN: {
		id: 16537,
		name: 'Whispering Dawn',
		icon: iconUrl(2827),
		cooldown: 60000,
		statusesApplied: ['WHISPERING_DAWN'],
	},

	SCH_FEY_ILLUMINATION: {
		id: 16538,
		name: 'Fey Illumination',
		icon: iconUrl(2829),
		cooldown: 120000,
	},

	SCH_ENERGY_DRAIN: {
		id: 167,
		name: 'Energy Drain',
		icon: iconUrl(514),
		cooldown: 1000,
	},

	SUMMON_EOS: {
		id: 17215,
		name: 'Summon Eos',
		icon: iconUrl(2823),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
	},

	SUMMON_SELENE: {
		id: 17216,
		name: 'Summon Selene',
		icon: iconUrl(2824),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
	},

	// -----
	// PET ACTIONS
	// -----
	EMBRACE: {
		id: 802,
		name: 'Embrace',
		icon: iconUrl(2826),
		cooldown: 3000,
		pet: true,
	},

	WHISPERING_DAWN: {
		id: 803,
		name: 'Whispering Dawn',
		icon: iconUrl(2827),
		pet: true,
	},

	FEY_ILLUMINATION: {
		id: 805,
		name: 'Fey Illumination',
		icon: iconUrl(2829),
		pet: true,
	},

	FEY_BLESSING: {
		id: 16544,
		name: 'Fey Blessing',
		icon: iconUrl(2855),
		pet: true,
	},

	SERAPHIC_VEIL: {
		id: 16548,
		name: 'Seraphic Veil',
		icon: iconUrl(2847),
		pet: true,
	},

	CONSOLATION: {
		id: 16547,
		name: 'Consolation',
		icon: iconUrl(2846),
		pet: true,
	},

	ANGELS_WHISPER: {
		id: 16550,
		name: 'Angel\'s Whisper',
		icon: iconUrl(2848),
		pet: true,
	},

	FEY_UNION: {
		id: 7438,
		name: 'Fey Union',
		icon: iconUrl(2818),
		pet: true,
	},

	SERAPHIC_ILLUMINATION: {
		id: 16551,
		name: 'Seraphic Illumination',
		icon: iconUrl(2849),
		pet: true,
	},

	// -----
	// SERAPHISM ACTIONS
	// -----
	SERAPHISM: {
		id: 37014,
		name: 'Seraphism',
		icon: iconUrl(2881),
		pet: false,
		statusesApplied: ['SERAPHISM'],
		cooldown: 180000,
	},

	MANIFESTATION: {
		id: 37015,
		name: 'Manifestation',
		icon: iconUrl(2882),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		statusesApplied: ['GALVANIZE', 'CATALYZE'],
	},

	ACCESSION: {
		id: 37016,
		name: 'Accession',
		icon: iconUrl(2883),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		statusesApplied: ['GALVANIZE', 'CATALYZE'],
	},
})
