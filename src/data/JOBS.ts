import {MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/core/macro'
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
		name: msg({id: 'game.roles.tank', message: 'Tank'}),
		colour: colors.tank,
	},

	HEALER: {
		id: 2,
		name: msg({id: 'game.roles.healer', message: 'Healer'}),
		colour: colors.healer,
	},

	MELEE: {
		id: 3,
		name: msg({id: 'game.roles.melee-dps', message: 'Melee DPS'}),
		colour: colors.dps,
	},

	PHYSICAL_RANGED: {
		id: 4,
		name: msg({id: 'game.roles.physical-ranged-dps', message: 'Physical Ranged DPS'}),
		colour: colors.dps,
	},

	MAGICAL_RANGED: {
		id: 5,
		name: msg({id: 'game.roles.magical-ranged-dps', message: 'Magical Ranged DPS'}),
		colour: colors.dps,
	},

	// Not really roles but w/e
	OUTDATED: {
		id: 99,
		name: msg({id: 'game.roles.outdated', message: 'Outdated'}),
		colour: colors.misc,
	},

	UNSUPPORTED: {
		id: 100,
		name: msg({id: 'game.roles.unsupported', message: 'Unsupported'}),
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
		name: msg({id: 'game.job.unknown', message: 'Unknown'}),
		speedStat: Attribute.SKILL_SPEED,
		icon: '?',
		colour: '#767676',
		role: 'UNSUPPORTED',
	},

	// Tank
	PALADIN: {
		name: msg({id: 'game.job.paladin', message: 'Paladin'}),
		speedStat: Attribute.SKILL_SPEED,
		icon: 'pld',
		colour: '#a8d2e6',
		role: 'TANK',
		usesMP: true,
	},
	WARRIOR: {
		name: msg({id: 'game.job.warrior', message: 'Warrior'}),
		speedStat: Attribute.SKILL_SPEED,
		icon: 'war',
		colour: '#cf2621',
		role: 'TANK',
	},
	DARK_KNIGHT: {
		name: msg({id: 'game.job.dark-knight', message: 'Dark Knight'}),
		speedStat: Attribute.SKILL_SPEED,
		icon: 'drk',
		colour: '#d126cc',
		role: 'TANK',
		usesMP: true,
	},
	GUNBREAKER: {
		name: msg({id: 'game.job.gunbreaker', message: 'Gunbreaker'}),
		speedStat: Attribute.SKILL_SPEED,
		icon: 'gnb',
		colour: '#796d30',
		role: 'TANK',
	},

	// Healer
	WHITE_MAGE: {
		name: msg({id: 'game.job.white-mage', message: 'White Mage'}),
		speedStat: Attribute.SPELL_SPEED,
		icon: 'whm',
		colour: '#fff0dc',
		role: 'HEALER',
	},
	SCHOLAR: {
		name: msg({id: 'game.job.scholar', message: 'Scholar'}),
		speedStat: Attribute.SPELL_SPEED,
		icon: 'sch',
		colour: '#8657ff',
		role: 'HEALER',
	},
	ASTROLOGIAN: {
		name: msg({id: 'game.job.astrologian', message: 'Astrologian'}),
		speedStat: Attribute.SPELL_SPEED,
		icon: 'ast',
		colour: '#ffe74a',
		role: 'HEALER',
	},
	SAGE: {
		name: msg({id: 'game.job.sage', message: 'Sage'}),
		speedStat: Attribute.SPELL_SPEED,
		icon: 'sge',
		colour: '#80a0f0',
		role: 'HEALER',
	},

	// Melee
	MONK: {
		name: msg({id: 'game.job.monk', message: 'Monk'}),
		speedStat: Attribute.SKILL_SPEED,
		icon: 'mnk',
		colour: '#d69c00',
		role: 'MELEE',
	},
	DRAGOON: {
		name: msg({id: 'game.job.dragoon', message: 'Dragoon'}),
		speedStat: Attribute.SKILL_SPEED,
		icon: 'drg',
		colour: '#4164cd',
		role: 'MELEE',
	},
	NINJA: {
		name: msg({id: 'game.job.ninja', message: 'Ninja'}),
		speedStat: Attribute.SKILL_SPEED,
		icon: 'nin',
		colour: '#af1964',
		role: 'MELEE',
	},
	SAMURAI: {
		name: msg({id: 'game.job.samurai', message: 'Samurai'}),
		speedStat: Attribute.SKILL_SPEED,
		icon: 'sam',
		colour: '#e46d04',
		role: 'MELEE',
	},
	REAPER: {
		name: msg({id: 'game.job.reaper', message: 'Reaper'}),
		speedStat: Attribute.SKILL_SPEED,
		icon: 'rpr',
		colour: '#965a90',
		role: 'MELEE',
	},
	VIPER: {
		name: msg({id: 'game.job.viper', message: 'Viper'}),
		speedStat: Attribute.SKILL_SPEED,
		icon: 'vpr',
		colour: '#30a230',
		role: 'MELEE',
	},

	// Phys Ranged
	BARD: {
		name: msg({id: 'game.job.bard', message: 'Bard'}),
		speedStat: Attribute.SKILL_SPEED,
		icon: 'brd',
		colour: '#91ba5e',
		role: 'PHYSICAL_RANGED',
	},
	MACHINIST: {
		name: msg({id: 'game.job.machinist', message: 'Machinist'}),
		speedStat: Attribute.SKILL_SPEED,
		icon: 'mch',
		colour: '#6ee1d6',
		role: 'PHYSICAL_RANGED',
	},
	DANCER: {
		name: msg({id: 'game.job.dancer', message: 'Dancer'}),
		speedStat: Attribute.SKILL_SPEED,
		icon: 'dnc',
		colour: '#e2b0af',
		role: 'PHYSICAL_RANGED',
	},

	// Magic Ranged
	BLACK_MAGE: {
		name: msg({id: 'game.job.black-mage', message: 'Black Mage'}),
		speedStat: Attribute.SPELL_SPEED,
		icon: 'blm',
		colour: '#a579d6',
		role: 'MAGICAL_RANGED',
	},
	SUMMONER: {
		name: msg({id: 'game.job.summoner', message: 'Summoner'}),
		speedStat: Attribute.SPELL_SPEED,
		icon: 'smn',
		colour: '#2d9b78',
		role: 'MAGICAL_RANGED',
	},
	RED_MAGE: {
		name: msg({id: 'game.job.red-mage', message: 'Red Mage'}),
		speedStat: Attribute.SPELL_SPEED,
		icon: 'rdm',
		colour: '#e87b7b',
		role: 'MAGICAL_RANGED',
	},
	PICTOMANCER: {
		name: msg({id: 'game.job.pictomancer', message: 'Pictomancer'}),
		speedStat: Attribute.SPELL_SPEED,
		icon: 'pct',
		colour: '#ffa2f1',
		role: 'MAGICAL_RANGED',
	},
	BLUE_MAGE: {
		name: msg({id: 'game.job.blue-mage', message: 'Blue Mage'}),
		speedStat: Attribute.SPELL_SPEED,
		icon: 'blu',
		colour: '#3366ff',
		role: 'MAGICAL_RANGED',
	},
})

export type JobKey = keyof typeof JOBS
