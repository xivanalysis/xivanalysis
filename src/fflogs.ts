import {AxiosRequestConfig} from 'axios'

// -----
// Fight
// -----

export interface Fight {
	id: number

	boss: number
	name: string
	zoneID: number
	zoneName: string
	lastPhaseForPercentageDisplay?: number

	difficulty?: number
	bossPercentage?: number
	fightPercentage?: number
	kill?: boolean
	partial?: number
	size?: number
	standardComposition?: boolean

	start_time: number
	end_time: number
}

export interface Phase {
	boss: Fight['boss']
	phases: string[]
}

// -----
// Actors
// -----

export enum ActorType {
	// Enemy
	BOSS = 'Boss',
	NPC = 'NPC',

	// Friendly
	PALADIN = 'Paladin',
	WARRIOR = 'Warrior',
	DARK_KNIGHT = 'DarkKnight',
	WHITE_MAGE = 'WhiteMage',
	SCHOLAR = 'Scholar',
	ASTROLOGIAN = 'Astrologian',
	MONK = 'Monk',
	DRAGOON = 'Dragoon',
	NINJA = 'Ninja',
	SAMURAI = 'Samurai',
	BARD = 'Bard',
	MACHINIST = 'Machinist',
	BLACK_MAGE = 'BlackMage',
	SUMMONER = 'Summoner',
	RED_MAGE = 'RedMage',
	LIMIT_BREAK = 'LimitBreak',

	// Pet
	PET = 'Pet',
}

export interface ActorFightInstance {
	id: Fight['id'],
	groups?: number,
	instances?: number,
}

export interface Actor {
	guid: number
	id: number
	name: string
	type: ActorType
	fights: ActorFightInstance[]
}

export interface Pet extends Actor {
	petOwner: Actor['id']
}

export interface ActorResources {
	hitPoints: number
	maxHitPoints: number
	mp: number
	maxMP: number
	tp: number
	maxTp: number
	x: number
	y: number
}

// -----
// Events
// -----

export enum AbilityType {
	PHYSICAL_DOT = 1,
	HEAL = 8,
	SPECIAL = 32,
	MAGICAL_DOT = 64,
	PHYSICAL_DIRECT = 128,
	LIMIT_BREAK = 256,
	MAGICAL_DIRECT = 1024,
}

export interface Ability {
	abilityIcon: string
	guid: number
	name: string
	type: AbilityType
}

export interface Event {
	timestamp: number
	type: string | symbol

	sourceID: number
	sourceIsFriendly: boolean
	targetID: number
	targetInstance: number
	targetIsFriendly: boolean
}

export interface AbilityEvent extends Event {
	ability: Ability
}

interface EffectEvent extends AbilityEvent {
	// TODO: HitType enum would be nice
	hitType: number
	tick?: boolean

	guessAmount?: number
	expectedAmount?: number
	finalizedAmount?: number
	amount: number

	sourceResources?: ActorResources
	targetResources: ActorResources

	simulated?: boolean
	actorPotencyRatio?: number
	expectedCritRate?: number
	directHitPercentage?: number
	debugMultiplier?: number
	multiplier?: number
}

export interface DeathEvent extends Event { type: 'death' }
export interface CastEvent extends AbilityEvent { type: 'begincast' | 'cast' }
export interface DamageEvent extends EffectEvent {
	type: 'damage'
	absorbed: number
	multistrike?: boolean
}
export interface HealEvent extends EffectEvent {
	type: 'heal'
	overheal: number
}
export interface BuffEvent extends AbilityEvent {
	type: (
		'applybuff' |
		'applydebuff' |
		'refreshbuff' |
		'refreshdebuff' |
		'removebuff' |
		'removedebuff'
	)
}
export interface BuffStackEvent extends AbilityEvent {
	type: (
		'applybuffstack' |
		'applydebuffstack' |
		'removebuffstack' |
		'removedebuffstack'
	)
	stack: number
}

// -----
// Direct API
// -----

export interface ReportFightsQuery extends AxiosRequestConfig {
	params?: {
		translate?: boolean,
	}
}

export interface ReportFightsResponse {
	end: number
	enemies: Actor[]
	enemyPets: Pet[]
	fights: Fight[]
	friendlies: Actor[]
	friendlyPets: Pet[]
	lang: string
	owner: string
	phases: Phase[]
	start: number
	title: string
	zone: number
}

export interface ReportEventsQuery extends AxiosRequestConfig {
	params?: {
		start?: number,
		end?: number,
		actorid?: Actor['id'],
		actorinstance?: number,
		actorclass?: ActorType,
		cutoff?: number,
		encounter?: Fight['boss'],
		wipes?: number,
		difficulty?: number,
		filter?: string,
		translate?: boolean,
	}
}

export interface ReportEventsResponse {
	events: Event[]
	nextPageTimestamp?: number
}
