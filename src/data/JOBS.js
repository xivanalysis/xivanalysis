import { addExtraIndex } from 'utilities'

export const ROLES = addExtraIndex({
	TANK: {
		id: 1,
		name: 'Tank',
		colour: 'blue'
	},
	HEALER: {
		id: 2,
		name: 'Healer',
		colour: 'green'
	},

	// TODO: Not sure if I want to split DPS roles, we don't really have enough combatants for it to be an issue
	DPS: {
		id: 3,
		name: 'DPS',
		colour: 'red'
	},

	// Not really a role but w/e
	UNSUPPORTED: {
		id: 100,
		name: 'Unsupported',
		colour: 'grey'
	}
}, 'id')

// Yeah I know there's lots of repetition but they're all different apis and endpoints and shit and I don't wanna pull it apart later to fix a desync
const JOBS = {
	// Tank
	PALADIN: {
		name: 'Paladin',
		logType: 'Paladin',
		icon: 'paladin',
		role: ROLES.TANK.id
	},
	WARRIOR: {
		name: 'Warrior',
		logType: 'Warrior',
		icon: 'warrior',
		role: ROLES.TANK.id
	},
	DARK_KNIGHT: {
		name: 'Dark Knight',
		logType: 'DarkKnight',
		icon: 'darkknight',
		role: ROLES.TANK.id
	},

	// Healer
	WHITE_MAGE: {
		name: 'White Mage',
		logType: 'WhiteMage',
		icon: 'whitemage',
		role: ROLES.HEALER.id
	},
	SCHOLAR: {
		name: 'Scholar',
		logType: 'Scholar',
		icon: 'scholar',
		role: ROLES.HEALER.id
	},
	ASTROLOGIAN: {
		name: 'Astrologian',
		logType: 'Astrologian',
		icon: 'astrologian',
		role: ROLES.HEALER.id
	},

	// Melee
	MONK: {
		name: 'Monk',
		logType: 'Monk',
		icon: 'monk',
		role: ROLES.DPS.id
	},
	DRAGOON: {
		name: 'Dragoon',
		logType: 'Dragoon',
		icon: 'dragoon',
		role: ROLES.DPS.id
	},
	NINJA: {
		name: 'Ninja',
		logType: 'Ninja',
		icon: 'ninja',
		role: ROLES.DPS.id
	},
	SAMURAI: {
		name: 'Samurai',
		logType: 'Samurai',
		icon: 'samurai',
		role: ROLES.DPS.id
	},

	// Phys Ranged
	BARD: {
		name: 'Bard',
		logType: 'Bard',
		icon: 'bard',
		role: ROLES.DPS.id
	},
	MACHINIST: {
		name: 'Machinist',
		logType: 'Machinist',
		icon: 'machinist',
		role: ROLES.DPS.id
	},

	// Magic Ranged
	BLACK_MAGE: {
		name: 'Black Mage',
		logType: 'BlackMage',
		icon: 'blackmage',
		role: ROLES.DPS.id
	},
	SUMMONER: {
		name: 'Summoner',
		logType: 'Summoner',
		icon: 'summoner',
		role: ROLES.DPS.id
	},
	RED_MAGE: {
		name: 'Red Mage',
		logType: 'RedMage',
		icon: 'redmage',
		role: ROLES.DPS.id
	}
}

export default addExtraIndex(JOBS, 'logType')
