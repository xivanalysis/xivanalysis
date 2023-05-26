import {Attribute} from 'event'
import {ensureActions} from '../type'

// use action id of a skill id in the group to avoid potential duplications
const SMN_COOLDOWN_GROUP = {
	ENERGY: 8,
	DEMI: 15,
}

export const SMN = ensureActions({
	SUMMON_CARBUNCLE: {
		id: 25798,
		name: 'Summon Carbuncle',
		icon: 'https://xivapi.com/i/000000/000516.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2500,
	},

	RADIANT_AEGIS: {
		id: 25799,
		name: 'Radiant Aegis',
		icon: 'https://xivapi.com/i/002000/002750.png',
		cooldown: 60000,
		charges: 2,
	},

	SMN_PHYSICK: {
		id: 16230,
		name: 'Physick',
		icon: 'https://xivapi.com/i/000000/000518.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
	},

	GEMSHINE: {
		id: 25883,
		name: 'Gemshine',
		icon: 'https://xivapi.com/i/002000/002777.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2500,
	},

	FESTER: {
		id: 181,
		name: 'Fester',
		icon: 'https://xivapi.com/i/002000/002676.png',
		cooldown: 1000,
	},

	SMN_ENERGY_DRAIN: {
		id: 16508,
		name: 'Energy Drain',
		icon: 'https://xivapi.com/i/000000/000514.png',
		cooldown: 60000,
		cooldownGroup: SMN_COOLDOWN_GROUP.ENERGY,
		statusesApplied: ['FURTHER_RUIN'],
	},

	PRECIOUS_BRILLIANCE: {
		id: 25884,
		name: 'Precious Brilliance',
		icon: 'https://xivapi.com/i/002000/002778.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2500,
	},

	PAINFLARE: {
		id: 3578,
		name: 'Painflare',
		icon: 'https://xivapi.com/i/002000/002681.png',
		cooldown: 1000,
	},

	ENERGY_SIPHON: {
		id: 16510,
		name: 'Energy Siphon',
		icon: 'https://xivapi.com/i/002000/002697.png',
		cooldown: 60000,
		cooldownGroup: SMN_COOLDOWN_GROUP.ENERGY,
		statusesApplied: ['FURTHER_RUIN'],
	},

	RUIN_III: {
		id: 3579,
		name: 'Ruin III',
		icon: 'https://xivapi.com/i/002000/002682.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
	},

	ASTRAL_IMPULSE: {
		id: 25820,
		name: 'Astral Impulse',
		icon: 'https://xivapi.com/i/002000/002757.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	ASTRAL_FLARE: {
		id: 25821,
		name: 'Astral Impulse',
		icon: 'https://xivapi.com/i/002000/002758.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	ASTRAL_FLOW: {
		id: 25822,
		name: 'Astral Flow',
		icon: 'https://xivapi.com/i/002000/002759.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	DEATHFLARE: {
		id: 3582,
		name: 'Deathflare',
		icon: 'https://xivapi.com/i/002000/002685.png',
		cooldown: 20000,
	},

	RUIN_IV: {
		id: 7426,
		name: 'Ruin IV',
		icon: 'https://xivapi.com/i/002000/002686.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	SEARING_LIGHT: {
		id: 25801,
		name: 'Searing Light',
		icon: 'https://xivapi.com/i/002000/002752.png',
		cooldown: 120000,
	},

	SUMMON_BAHAMUT: {
		id: 7427,
		name: 'Summon Bahamut',
		icon: 'https://xivapi.com/i/002000/002691.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		gcdRecast: 2500,
		cooldown: 60000,
		cooldownGroup: SMN_COOLDOWN_GROUP.DEMI,
	},

	ENKINDLE_BAHAMUT: {
		id: 7429,
		name: 'Enkindle Bahamut',
		icon: 'https://xivapi.com/i/002000/002693.png',
		cooldown: 20000,
	},

	RUBY_RUIN_III: {
		id: 25817,
		name: 'Ruby Ruin III',
		icon: 'https://xivapi.com/i/002000/002682.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2800,
	},

	RUBY_RITE: {
		id: 25823,
		name: 'Ruby Rite',
		icon: 'https://xivapi.com/i/002000/002760.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2800,
	},

	TOPAZ_RUIN_III: {
		id: 25818,
		name: 'Topaz Ruin III',
		icon: 'https://xivapi.com/i/002000/002682.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	TOPAZ_RITE: {
		id: 25824,
		name: 'Topaz Rite',
		icon: 'https://xivapi.com/i/002000/002761.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	EMERALD_RUIN_III: {
		id: 25819,
		name: 'Emerald Ruin III',
		icon: 'https://xivapi.com/i/002000/002682.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		cooldown: 1500,
	},

	EMERALD_RITE: {
		id: 25825,
		name: 'Emerald Rite',
		icon: 'https://xivapi.com/i/002000/002762.png',
		onGcd: true,
		cooldown: 1500,
	},

	TRI_DISASTER: {
		id: 25826,
		name: 'Tri-Disaster',
		icon: 'https://xivapi.com/i/002000/002763.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
	},

	FOUNTAIN_OF_FIRE: {
		id: 16514,
		name: 'Fountain Of Fire',
		icon: 'https://xivapi.com/i/002000/002735.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	BRAND_OF_PURGATORY: {
		id: 16515,
		name: 'Brand Of Purgatory',
		icon: 'https://xivapi.com/i/002000/002736.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	SUMMON_PHOENIX: {
		id: 25831,
		name: 'Summon Phoenix',
		icon: 'https://xivapi.com/i/002000/002765.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		gcdRecast: 2500,
		cooldown: 60000,
		cooldownGroup: SMN_COOLDOWN_GROUP.DEMI,
		statusesApplied: ['EVERLASTING_FLIGHT'],
	},

	ENKINDLE_PHOENIX: {
		id: 16516,
		name: 'Enkindle Phoenix',
		icon: 'https://xivapi.com/i/002000/002737.png',
		cooldown: 20000,
	},

	REKINDLE: {
		id: 25830,
		name: 'Rekindle',
		icon: 'https://xivapi.com/i/002000/002764.png',
		cooldown: 20000,
		statusesApplied: ['REKINDLE', 'UNDYING_FLAME'],
	},

	RUBY_OUTBURST: {
		id: 25814,
		name: 'Ruby Outburst',
		icon: 'https://xivapi.com/i/002000/002698.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2800,
	},

	RUBY_CATASTROPHE: {
		id: 25832,
		name: 'Ruby Catastrophe',
		icon: 'https://xivapi.com/i/002000/002766.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2800,
	},

	TOPAZ_OUTBURST: {
		id: 25815,
		name: 'Topaz Outburst',
		icon: 'https://xivapi.com/i/002000/002698.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	TOPAZ_CATASTROPHE: {
		id: 25833,
		name: 'Topaz Catastrophe',
		icon: 'https://xivapi.com/i/002000/002767.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	EMERALD_OUTBURST: {
		id: 25816,
		name: 'Emerald Outburst',
		icon: 'https://xivapi.com/i/002000/002698.png',
		onGcd: true,
		cooldown: 1500,
	},

	EMERALD_CATASTROPHE: {
		id: 25834,
		name: 'Emerald Catastrophe',
		icon: 'https://xivapi.com/i/002000/002768.png',
		onGcd: true,
		cooldown: 1500,
	},

	CRIMSON_CYCLONE: {
		id: 25835,
		name: 'Crimson Cyclone',
		icon: 'https://xivapi.com/i/002000/002769.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	CRIMSON_STRIKE: {
		id: 25885,
		name: 'Crimson Strike',
		icon: 'https://xivapi.com/i/002000/002779.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	SMN_MOUNTAIN_BUSTER: {
		id: 25836,
		name: 'Mountain Buster',
		icon: 'https://xivapi.com/i/002000/002770.png',
		cooldown: 1000,
	},

	SLIPSTREAM: {
		id: 25837,
		name: 'Slipstream',
		icon: 'https://xivapi.com/i/002000/002771.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3000,
		gcdRecast: 3500,
		statusesApplied: ['SLIPSTREAM'],
	},

	SUMMON_IFRIT: {
		id: 25805,
		name: 'Summon Ifrit',
		icon: 'https://xivapi.com/i/002000/002680.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	SUMMON_IFRIT_II: {
		id: 25838,
		name: 'Summon Ifrit II',
		icon: 'https://xivapi.com/i/002000/002772.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	SUMMON_TITAN: {
		id: 25806,
		name: 'Summon Titan',
		icon: 'https://xivapi.com/i/002000/002755.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	SUMMON_TITAN_II: {
		id: 25839,
		name: 'Summon Titan II',
		icon: 'https://xivapi.com/i/002000/002773.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	SUMMON_GARUDA: {
		id: 25807,
		name: 'Summon Garuda',
		icon: 'https://xivapi.com/i/002000/002756.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	SUMMON_GARUDA_II: {
		id: 25840,
		name: 'Summon Garuda II',
		icon: 'https://xivapi.com/i/002000/002774.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	// -----
	// Pet
	// -----
	// Demi-bahamut
	WYRMWAVE: {
		id: 7428,
		name: 'Wyrmwave',
		icon: 'https://xivapi.com/i/002000/002692.png',
	},

	AKH_MORN: {
		id: 7449,
		name: 'Akh Morn',
		icon: 'https://xivapi.com/i/002000/002694.png',
	},

	// Demi-Phoenix
	SCARLET_FLAME: {
		id: 16519,
		name: 'Scarlet Flame',
		icon: 'https://xivapi.com/i/002000/002733.png',
	},

	REVELATION: {
		id: 16518,
		name: 'Revelation',
		icon: 'https://xivapi.com/i/002000/002732.png',
	},

	EVERLASTING_FLIGHT: {
		id: 16517,
		name: 'Everlasting Flight',
		icon: 'https://xivapi.com/i/002000/002731.png',
		statusesApplied: ['EVERLASTING_FLIGHT'],
	},

	// Ifrit
	INFERNO: {
		id: 25852,
		name: 'Inferno',
		icon: 'https://xivapi.com/i/002000/002772.png',
	},

	// Titan
	EARTHEN_FURY: {
		id: 25853,
		name: 'Earthen Fury',
		icon: 'https://xivapi.com/i/002000/002773.png',
	},

	// Garuda
	AERIAL_BLAST: {
		id: 25854,
		name: 'Aerial Blast',
		icon: 'https://xivapi.com/i/002000/002774.png',
	},

	// Carbuncle
	PET_RADIANT_AEGIS: {
		id: 25841,
		name: 'Radiant Aegis',
		icon: 'https://xivapi.com/i/002000/002775.png',
		statusesApplied: ['RADIANT_AEGIS'],
	},

	PET_SEARING_LIGHT: {
		id: 25842,
		name: 'Searing Light',
		icon: 'https://xivapi.com/i/002000/002776.png',
		statusesApplied: ['SEARING_LIGHT'],
	},
})
