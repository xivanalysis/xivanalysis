import {addExtraIndex} from 'utilities'

export const ROLES = addExtraIndex({
	TANK: {
		id: 1,
		name: 'Tank',
		colour: 'blue',
	},
	HEALER: {
		id: 2,
		name: 'Healer',
		colour: 'green',
	},

	MELEE: {
		id: 3,
		name: 'Melee DPS',
		colour: 'red',
	},

	PHYSICAL_RANGED: {
		id: 4,
		name: 'Physical Ranged DPS',
		colour: 'red',
	},

	MAGICAL_RANGED: {
		id: 5,
		name: 'Magical Ranged DPS',
		colour: 'red',
	},

	// Not really a role but w/e
	UNSUPPORTED: {
		id: 100,
		name: 'Unsupported',
		colour: 'grey',
	},
}, 'id')

// Yeah I know there's lots of repetition but they're all different apis and endpoints and shit and I don't wanna pull it apart later to fix a desync
const JOBS = {
	// Tank
	PALADIN: {
		name: 'Paladin',
		logType: 'Paladin',
		icon: 'paladin',
		colour: '#a8d2e6',
		role: ROLES.TANK.id,
	},
	WARRIOR: {
		name: 'Warrior',
		logType: 'Warrior',
		icon: 'warrior',
		colour: '#cf2621',
		role: ROLES.TANK.id,
	},
	DARK_KNIGHT: {
		name: 'Dark Knight',
		logType: 'DarkKnight',
		icon: 'darkknight',
		colour: '#d126cc',
		role: ROLES.TANK.id,
	},

	// Healer
	WHITE_MAGE: {
		name: 'White Mage',
		logType: 'WhiteMage',
		icon: 'whitemage',
		colour: '#fff0dc',
		role: ROLES.HEALER.id,
	},
	SCHOLAR: {
		name: 'Scholar',
		logType: 'Scholar',
		icon: 'scholar',
		colour: '#8657ff',
		role: ROLES.HEALER.id,
	},
	ASTROLOGIAN: {
		name: 'Astrologian',
		logType: 'Astrologian',
		icon: 'astrologian',
		colour: '#ffe74a',
		role: ROLES.HEALER.id,
	},

	// Melee
	MONK: {
		name: 'Monk',
		logType: 'Monk',
		icon: 'monk',
		colour: '#d69c00',
		role: ROLES.MELEE.id,
	},
	DRAGOON: {
		name: 'Dragoon',
		logType: 'Dragoon',
		icon: 'dragoon',
		colour: '#4164cd',
		role: ROLES.MELEE.id,
	},
	NINJA: {
		name: 'Ninja',
		logType: 'Ninja',
		icon: 'ninja',
		colour: '#af1964',
		role: ROLES.MELEE.id,
	},
	SAMURAI: {
		name: 'Samurai',
		logType: 'Samurai',
		icon: 'samurai',
		colour: '#e46d04',
		role: ROLES.MELEE.id,
	},

	// Phys Ranged
	BARD: {
		name: 'Bard',
		logType: 'Bard',
		icon: 'bard',
		colour: '#91ba5e',
		role: ROLES.PHYSICAL_RANGED.id,
	},
	MACHINIST: {
		name: 'Machinist',
		logType: 'Machinist',
		icon: 'machinist',
		colour: '#6ee1d6',
		role: ROLES.PHYSICAL_RANGED.id,
	},

	// Magic Ranged
	BLACK_MAGE: {
		name: 'Black Mage',
		logType: 'BlackMage',
		icon: 'blackmage',
		colour: '#a579d6',
		role: ROLES.MAGICAL_RANGED.id,
	},
	SUMMONER: {
		name: 'Summoner',
		logType: 'Summoner',
		icon: 'summoner',
		colour: '#2d9b78',
		role: ROLES.MAGICAL_RANGED.id,
	},
	RED_MAGE: {
		name: 'Red Mage',
		logType: 'RedMage',
		icon: 'redmage',
		colour: '#e87b7b',
		role: ROLES.MAGICAL_RANGED.id,
	},
}

export default addExtraIndex(JOBS, 'logType')
