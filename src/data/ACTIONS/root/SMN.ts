import {iconUrl} from 'data/icon'
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
		icon: iconUrl(516),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2500,
	},

	RADIANT_AEGIS: {
		id: 25799,
		name: 'Radiant Aegis',
		icon: iconUrl(2750),
		cooldown: 60000,
		charges: 2,
	},

	SMN_PHYSICK: {
		id: 16230,
		name: 'Physick',
		icon: iconUrl(518),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
	},

	GEMSHINE: {
		id: 25883,
		name: 'Gemshine',
		icon: iconUrl(2777),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2500,
	},

	FESTER: {
		id: 181,
		name: 'Fester',
		icon: iconUrl(2676),
		cooldown: 1000,
	},

	SMN_ENERGY_DRAIN: {
		id: 16508,
		name: 'Energy Drain',
		icon: iconUrl(514),
		cooldown: 60000,
		cooldownGroup: SMN_COOLDOWN_GROUP.ENERGY,
		statusesApplied: ['FURTHER_RUIN'],
	},

	PRECIOUS_BRILLIANCE: {
		id: 25884,
		name: 'Precious Brilliance',
		icon: iconUrl(2778),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2500,
	},

	PAINFLARE: {
		id: 3578,
		name: 'Painflare',
		icon: iconUrl(2681),
		cooldown: 1000,
	},

	ENERGY_SIPHON: {
		id: 16510,
		name: 'Energy Siphon',
		icon: iconUrl(2697),
		cooldown: 60000,
		cooldownGroup: SMN_COOLDOWN_GROUP.ENERGY,
		statusesApplied: ['FURTHER_RUIN'],
	},

	RUIN_III: {
		id: 3579,
		name: 'Ruin III',
		icon: iconUrl(2682),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
	},

	ASTRAL_IMPULSE: {
		id: 25820,
		name: 'Astral Impulse',
		icon: iconUrl(2757),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	ASTRAL_FLARE: {
		id: 25821,
		name: 'Astral Impulse',
		icon: iconUrl(2758),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	ASTRAL_FLOW: {
		id: 25822,
		name: 'Astral Flow',
		icon: iconUrl(2759),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	DEATHFLARE: {
		id: 3582,
		name: 'Deathflare',
		icon: iconUrl(2685),
		cooldown: 20000,
	},

	RUIN_IV: {
		id: 7426,
		name: 'Ruin IV',
		icon: iconUrl(2686),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	SEARING_LIGHT: {
		id: 25801,
		name: 'Searing Light',
		icon: iconUrl(2780),
		cooldown: 120000,
		statusesApplied: ['SEARING_LIGHT'],
	},

	SUMMON_BAHAMUT: {
		id: 7427,
		name: 'Summon Bahamut',
		icon: iconUrl(2691),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		gcdRecast: 2500,
		cooldown: 60000,
		cooldownGroup: SMN_COOLDOWN_GROUP.DEMI,
	},

	ENKINDLE_BAHAMUT: {
		id: 7429,
		name: 'Enkindle Bahamut',
		icon: iconUrl(2693),
		cooldown: 20000,
	},

	RUBY_RUIN_III: {
		id: 25817,
		name: 'Ruby Ruin III',
		icon: iconUrl(2682),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2800,
		gcdRecast: 3000,
	},

	RUBY_RITE: {
		id: 25823,
		name: 'Ruby Rite',
		icon: iconUrl(2760),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2800,
		gcdRecast: 3000,
	},

	TOPAZ_RUIN_III: {
		id: 25818,
		name: 'Topaz Ruin III',
		icon: iconUrl(2682),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	TOPAZ_RITE: {
		id: 25824,
		name: 'Topaz Rite',
		icon: iconUrl(2761),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	EMERALD_RUIN_III: {
		id: 25819,
		name: 'Emerald Ruin III',
		icon: iconUrl(2682),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		cooldown: 1500,
	},

	EMERALD_RITE: {
		id: 25825,
		name: 'Emerald Rite',
		icon: iconUrl(2762),
		onGcd: true,
		cooldown: 1500,
	},

	TRI_DISASTER: {
		id: 25826,
		name: 'Tri-Disaster',
		icon: iconUrl(2763),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
	},

	FOUNTAIN_OF_FIRE: {
		id: 16514,
		name: 'Fountain Of Fire',
		icon: iconUrl(2735),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	BRAND_OF_PURGATORY: {
		id: 16515,
		name: 'Brand Of Purgatory',
		icon: iconUrl(2736),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	SUMMON_PHOENIX: {
		id: 25831,
		name: 'Summon Phoenix',
		icon: iconUrl(2765),
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
		icon: iconUrl(2737),
		cooldown: 20000,
	},

	REKINDLE: {
		id: 25830,
		name: 'Rekindle',
		icon: iconUrl(2764),
		cooldown: 20000,
		statusesApplied: ['REKINDLE', 'UNDYING_FLAME'],
	},

	RUBY_OUTBURST: {
		id: 25814,
		name: 'Ruby Outburst',
		icon: iconUrl(2698),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2800,
		gcdRecast: 3000,
	},

	RUBY_CATASTROPHE: {
		id: 25832,
		name: 'Ruby Catastrophe',
		icon: iconUrl(2766),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2800,
		gcdRecast: 3000,
	},

	TOPAZ_OUTBURST: {
		id: 25815,
		name: 'Topaz Outburst',
		icon: iconUrl(2698),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	TOPAZ_CATASTROPHE: {
		id: 25833,
		name: 'Topaz Catastrophe',
		icon: iconUrl(2767),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	EMERALD_OUTBURST: {
		id: 25816,
		name: 'Emerald Outburst',
		icon: iconUrl(2698),
		onGcd: true,
		cooldown: 1500,
	},

	EMERALD_CATASTROPHE: {
		id: 25834,
		name: 'Emerald Catastrophe',
		icon: iconUrl(2768),
		onGcd: true,
		cooldown: 1500,
	},

	CRIMSON_CYCLONE: {
		id: 25835,
		name: 'Crimson Cyclone',
		icon: iconUrl(2769),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	CRIMSON_STRIKE: {
		id: 25885,
		name: 'Crimson Strike',
		icon: iconUrl(2779),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	SMN_MOUNTAIN_BUSTER: {
		id: 25836,
		name: 'Mountain Buster',
		icon: iconUrl(2770),
		cooldown: 1000,
	},

	SLIPSTREAM: {
		id: 25837,
		name: 'Slipstream',
		icon: iconUrl(2771),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3000,
		gcdRecast: 3500,
		statusesApplied: ['SLIPSTREAM'],
	},

	SUMMON_IFRIT: {
		id: 25805,
		name: 'Summon Ifrit',
		icon: iconUrl(2680),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	SUMMON_IFRIT_II: {
		id: 25838,
		name: 'Summon Ifrit II',
		icon: iconUrl(2772),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	SUMMON_TITAN: {
		id: 25806,
		name: 'Summon Titan',
		icon: iconUrl(2755),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	SUMMON_TITAN_II: {
		id: 25839,
		name: 'Summon Titan II',
		icon: iconUrl(2773),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	SUMMON_GARUDA: {
		id: 25807,
		name: 'Summon Garuda',
		icon: iconUrl(2756),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	SUMMON_GARUDA_II: {
		id: 25840,
		name: 'Summon Garuda II',
		icon: iconUrl(2774),
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
		icon: iconUrl(2692),
	},

	AKH_MORN: {
		id: 7449,
		name: 'Akh Morn',
		icon: iconUrl(2694),
	},

	// Demi-Phoenix
	SCARLET_FLAME: {
		id: 16519,
		name: 'Scarlet Flame',
		icon: iconUrl(2733),
	},

	REVELATION: {
		id: 16518,
		name: 'Revelation',
		icon: iconUrl(2732),
	},

	EVERLASTING_FLIGHT: {
		id: 16517,
		name: 'Everlasting Flight',
		icon: iconUrl(2731),
		statusesApplied: ['EVERLASTING_FLIGHT'],
	},

	// Ifrit
	INFERNO: {
		id: 25852,
		name: 'Inferno',
		icon: iconUrl(2772),
	},

	// Titan
	EARTHEN_FURY: {
		id: 25853,
		name: 'Earthen Fury',
		icon: iconUrl(2773),
	},

	// Garuda
	AERIAL_BLAST: {
		id: 25854,
		name: 'Aerial Blast',
		icon: iconUrl(2774),
	},

	// Carbuncle
	PET_RADIANT_AEGIS: {
		id: 25841,
		name: 'Radiant Aegis',
		icon: iconUrl(2775),
		statusesApplied: ['RADIANT_AEGIS'],
	},

	PET_SEARING_LIGHT: {
		id: 25842,
		name: 'Searing Light',
		icon: iconUrl(2776),
	},
})
