import PETS from '../../PETS'
import {ensureActions} from '../type'

// use action id of a skill id in the group to avoid potential duplications
export const SMN_COOLDOWN_GROUP = {
	SUMMON: 180,
	ENERGY: 16510,
	TRANCE: 3581,
	EGI_ASSAULT: 16797,
	EGI_ASSAULT_II: 16798,
	ENKINDLE: 16802,
}

export const SMN = ensureActions({
	// -----
	// Player
	// -----
	SUMMON_III: {
		id: 180,
		name: 'Summon III',
		icon: 'https://xivapi.com/i/002000/002680.png',
		cooldown: 3,
		cooldownGroup: SMN_COOLDOWN_GROUP.SUMMON,
	},

	FESTER: {
		id: 181,
		name: 'Fester',
		icon: 'https://xivapi.com/i/002000/002676.png',
		cooldown: 5,
	},

	OUTBURST: {
		id: 16511,
		name: 'Outburst',
		icon: 'https://xivapi.com/i/002000/002698.png',
		onGcd: true,
		castTime: 2.5,
	},

	ENERGY_SIPHON: {
		id: 16510,
		name: 'Energy Siphon',
		icon: 'https://xivapi.com/i/002000/002697.png',
		cooldown: 30,
		cooldownGroup: SMN_COOLDOWN_GROUP.ENERGY,
	},

	PAINFLARE: {
		id: 3578,
		name: 'Painflare',
		icon: 'https://xivapi.com/i/002000/002681.png',
		cooldown: 5,
	},

	RUIN_III: {
		id: 3579,
		name: 'Ruin III',
		icon: 'https://xivapi.com/i/002000/002682.png',
		onGcd: true,
		castTime: 2.5, // This is reduced to instant during DWT
	},

	TRI_DISASTER: {
		id: 3580,
		name: 'Tri-disaster',
		icon: 'https://xivapi.com/i/002000/002683.png',
		cooldown: 50,
	},

	DREADWYRM_TRANCE: {
		id: 3581,
		name: 'Dreadwyrm Trance',
		icon: 'https://xivapi.com/i/002000/002684.png',
		cooldown: 55,
		cooldownGroup: SMN_COOLDOWN_GROUP.TRANCE,
	},

	DEATHFLARE: {
		id: 3582,
		name: 'Deathflare',
		icon: 'https://xivapi.com/i/002000/002685.png',
		cooldown: 15,
	},

	// Both SMN and SCH have Aetherpact, but they're different skills
	SMN_AETHERPACT: {
		id: 7423,
		name: 'Aetherpact',
		icon: 'https://xivapi.com/i/002000/002687.png',
		cooldown: 180,
	},

	BIO_III: {
		id: 7424,
		name: 'Bio III',
		icon: 'https://xivapi.com/i/002000/002689.png',
		onGcd: true,
		statusesApplied: ['BIO_III'],
	},

	MIASMA_III: {
		id: 7425,
		name: 'Miasma III',
		icon: 'https://xivapi.com/i/002000/002690.png',
		onGcd: true,
		castTime: 2.5,
		statusesApplied: ['MIASMA_III'],
	},

	RUIN_IV: {
		id: 7426,
		name: 'Ruin IV',
		icon: 'https://xivapi.com/i/002000/002686.png',
		onGcd: true,
	},

	SUMMON_BAHAMUT: {
		id: 7427,
		name: 'Summon Bahamut',
		icon: 'https://xivapi.com/i/002000/002691.png',
		cooldown: 30,
	},

	ENKINDLE_BAHAMUT: {
		id: 7429,
		name: 'Enkindle Bahamut',
		icon: 'https://xivapi.com/i/002000/002693.png',
		cooldown: 10,
	},

	FIREBIRD_TRANCE: {
		id: 16549,
		name: 'Firebird Trance',
		icon: 'https://xivapi.com/i/002000/002734.png',
		cooldown: 55,
		cooldownGroup: SMN_COOLDOWN_GROUP.TRANCE,
	},

	FOUNTAIN_OF_FIRE: {
		id: 16514,
		name: 'Fountain Of Fire',
		icon: 'https://xivapi.com/i/002000/002735.png',
		onGcd: true,
	},

	BRAND_OF_PURGATORY: {
		id: 16515,
		name: 'Brand Of Purgatory',
		icon: 'https://xivapi.com/i/002000/002736.png',
		onGcd: true,
	},

	ENKINDLE_PHOENIX: {
		id: 16516,
		name: 'Enkindle Phoenix',
		icon: 'https://xivapi.com/i/002000/002737.png',
		cooldown: 10,
		statusesApplied: ['EVERLASTING_FLIGHT'],
	},

	// Egi Assault, Egi Assault II, and Enkindle have unique ids depending on the summoned pet.
	ASSAULT_I_AERIAL_SLASH: {
		id: 16797,
		name: 'Assault I: Aerial Slash',
		icon: 'https://xivapi.com/i/002000/002717.png',
		cooldown: 30,
		cooldownGroup: SMN_COOLDOWN_GROUP.EGI_ASSAULT,
		onGcd: true,
		gcdRecast: 2.5,
		charges: 2,
	},

	ASSAULT_I_EARTHEN_ARMOR: {
		id: 16795,
		name: 'Assault I: Earthen Armor',
		icon: 'https://xivapi.com/i/002000/002707.png',
		cooldown: 30,
		cooldownGroup: SMN_COOLDOWN_GROUP.EGI_ASSAULT,
		onGcd: true,
		gcdRecast: 2.5,
		charges: 2,
	},

	ASSAULT_I_CRIMSON_CYCLONE: {
		id: 16799,
		name: 'Assault I: Crimson Cyclone',
		icon: 'https://xivapi.com/i/002000/002726.png',
		cooldown: 30,
		cooldownGroup: SMN_COOLDOWN_GROUP.EGI_ASSAULT,
		onGcd: true,
		gcdRecast: 2.5,
		charges: 2,
	},

	ASSAULT_II_SLIIPSTREAM: {
		id: 16798,
		name: 'Assault II: Slipstream',
		icon: 'https://xivapi.com/i/002000/002718.png',
		cooldown: 30,
		cooldownGroup: SMN_COOLDOWN_GROUP.EGI_ASSAULT_II,
		onGcd: true,
		gcdRecast: 2.5,
		charges: 2,
	},

	ASSAULT_II_MOUNTAIN_BUSTER: {
		id: 16796,
		name: 'Assault II: Mountain Buster',
		icon: 'https://xivapi.com/i/002000/002708.png',
		cooldown: 30,
		cooldownGroup: SMN_COOLDOWN_GROUP.EGI_ASSAULT_II,
		onGcd: true,
		gcdRecast: 2.5,
		charges: 2,
	},

	ASSAULT_II_FLAMING_CRUSH: {
		id: 16800,
		name: 'Assault II: Flaming Crush',
		icon: 'https://xivapi.com/i/002000/002727.png',
		cooldown: 30,
		cooldownGroup: SMN_COOLDOWN_GROUP.EGI_ASSAULT_II,
		onGcd: true,
		gcdRecast: 2.5,
		charges: 2,
	},

	ENKINDLE_AERIAL_BLAST: {
		id: 16802,
		name: 'Enkindle: Aerial Blast',
		icon: 'https://xivapi.com/i/002000/002719.png',
		cooldown: 120,
		cooldownGroup: SMN_COOLDOWN_GROUP.ENKINDLE,
	},

	ENKINDLE_EARTHEN_FURY: {
		id: 16801,
		name: 'Enkindle: Earthen Fury',
		icon: 'https://xivapi.com/i/002000/002709.png',
		cooldown: 120,
		cooldownGroup: SMN_COOLDOWN_GROUP.ENKINDLE,
	},

	ENKINDLE_INFERNO: {
		id: 16803,
		name: 'Enkindle: Inferno',
		icon: 'https://xivapi.com/i/002000/002728.png',
		cooldown: 120,
		cooldownGroup: SMN_COOLDOWN_GROUP.ENKINDLE,
	},

	// -----
	// Pet
	// -----
	// Garuda-egi
	WIND_BLADE: {
		id: 792,
		name: 'Wind Blade',
		icon: 'https://xivapi.com/i/002000/002711.png',
		pet: PETS.GARUDA_EGI.id,
	},

	AERIAL_SLASH: {
		id: 794,
		name: 'Aerial Slash',
		icon: 'https://xivapi.com/i/002000/002712.png',
		pet: PETS.GARUDA_EGI.id,
	},

	SLIPSTREAM: {
		id: 16523,
		name: 'Slipstream',
		icon: 'https://xivapi.com/i/002000/002716.png',
		pet: PETS.GARUDA_EGI.id,
	},

	AERIAL_BLAST: {
		id: 796,
		name: 'Aerial Blast',
		icon: 'https://xivapi.com/i/002000/002715.png',
		pet: PETS.GARUDA_EGI.id,
	},

	// Titan-egi
	TITAN_EGI_ATTACK: {
		id: 1346,
		name: 'Attack',
		icon: '',
		pet: PETS.TITAN_EGI.id,
	},

	ROCK_BUSTER: {
		id: 787,
		name: 'Rock Buster',
		icon: 'https://xivapi.com/i/002000/002701.png',
		pet: PETS.TITAN_EGI.id,
	},

	SMN_MOUNTAIN_BUSTER: {
		id: 788,
		name: 'Mountain Buster',
		icon: 'https://xivapi.com/i/002000/002702.png',
		pet: PETS.TITAN_EGI.id,
	},

	EARTHEN_ARMOR: {
		id: 16522,
		name: 'Earthen Armor',
		icon: 'https://xivapi.com/i/002000/002706.png',
		pet: PETS.TITAN_EGI.id,
	},

	EARTHEN_FURY: {
		id: 791,
		name: 'Earthen Fury',
		icon: 'https://xivapi.com/i/002000/002705.png',
		pet: PETS.TITAN_EGI.id,
	},

	// Ifrit-egi
	IFRIT_EGI_ATTACK: {
		id: 1347,
		name: 'Attack',
		icon: '',
		pet: PETS.IFRIT_EGI.id,
	},

	CRIMSON_CYCLONE: {
		id: 797,
		name: 'Crimson Cyclone',
		icon: 'https://xivapi.com/i/002000/002721.png',
		pet: PETS.IFRIT_EGI.id,
	},

	BURNING_STRIKE: {
		id: 798,
		name: 'Burning Strike',
		icon: 'https://xivapi.com/i/002000/002722.png',
		pet: PETS.IFRIT_EGI.id,
	},

	FLAMING_CRUSH: {
		id: 800,
		name: 'Flaming Crush',
		icon: 'https://xivapi.com/i/002000/002724.png',
		pet: PETS.IFRIT_EGI.id,
	},

	INFERNO: {
		id: 801,
		name: 'Inferno',
		icon: 'https://xivapi.com/i/002000/002725.png',
		pet: PETS.IFRIT_EGI.id,
	},

	// Any pet 'cus it's weirdass
	DEVOTION: {
		id: 7450,
		name: 'Devotion',
		icon: 'https://xivapi.com/i/002000/002688.png',
		statusesApplied: ['DEVOTION'],
	},

	// Demi-bahamut
	WYRMWAVE: {
		id: 7428,
		name: 'Wyrmwave',
		icon: 'https://xivapi.com/i/002000/002692.png',
		pet: PETS.DEMI_BAHAMUT.id,
	},

	AKH_MORN: {
		id: 7449,
		name: 'Akh Morn',
		icon: 'https://xivapi.com/i/002000/002694.png',
		pet: PETS.DEMI_BAHAMUT.id,
	},

	// Demi-Phoenix
	SCARLET_FLAME: {
		id: 16519,
		name: 'Scarlet Flame',
		icon: 'https://xivapi.com/i/002000/002733.png',
		pet: PETS.DEMI_PHOENIX.id,
	},

	REVELATION: {
		id: 16518,
		name: 'Revelation',
		icon: 'https://xivapi.com/i/002000/002732.png',
		pet: PETS.DEMI_PHOENIX.id,
	},
})
