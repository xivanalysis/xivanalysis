import { addExtraIndex } from '@/utilities'

// Yeah I know there's lots of repetition but they're all different apis and endpoints and shit and I don't wanna pull it apart later to fix a desync
const JOBS = {
	// Tank
	PALADIN: {
		logType: 'Paladin',
		icon: 'paladin'
	},
	WARRIOR: {
		logType: 'Warrior',
		icon: 'warrior'
	},
	DARK_KNIGHT: {
		logType: 'DarkKnight',
		icon: 'darkknight'
	},

	// Healer
	WHITE_MAGE: {
		logType: 'WhiteMage',
		icon: 'whitemage'
	},
	SCHOLAR: {
		logType: 'Scholar',
		icon: 'scholar'
	},
	ASTROLOGIAN: {
		logType: 'Astrologian',
		icon: 'astrologian'
	},

	// Melee
	MONK: {
		logType: 'Monk',
		icon: 'monk'
	},
	DRAGOON: {
		logType: 'Dragoon',
		icon: 'dragoon'
	},
	NINJA: {
		logType: 'Ninja',
		icon: 'ninja'
	},
	SAMURAI: {
		logType: 'Samurai',
		icon: 'samurai'
	},

	// Phys Ranged
	BARD: {
		logType: 'Bard',
		icon: 'bard'
	},
	MACHINIST: {
		logType: 'Machinist',
		icon: 'machinist'
	},

	// Magic Ranged
	BLACK_MAGE: {
		logType: 'BlackMage',
		icon: 'blackmage'
	},
	SUMMONER: {
		logType: 'Summoner',
		icon: 'summoner'
	},
	RED_MAGE: {
		logType: 'RedMage',
		icon: 'redmage'
	}
}

export default addExtraIndex(JOBS, 'logType')
