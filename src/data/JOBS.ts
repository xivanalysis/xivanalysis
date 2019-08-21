import {MessageDescriptor} from '@lingui/core'
import {t} from '@lingui/macro'
import {ActorType} from 'fflogs'

export interface Role {
	id: number
	i18n_id: string
	name: MessageDescriptor
	colour: string
}

const colors = {
	tank: '#2185d0',
	healer: '#21ba45',
	dps: '#db2828',
	misc: '#767676',
}

const roleData = {
	TANK: {
		id: 1,
		name: t('game.roles.tank')`Tank`,
		colour: colors.tank,
	},

	HEALER: {
		id: 2,
		name: t('game.roles.healer')`Healer`,
		colour: colors.healer,
	},

	MELEE: {
		id: 3,
		name: t('game.roles.melee-dps')`Melee DPS`,
		colour: colors.dps,
	},

	PHYSICAL_RANGED: {
		id: 4,
		name: t('game.roles.physical-ranged-dps')`Physical Ranged DPS`,
		colour: colors.dps,
	},

	MAGICAL_RANGED: {
		id: 5,
		name: t('game.roles.magical-ranged-dps')`Magical Ranged DPS`,
		colour: colors.dps,
	},

	// Not really roles but w/e
	OUTDATED: {
		id: 99,
		name: t('game.roles.outdated')`Outdated`,
		colour: colors.misc,
	},

	UNSUPPORTED: {
		id: 100,
		name: t('game.roles.unsupported')`Unsupported`,
		colour: colors.misc,
	},
}

export const ROLES = roleData as Record<keyof typeof roleData, Role>

export interface Job {
	name: MessageDescriptor
	logType: ActorType
	icon: string
	colour: string
	role: Role['id']
}

// Yeah I know there's lots of repetition but they're all different apis and endpoints and shit and I don't wanna pull it apart later to fix a desync
const JOBS = {
	// Tank
	PALADIN: {
		name: t('game.job.paladin')`Paladin`,
		logType: ActorType.PALADIN,
		icon: 'pld',
		colour: '#a8d2e6',
		role: ROLES.TANK.id,
	},
	WARRIOR: {
		name: t('game.job.warrior')`Warrior`,
		logType: ActorType.WARRIOR,
		icon: 'war',
		colour: '#cf2621',
		role: ROLES.TANK.id,
	},
	DARK_KNIGHT: {
		name: t('game.job.dark-knight')`Dark Knight`,
		logType: ActorType.DARK_KNIGHT,
		icon: 'drk',
		colour: '#d126cc',
		role: ROLES.TANK.id,
	},
	GUNBREAKER: {
		name: t('game.job.gunbreaker')`Gunbreaker`,
		logType: ActorType.GUNBREAKER,
		icon: 'gnb',
		colour: '#796d30',
		role: ROLES.TANK.id,
	},

	// Healer
	WHITE_MAGE: {
		name: t('game.job.white-mage')`White Mage`,
		logType: ActorType.WHITE_MAGE,
		icon: 'whm',
		colour: '#fff0dc',
		role: ROLES.HEALER.id,
	},
	SCHOLAR: {
		name: t('game.job.scholar')`Scholar`,
		logType: ActorType.SCHOLAR,
		icon: 'sch',
		colour: '#8657ff',
		role: ROLES.HEALER.id,
	},
	ASTROLOGIAN: {
		name: t('game.job.astrologian')`Astrologian`,
		logType: ActorType.ASTROLOGIAN,
		icon: 'ast',
		colour: '#ffe74a',
		role: ROLES.HEALER.id,
	},

	// Melee
	MONK: {
		name: t('game.job.monk')`Monk`,
		logType: ActorType.MONK,
		icon: 'mnk',
		colour: '#d69c00',
		role: ROLES.MELEE.id,
	},
	DRAGOON: {
		name: t('game.job.dragoon')`Dragoon`,
		logType: ActorType.DRAGOON,
		icon: 'drg',
		colour: '#4164cd',
		role: ROLES.MELEE.id,
	},
	NINJA: {
		name: t('game.job.ninja')`Ninja`,
		logType: ActorType.NINJA,
		icon: 'nin',
		colour: '#af1964',
		role: ROLES.MELEE.id,
	},
	SAMURAI: {
		name: t('game.job.samurai')`Samurai`,
		logType: ActorType.SAMURAI,
		icon: 'sam',
		colour: '#e46d04',
		role: ROLES.MELEE.id,
	},

	// Phys Ranged
	BARD: {
		name: t('game.job.bard')`Bard`,
		logType: ActorType.BARD,
		icon: 'brd',
		colour: '#91ba5e',
		role: ROLES.PHYSICAL_RANGED.id,
	},
	MACHINIST: {
		name: t('game.job.machinist')`Machinist`,
		logType: ActorType.MACHINIST,
		icon: 'mch',
		colour: '#6ee1d6',
		role: ROLES.PHYSICAL_RANGED.id,
	},
	DANCER: {
		name: t('game.job.dancer')`Dancer`,
		logType: ActorType.DANCER,
		icon: 'dnc',
		colour: '#e2b0af',
		role: ROLES.PHYSICAL_RANGED.id,
	},

	// Magic Ranged
	BLACK_MAGE: {
		name: t('game.job.black-mage')`Black Mage`,
		logType: ActorType.BLACK_MAGE,
		icon: 'blm',
		colour: '#a579d6',
		role: ROLES.MAGICAL_RANGED.id,
	},
	SUMMONER: {
		name: t('game.job.summoner')`Summoner`,
		logType: ActorType.SUMMONER,
		icon: 'smn',
		colour: '#2d9b78',
		role: ROLES.MAGICAL_RANGED.id,
	},
	RED_MAGE: {
		name: t('game.job.red-mage')`Red Mage`,
		logType: ActorType.RED_MAGE,
		icon: 'rdm',
		colour: '#e87b7b',
		role: ROLES.MAGICAL_RANGED.id,
	},
}

export default JOBS as Record<keyof typeof JOBS, Job>
