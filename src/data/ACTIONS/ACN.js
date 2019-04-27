import PETS from '../PETS'

// Splitting ACN spells out of SMN/SCH so they aren't duped
export default {
	// -----
	// Player
	// -----
	RUIN: {
		id: 163,
		name: 'Ruin',
		icon: 'https://xivapi.com/i/000000/000501.png',
		onGcd: true,
		castTime: 2500,
	},

	BIO: {
		id: 164,
		name: 'Bio',
		icon: 'https://xivapi.com/i/000000/000503.png',
		onGcd: true,
	},

	SUMMON: {
		id: 165,
		name: 'Summon',
		icon: 'https://xivapi.com/i/000000/000516.png',
		onGcd: true,
		castTime: 3000,
	},

	AETHERFLOW: {
		id: 166,
		name: 'Aetherflow',
		icon: 'https://xivapi.com/i/000000/000510.png',
		cooldown: 60000,
	},

	ENERGY_DRAIN: {
		id: 167,
		name: 'Energy Drain',
		icon: 'https://xivapi.com/i/000000/000514.png',
		cooldown: 3000,
	},

	MIASMA: {
		id: 168,
		name: 'Miasma',
		icon: 'https://xivapi.com/i/000000/000505.png',
		onGcd: true,
		castTime: 2500,
	},

	SUMMON_II: {
		id: 170,
		name: 'Summon II',
		icon: 'https://xivapi.com/i/000000/000517.png',
		onGcd: true,
		castTime: 3000,
	},

	SUSTAIN: {
		id: 171,
		name: 'Sustain',
		icon: 'https://xivapi.com/i/000000/000508.png',
		onGcd: true,
		castTime: 1000,
	},

	RUIN_II: {
		id: 172,
		name: 'Ruin II',
		icon: 'https://xivapi.com/i/000000/000502.png',
		onGcd: true,
	},

	RESURRECTION: {
		id: 173,
		name: 'Resurrection',
		icon: 'https://xivapi.com/i/000000/000511.png',
		onGcd: true,
		castTime: 8000,
	},

	BANE: {
		id: 174,
		name: 'Bane',
		icon: 'https://xivapi.com/i/000000/000507.png',
		cooldown: 10000,
	},

	ROUSE: {
		id: 176,
		name: 'Rouse',
		icon: 'https://xivapi.com/i/000000/000509.png',
		cooldown: 60000,
	},

	BIO_II: {
		id: 178,
		name: 'Bio II',
		icon: 'https://xivapi.com/i/000000/000504.png',
		onGcd: true,
	},

	SHADOW_FLARE: {
		id: 179,
		name: 'Shadow Flare',
		icon: 'https://xivapi.com/i/000000/000515.png',
		cooldown: 60000,
	},

	PHYSICK: {
		id: 190,
		name: 'Physick',
		icon: 'https://xivapi.com/i/000000/000518.png',
		onGcd: true,
		castTime: 2000,
	},

	// -----
	// Pet - Man if someone actually needs these, I've got words for 'em
	// -----
	// Emerald Carbuncle
	GUST: {
		id: 637,
		name: 'Gust',
		icon: 'https://xivapi.com/i/000000/000561.png',
		pet: PETS.EMERALD_CARBUNCLE.id,
	},

	BACKDRAFT: {
		id: 638,
		name: 'Backdraft',
		icon: 'https://xivapi.com/i/000000/000563.png',
		cooldown: 90000,
		pet: PETS.EMERALD_CARBUNCLE.id,
	},

	DOWNBURST: {
		id: 639,
		name: 'Downburst',
		icon: 'https://xivapi.com/i/000000/000562.png',
		cooldown: 30000,
		pet: PETS.EMERALD_CARBUNCLE.id,
	},

	SHINING_EMERALD: {
		id: 640,
		name: 'Shining Emerald',
		icon: 'https://xivapi.com/i/000000/000564.png',
		cooldown: 60000,
		pet: PETS.EMERALD_CARBUNCLE.id,
	},

	// Topaz Carbuncle
	GOUGE: {
		id: 633,
		name: 'Gouge',
		icon: 'https://xivapi.com/i/000000/000551.png',
		pet: PETS.TOPAZ_CARBUNCLE.id,
	},

	SHINING_TOPAZ: {
		id: 634,
		name: 'Shining Topaz',
		icon: 'https://xivapi.com/i/000000/000552.png',
		cooldown: 15000,
		pet: PETS.TOPAZ_CARBUNCLE.id,
	},

	CURL: {
		id: 635,
		name: 'Curl',
		icon: 'https://xivapi.com/i/000000/000553.png',
		cooldown: 120000,
		pet: PETS.TOPAZ_CARBUNCLE.id,
	},

	STORM: {
		id: 636,
		name: 'Storm',
		icon: 'https://xivapi.com/i/000000/000554.png',
		cooldown: 40000,
		pet: PETS.TOPAZ_CARBUNCLE.id,
	},
}
