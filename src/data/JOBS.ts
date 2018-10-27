import {i18nMark} from '@lingui/react'
import {SemanticCOLORS} from 'semantic-ui-react'

import {ActorType} from 'fflogs'
import {addExtraIndex} from 'utilities'

export interface Role {
	id: number
	i18n_id: string
	name: string
	colour: SemanticCOLORS
}

const roleData = {
	TANK: {
		id: 1,
		i18n_id: i18nMark('game.roles.tank'),
		name: 'Tank',
		colour: 'blue',
	},
	HEALER: {
		id: 2,
		i18n_id: i18nMark('game.roles.healer'),
		name: 'Healer',
		colour: 'green',
	},

	MELEE: {
		id: 3,
		i18n_id: i18nMark('game.roles.melee-dps'),
		name: 'Melee DPS',
		colour: 'red',
	},

	PHYSICAL_RANGED: {
		id: 4,
		i18n_id: i18nMark('game.roles.physical-ranged-dps'),
		name: 'Physical Ranged DPS',
		colour: 'red',
	},

	MAGICAL_RANGED: {
		id: 5,
		i18n_id: i18nMark('game.roles.magical-ranged-dps'),
		name: 'Magical Ranged DPS',
		colour: 'red',
	},

	// Not really roles but w/e
	OUTDATED: {
		id: 99,
		i18n_id: i18nMark('game.roles.outdated'),
		name: 'Outdated',
		colour: 'grey',
	},

	UNSUPPORTED: {
		id: 100,
		i18n_id: i18nMark('game.roles.unsupported'),
		name: 'Unsupported',
		colour: 'grey',
	},
}

export const ROLES = addExtraIndex(roleData as Record<keyof typeof roleData, Role>, 'id')

export interface Job {
	i18n_id: string
	name: string
	logType: ActorType
	icon: string
	colour: string
	role: Role['id']
}

// Yeah I know there's lots of repetition but they're all different apis and endpoints and shit and I don't wanna pull it apart later to fix a desync
const JOBS = {
	// Tank
	PALADIN: {
		i18n_id: i18nMark('game.job.paladin'),
		name: 'Paladin',
		logType: ActorType.PALADIN,
		icon: 'paladin',
		colour: '#a8d2e6',
		role: ROLES.TANK.id,
	},
	WARRIOR: {
		i18n_id: i18nMark('game.job.warrior'),
		name: 'Warrior',
		logType: ActorType.WARRIOR,
		icon: 'warrior',
		colour: '#cf2621',
		role: ROLES.TANK.id,
	},
	DARK_KNIGHT: {
		i18n_id: i18nMark('game.job.dark-knight'),
		name: 'Dark Knight',
		logType: ActorType.DARK_KNIGHT,
		icon: 'darkknight',
		colour: '#d126cc',
		role: ROLES.TANK.id,
	},

	// Healer
	WHITE_MAGE: {
		i18n_id: i18nMark('game.job.white-mage'),
		name: 'White Mage',
		logType: ActorType.WHITE_MAGE,
		icon: 'whitemage',
		colour: '#fff0dc',
		role: ROLES.HEALER.id,
	},
	SCHOLAR: {
		i18n_id: i18nMark('game.job.scholar'),
		name: 'Scholar',
		logType: ActorType.SCHOLAR,
		icon: 'scholar',
		colour: '#8657ff',
		role: ROLES.HEALER.id,
	},
	ASTROLOGIAN: {
		i18n_id: i18nMark('game.job.astrologian'),
		name: 'Astrologian',
		logType: ActorType.ASTROLOGIAN,
		icon: 'astrologian',
		colour: '#ffe74a',
		role: ROLES.HEALER.id,
	},

	// Melee
	MONK: {
		i18n_id: i18nMark('game.job.monk'),
		name: 'Monk',
		logType: ActorType.MONK,
		icon: 'monk',
		colour: '#d69c00',
		role: ROLES.MELEE.id,
	},
	DRAGOON: {
		i18n_id: i18nMark('game.job.dragoon'),
		name: 'Dragoon',
		logType: ActorType.DRAGOON,
		icon: 'dragoon',
		colour: '#4164cd',
		role: ROLES.MELEE.id,
	},
	NINJA: {
		i18n_id: i18nMark('game.job.ninja'),
		name: 'Ninja',
		logType: ActorType.NINJA,
		icon: 'ninja',
		colour: '#af1964',
		role: ROLES.MELEE.id,
	},
	SAMURAI: {
		i18n_id: i18nMark('game.job.samurai'),
		name: 'Samurai',
		logType: ActorType.SAMURAI,
		icon: 'samurai',
		colour: '#e46d04',
		role: ROLES.MELEE.id,
	},

	// Phys Ranged
	BARD: {
		i18n_id: i18nMark('game.job.bard'),
		name: 'Bard',
		logType: ActorType.BARD,
		icon: 'bard',
		colour: '#91ba5e',
		role: ROLES.PHYSICAL_RANGED.id,
	},
	MACHINIST: {
		i18n_id: i18nMark('game.job.machinist'),
		name: 'Machinist',
		logType: ActorType.MACHINIST,
		icon: 'machinist',
		colour: '#6ee1d6',
		role: ROLES.PHYSICAL_RANGED.id,
	},

	// Magic Ranged
	BLACK_MAGE: {
		i18n_id: i18nMark('game.job.black-mage'),
		name: 'Black Mage',
		logType: ActorType.BLACK_MAGE,
		icon: 'blackmage',
		colour: '#a579d6',
		role: ROLES.MAGICAL_RANGED.id,
	},
	SUMMONER: {
		i18n_id: i18nMark('game.job.summoner'),
		name: 'Summoner',
		logType: ActorType.SUMMONER,
		icon: 'summoner',
		colour: '#2d9b78',
		role: ROLES.MAGICAL_RANGED.id,
	},
	RED_MAGE: {
		i18n_id: i18nMark('game.job.red-mage'),
		name: 'Red Mage',
		logType: ActorType.RED_MAGE,
		icon: 'redmage',
		colour: '#e87b7b',
		role: ROLES.MAGICAL_RANGED.id,
	},
}

export default addExtraIndex(JOBS as Record<keyof typeof JOBS, Job>, 'logType')
