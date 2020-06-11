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

export type RoleKey = keyof typeof roleData
export const ROLES = roleData as Record<RoleKey, Role>

export interface Job {
	name: MessageDescriptor
	logType: ActorType
	icon: string
	colour: string
	role: RoleKey
}

// Yeah I know there's lots of repetition but they're all different apis and endpoints and shit and I don't wanna pull it apart later to fix a desync
const JOBS = {
	UNKNOWN: {
		name: t('game.job.unknown')`Unknown`,
		logType: ActorType.UNKNOWN,
		icon: '?',
		colour: '#767676',
		role: 'UNSUPPORTED',
	},

	// Tank
	PALADIN: {
		name: t('game.job.paladin')`Paladin`,
		logType: ActorType.PALADIN,
		icon: 'pld',
		colour: '#a8d2e6',
		role: 'TANK',
	},
	WARRIOR: {
		name: t('game.job.warrior')`Warrior`,
		logType: ActorType.WARRIOR,
		icon: 'war',
		colour: '#cf2621',
		role: 'TANK',
	},
	DARK_KNIGHT: {
		name: t('game.job.dark-knight')`Dark Knight`,
		logType: ActorType.DARK_KNIGHT,
		icon: 'drk',
		colour: '#d126cc',
		role: 'TANK',
	},
	GUNBREAKER: {
		name: t('game.job.gunbreaker')`Gunbreaker`,
		logType: ActorType.GUNBREAKER,
		icon: 'gnb',
		colour: '#796d30',
		role: 'TANK',
	},

	// Healer
	WHITE_MAGE: {
		name: t('game.job.white-mage')`White Mage`,
		logType: ActorType.WHITE_MAGE,
		icon: 'whm',
		colour: '#fff0dc',
		role: 'HEALER',
	},
	SCHOLAR: {
		name: t('game.job.scholar')`Scholar`,
		logType: ActorType.SCHOLAR,
		icon: 'sch',
		colour: '#8657ff',
		role: 'HEALER',
	},
	ASTROLOGIAN: {
		name: t('game.job.astrologian')`Astrologian`,
		logType: ActorType.ASTROLOGIAN,
		icon: 'ast',
		colour: '#ffe74a',
		role: 'HEALER',
	},

	// Melee
	MONK: {
		name: t('game.job.monk')`Monk`,
		logType: ActorType.MONK,
		icon: 'mnk',
		colour: '#d69c00',
		role: 'MELEE',
	},
	DRAGOON: {
		name: t('game.job.dragoon')`Dragoon`,
		logType: ActorType.DRAGOON,
		icon: 'drg',
		colour: '#4164cd',
		role: 'MELEE',
	},
	NINJA: {
		name: t('game.job.ninja')`Ninja`,
		logType: ActorType.NINJA,
		icon: 'nin',
		colour: '#af1964',
		role: 'MELEE',
	},
	SAMURAI: {
		name: t('game.job.samurai')`Samurai`,
		logType: ActorType.SAMURAI,
		icon: 'sam',
		colour: '#e46d04',
		role: 'MELEE',
	},

	// Phys Ranged
	BARD: {
		name: t('game.job.bard')`Bard`,
		logType: ActorType.BARD,
		icon: 'brd',
		colour: '#91ba5e',
		role: 'PHYSICAL_RANGED',
	},
	MACHINIST: {
		name: t('game.job.machinist')`Machinist`,
		logType: ActorType.MACHINIST,
		icon: 'mch',
		colour: '#6ee1d6',
		role: 'PHYSICAL_RANGED',
	},
	DANCER: {
		name: t('game.job.dancer')`Dancer`,
		logType: ActorType.DANCER,
		icon: 'dnc',
		colour: '#e2b0af',
		role: 'PHYSICAL_RANGED',
	},

	// Magic Ranged
	BLACK_MAGE: {
		name: t('game.job.black-mage')`Black Mage`,
		logType: ActorType.BLACK_MAGE,
		icon: 'blm',
		colour: '#a579d6',
		role: 'MAGICAL_RANGED',
	},
	SUMMONER: {
		name: t('game.job.summoner')`Summoner`,
		logType: ActorType.SUMMONER,
		icon: 'smn',
		colour: '#2d9b78',
		role: 'MAGICAL_RANGED',
	},
	RED_MAGE: {
		name: t('game.job.red-mage')`Red Mage`,
		logType: ActorType.RED_MAGE,
		icon: 'rdm',
		colour: '#e87b7b',
		role: 'MAGICAL_RANGED',
	},
	BLUE_MAGE: {
		name: t('game.job.blue-mage')`Blue Mage`,
		logType: ActorType.BLUE_MAGE,
		icon: 'blu',
		colour: '#3366ff',
		role: 'MAGICAL_RANGED',
	},
}

export type JobKey = keyof typeof JOBS
export default JOBS as Record<JobKey, Job>
