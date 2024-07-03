import {MessageDescriptor} from '@lingui/core'
import {t} from '@lingui/macro'
import {Attribute} from 'event'
import {ensureRecord} from 'utilities'

export interface Role {
	id: number
	name: MessageDescriptor
	colour: string
}

const colors = {
	tank: '#2185d0',
	healer: '#21ba45',
	dps: '#db2828',
	misc: '#767676',
}

export const ROLES = ensureRecord<Role>()({
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
})

export type RoleKey = keyof typeof ROLES

export interface Job {
	name: MessageDescriptor
	speedStat: Attribute.SKILL_SPEED | Attribute.SPELL_SPEED
	icon: string
	colour: string
	role: RoleKey
	usesMP?: boolean // Used by Actors to determine if an MP graph should be shown for jobs outside the healer and caster roles
}

// Yeah I know there's lots of repetition but they're all different apis and endpoints and shit and I don't wanna pull it apart later to fix a desync
export const JOBS = ensureRecord<Job>()({
	UNKNOWN: {
		name: t('game.job.unknown')`Unknown`,
		speedStat: Attribute.SKILL_SPEED,
		icon: '?',
		colour: '#767676',
		role: 'UNSUPPORTED',
	},

	// Tank
	PALADIN: {
		name: t('game.job.paladin')`Paladin`,
		speedStat: Attribute.SKILL_SPEED,
		icon: 'pld',
		colour: '#a8d2e6',
		role: 'TANK',
		usesMP: true,
	},
	WARRIOR: {
		name: t('game.job.warrior')`Warrior`,
		speedStat: Attribute.SKILL_SPEED,
		icon: 'war',
		colour: '#cf2621',
		role: 'TANK',
	},
	DARK_KNIGHT: {
		name: t('game.job.dark-knight')`Dark Knight`,
		speedStat: Attribute.SKILL_SPEED,
		icon: 'drk',
		colour: '#d126cc',
		role: 'TANK',
		usesMP: true,
	},
	GUNBREAKER: {
		name: t('game.job.gunbreaker')`Gunbreaker`,
		speedStat: Attribute.SKILL_SPEED,
		icon: 'gnb',
		colour: '#796d30',
		role: 'TANK',
	},

	// Healer
	WHITE_MAGE: {
		name: t('game.job.white-mage')`White Mage`,
		speedStat: Attribute.SPELL_SPEED,
		icon: 'whm',
		colour: '#fff0dc',
		role: 'HEALER',
	},
	SCHOLAR: {
		name: t('game.job.scholar')`Scholar`,
		speedStat: Attribute.SPELL_SPEED,
		icon: 'sch',
		colour: '#8657ff',
		role: 'HEALER',
	},
	ASTROLOGIAN: {
		name: t('game.job.astrologian')`Astrologian`,
		speedStat: Attribute.SPELL_SPEED,
		icon: 'ast',
		colour: '#ffe74a',
		role: 'HEALER',
	},
	SAGE: {
		name: t('game.job.sage')`Sage`,
		speedStat: Attribute.SPELL_SPEED,
		icon: 'sge',
		colour: '#80a0f0',
		role: 'HEALER',
	},

	// Melee
	MONK: {
		name: t('game.job.monk')`Monk`,
		speedStat: Attribute.SKILL_SPEED,
		icon: 'mnk',
		colour: '#d69c00',
		role: 'MELEE',
	},
	DRAGOON: {
		name: t('game.job.dragoon')`Dragoon`,
		speedStat: Attribute.SKILL_SPEED,
		icon: 'drg',
		colour: '#4164cd',
		role: 'MELEE',
	},
	NINJA: {
		name: t('game.job.ninja')`Ninja`,
		speedStat: Attribute.SKILL_SPEED,
		icon: 'nin',
		colour: '#af1964',
		role: 'MELEE',
	},
	SAMURAI: {
		name: t('game.job.samurai')`Samurai`,
		speedStat: Attribute.SKILL_SPEED,
		icon: 'sam',
		colour: '#e46d04',
		role: 'MELEE',
	},
	REAPER: {
		name: t('game.job.reaper')`Reaper`,
		speedStat: Attribute.SKILL_SPEED,
		icon: 'rpr',
		colour: '#965a90',
		role: 'MELEE',
	},
	VIPER: {
		name: t('game.job.viper')`Viper`,
		speedStat: Attribute.SKILL_SPEED,
		icon: 'vpr',
		colour: '#30a230',
		role: 'MELEE',
	},

	// Phys Ranged
	BARD: {
		name: t('game.job.bard')`Bard`,
		speedStat: Attribute.SKILL_SPEED,
		icon: 'brd',
		colour: '#91ba5e',
		role: 'PHYSICAL_RANGED',
	},
	MACHINIST: {
		name: t('game.job.machinist')`Machinist`,
		speedStat: Attribute.SKILL_SPEED,
		icon: 'mch',
		colour: '#6ee1d6',
		role: 'PHYSICAL_RANGED',
	},
	DANCER: {
		name: t('game.job.dancer')`Dancer`,
		speedStat: Attribute.SKILL_SPEED,
		icon: 'dnc',
		colour: '#e2b0af',
		role: 'PHYSICAL_RANGED',
	},

	// Magic Ranged
	BLACK_MAGE: {
		name: t('game.job.black-mage')`Black Mage`,
		speedStat: Attribute.SPELL_SPEED,
		icon: 'blm',
		colour: '#a579d6',
		role: 'MAGICAL_RANGED',
	},
	SUMMONER: {
		name: t('game.job.summoner')`Summoner`,
		speedStat: Attribute.SPELL_SPEED,
		icon: 'smn',
		colour: '#2d9b78',
		role: 'MAGICAL_RANGED',
	},
	RED_MAGE: {
		name: t('game.job.red-mage')`Red Mage`,
		speedStat: Attribute.SPELL_SPEED,
		icon: 'rdm',
		colour: '#e87b7b',
		role: 'MAGICAL_RANGED',
	},
	PICTOMANCER: {
		name: t('game.job.pictomancer')`Pictomancer`,
		speedStat: Attribute.SPELL_SPEED,
		icon: 'pct',
		colour: '#ffa2f1',
		role: 'MAGICAL_RANGED',
	},
	BLUE_MAGE: {
		name: t('game.job.blue-mage')`Blue Mage`,
		speedStat: Attribute.SPELL_SPEED,
		icon: 'blu',
		colour: '#3366ff',
		role: 'MAGICAL_RANGED',
	},
})

export type JobKey = keyof typeof JOBS
