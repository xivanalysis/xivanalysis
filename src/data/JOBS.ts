import {MessageDescriptor} from '@lingui/core'
import {t} from '@lingui/macro'
import {Job as ParserJob} from '@xivanalysis/parser-core'
import {addExtraIndex} from 'utilities'

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

export const ROLES = addExtraIndex(roleData as Record<keyof typeof roleData, Role>, 'id')

export interface Job {
	job: ParserJob
	name: MessageDescriptor
	icon: string
	colour: string
	role: Role['id']
}

// Yeah I know there's lots of repetition but they're all different apis and endpoints and shit and I don't wanna pull it apart later to fix a desync
const JOBS = {
	// Tank
	PALADIN: {
		job: ParserJob.PALADIN,
		name: t('game.job.paladin')`Paladin`,
		icon: 'pld',
		colour: '#a8d2e6',
		role: ROLES.TANK.id,
	},
	WARRIOR: {
		job: ParserJob.WARRIOR,
		name: t('game.job.warrior')`Warrior`,
		icon: 'war',
		colour: '#cf2621',
		role: ROLES.TANK.id,
	},
	DARK_KNIGHT: {
		job: ParserJob.DARK_KNIGHT,
		name: t('game.job.dark-knight')`Dark Knight`,
		icon: 'drk',
		colour: '#d126cc',
		role: ROLES.TANK.id,
	},

	// Healer
	WHITE_MAGE: {
		job: ParserJob.WHITE_MAGE,
		name: t('game.job.white-mage')`White Mage`,
		icon: 'whm',
		colour: '#fff0dc',
		role: ROLES.HEALER.id,
	},
	SCHOLAR: {
		job: ParserJob.SCHOLAR,
		name: t('game.job.scholar')`Scholar`,
		icon: 'sch',
		colour: '#8657ff',
		role: ROLES.HEALER.id,
	},
	ASTROLOGIAN: {
		job: ParserJob.ASTROLOGIAN,
		name: t('game.job.astrologian')`Astrologian`,
		icon: 'ast',
		colour: '#ffe74a',
		role: ROLES.HEALER.id,
	},

	// Melee
	MONK: {
		job: ParserJob.MONK,
		name: t('game.job.monk')`Monk`,
		icon: 'mnk',
		colour: '#d69c00',
		role: ROLES.MELEE.id,
	},
	DRAGOON: {
		job: ParserJob.DRAGOON,
		name: t('game.job.dragoon')`Dragoon`,
		icon: 'drg',
		colour: '#4164cd',
		role: ROLES.MELEE.id,
	},
	NINJA: {
		job: ParserJob.NINJA,
		name: t('game.job.ninja')`Ninja`,
		icon: 'nin',
		colour: '#af1964',
		role: ROLES.MELEE.id,
	},
	SAMURAI: {
		job: ParserJob.SAMURAI,
		name: t('game.job.samurai')`Samurai`,
		icon: 'sam',
		colour: '#e46d04',
		role: ROLES.MELEE.id,
	},

	// Phys Ranged
	BARD: {
		job: ParserJob.BARD,
		name: t('game.job.bard')`Bard`,
		icon: 'brd',
		colour: '#91ba5e',
		role: ROLES.PHYSICAL_RANGED.id,
	},
	MACHINIST: {
		job: ParserJob.MACHINIST,
		name: t('game.job.machinist')`Machinist`,
		icon: 'mch',
		colour: '#6ee1d6',
		role: ROLES.PHYSICAL_RANGED.id,
	},

	// Magic Ranged
	BLACK_MAGE: {
		job: ParserJob.BLACK_MAGE,
		name: t('game.job.black-mage')`Black Mage`,
		icon: 'blm',
		colour: '#a579d6',
		role: ROLES.MAGICAL_RANGED.id,
	},
	SUMMONER: {
		job: ParserJob.SUMMONER,
		name: t('game.job.summoner')`Summoner`,
		icon: 'smn',
		colour: '#2d9b78',
		role: ROLES.MAGICAL_RANGED.id,
	},
	RED_MAGE: {
		job: ParserJob.RED_MAGE,
		name: t('game.job.red-mage')`Red Mage`,
		icon: 'rdm',
		colour: '#e87b7b',
		role: ROLES.MAGICAL_RANGED.id,
	},
}

export default JOBS as Record<keyof typeof JOBS, Job>
