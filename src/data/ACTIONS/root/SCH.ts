import {Attribute} from 'event'
import {ensureActions} from '../type'

export const SCH = ensureActions({
	// -----
	// Player
	// -----

	AETHERFLOW: {
		id: 166,
		name: 'Aetherflow',
		icon: 'https://xivapi.com/i/000000/000510.png',
		cooldown: 60000,
	},

	RESURRECTION: {
		id: 173,
		name: 'Resurrection',
		icon: 'https://xivapi.com/i/000000/000511.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 8000,
	},

	SCH_PHYSICK: {
		id: 190,
		name: 'Physick',
		icon: 'https://xivapi.com/i/000000/000518.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
	},

	BIOLYSIS: {
		id: 16540,
		name: 'Biolysis',
		icon: 'https://xivapi.com/i/002000/002820.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		statusesApplied: ['BIOLYSIS'],
	},

	ADLOQUIUM: {
		id: 185,
		name: 'Adloquium',
		icon: 'https://xivapi.com/i/002000/002801.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2000,
		statusesApplied: ['GALVANIZE', 'CATALYZE'],
	},

	BROIL_III: {
		id: 16541,
		name: 'Broil III',
		icon: 'https://xivapi.com/i/002000/002821.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2500,
	},

	SCH_RUIN_II: {
		id: 17870,
		name: 'Ruin II',
		icon: 'https://xivapi.com/i/000000/000502.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	RECITATION: {
		id: 16542,
		name: 'Recitation',
		icon: 'https://xivapi.com/i/002000/002822.png',
		cooldown: 90000,
	},

	// This is the action cast by the SCH
	SCH_FEY_BLESSING: {
		id: 16543,
		name: 'Fey Blessing',
		icon: 'https://xivapi.com/i/002000/002854.png',
		cooldown: 60000,
	},

	SUMMON_SERAPH: {
		id: 16545,
		name: 'Summon Seraph',
		icon: 'https://xivapi.com/i/002000/002850.png',
		cooldown: 120000,
	},

	SCH_CONSOLATION: {
		id: 16546,
		name: 'Consolation',
		icon: 'https://xivapi.com/i/002000/002851.png',
		cooldown: 30000,
		charges: 2,
	},

	SUCCOR: {
		id: 186,
		name: 'Succor',
		icon: 'https://xivapi.com/i/002000/002802.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2000,
		statusesApplied: ['GALVANIZE'],
	},

	SACRED_SOIL: {
		id: 188,
		name: 'Sacred Soil',
		icon: 'https://xivapi.com/i/002000/002804.png',
		cooldown: 30000,
	},

	LUSTRATE: {
		id: 189,
		name: 'Lustrate',
		icon: 'https://xivapi.com/i/002000/002805.png',
		cooldown: 1000,
	},

	ART_OF_WAR: {
		id: 16539,
		name: 'Art of War',
		icon: 'https://xivapi.com/i/002000/002819.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	INDOMITABILITY: {
		id: 3583,
		name: 'Indomitability',
		icon: 'https://xivapi.com/i/002000/002806.png',
		cooldown: 30000,
	},

	BROIL: {
		id: 3584,
		name: 'Broil',
		icon: 'https://xivapi.com/i/002000/002807.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2500,
	},

	DEPLOYMENT_TACTICS: {
		id: 3585,
		name: 'Deployment Tactics',
		icon: 'https://xivapi.com/i/002000/002808.png',
		cooldown: 120000,
	},

	EMERGENCY_TACTICS: {
		id: 3586,
		name: 'Emergency Tactics',
		icon: 'https://xivapi.com/i/002000/002809.png',
		cooldown: 15000,
		statusesApplied: ['EMERGENCY_TACTICS'],
	},

	DISSIPATION: {
		id: 3587,
		name: 'Dissipation',
		icon: 'https://xivapi.com/i/002000/002810.png',
		cooldown: 180000,
		statusesApplied: ['DISSIPATION'],
	},

	EXCOGITATION: {
		id: 7434,
		name: 'Excogitation',
		icon: 'https://xivapi.com/i/002000/002813.png',
		cooldown: 45000,
		statusesApplied: ['EXCOGITATION'],
	},

	BROIL_II: {
		id: 7435,
		name: 'Broil II',
		icon: 'https://xivapi.com/i/002000/002814.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2500,
	},

	CHAIN_STRATAGEM: {
		id: 7436,
		name: 'Chain Stratagem',
		icon: 'https://xivapi.com/i/002000/002815.png',
		cooldown: 120000,
		statusesApplied: ['CHAIN_STRATAGEM'],
	},

	SCH_AETHERPACT: {
		id: 7437,
		name: 'Aetherpact',
		icon: 'https://xivapi.com/i/002000/002816.png',
		cooldown: 3000,
	},

	DISSOLVE_UNION: {
		id: 7869,
		name: 'Dissolve Union',
		icon: 'https://xivapi.com/i/002000/002817.png',
		cooldown: 1000,
	},

	SCH_WHISPERING_DAWN: {
		id: 16537,
		name: 'Whispering Dawn',
		icon: 'https://xivapi.com/i/002000/002827.png',
		cooldown: 60000,
		statusesApplied: ['WHISPERING_DAWN'],
	},

	SCH_FEY_ILLUMINATION: {
		id: 16538,
		name: 'Fey Illumination',
		icon: 'https://xivapi.com/i/002000/002829.png',
		cooldown: 120000,
	},

	SCH_ENERGY_DRAIN: {
		id: 167,
		name: 'Energy Drain',
		icon: 'https://xivapi.com/i/000000/000514.png',
		cooldown: 3000,
	},

	SUMMON_EOS: {
		id: 17215,
		name: 'Summon Eos',
		icon: 'https://xivapi.com/i/002000/002823.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2500,
	},

	SUMMON_SELENE: {
		id: 17216,
		name: 'Summon Selene',
		icon: 'https://xivapi.com/i/002000/002824.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2500,
	},

	// -----
	// PET ACTIONS
	// -----
	EMBRACE: {
		id: 802,
		name: 'Embrace',
		icon: 'https://xivapi.com/i/002000/002826.png',
		cooldown: 3000,
		pet: true,
	},

	WHISPERING_DAWN: {
		id: 803,
		name: 'Whispering Dawn',
		icon: 'https://xivapi.com/i/002000/002827.png',
		pet: true,
	},

	FEY_ILLUMINATION: {
		id: 805,
		name: 'Fey Illumination',
		icon: 'https://xivapi.com/i/002000/002829.png',
		pet: true,
	},

	FEY_BLESSING: {
		id: 16544,
		name: 'Fey Blessing',
		icon: 'https://xivapi.com/i/002000/002855.png',
		pet: true,
	},

	SERAPHIC_VEIL: {
		id: 16548,
		name: 'Seraphic Veil',
		icon: 'https://xivapi.com/i/002000/002847.png',
		pet: true,
	},

	CONSOLATION: {
		id: 16547,
		name: 'Consolation',
		icon: 'https://xivapi.com/i/002000/002846.png',
		pet: true,
	},

	ANGELS_WHISPER: {
		id: 16550,
		name: 'Angel\'s Whisper',
		icon: 'https://xivapi.com/i/002000/002848.png',
		pet: true,
	},

	FEY_UNION: {
		id: 7438,
		name: 'Fey Union',
		icon: 'https://xivapi.com/i/002000/002818.png',
		pet: true,
	},

	SERAPHIC_ILLUMINATION: {
		id: 16551,
		name: 'Seraphic Illumination',
		icon: 'https://xivapi.com/i/002000/002849.png',
		pet: true,
	},
})
