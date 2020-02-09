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
	GUNBREAKER = 'Gunbreaker', // TODO: CONFIRM
	WHITE_MAGE = 'WhiteMage',
	SCHOLAR = 'Scholar',
	ASTROLOGIAN = 'Astrologian',
	MONK = 'Monk',
	DRAGOON = 'Dragoon',
	NINJA = 'Ninja',
	SAMURAI = 'Samurai',
	BARD = 'Bard',
	MACHINIST = 'Machinist',
	DANCER = 'Dancer', // TODO: CONFIRM
	BLACK_MAGE = 'BlackMage',
	SUMMONER = 'Summoner',
	RED_MAGE = 'RedMage',
	BLUE_MAGE = 'BlueMage',
	LIMIT_BREAK = 'LimitBreak',

	// Pet
	PET = 'Pet',
}

export interface ActorFightInstance {
	id: Fight['id'],
	groups?: number,
	instances?: number,
}

interface BaseActor {
	guid: number
	id: number
	name: string
	type: ActorType
}

export interface Actor extends BaseActor {
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
	maxTP: number
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

export enum HitType {
	MISS = 0,
	NORMAL = 1,
	CRITICAL = 2,
	BLOCK = 4,
	DODGE = 7,
	// PARRY = 8, // Seems to be used for other games where parry is a missType?
	DEFLECT = 9,
	IMMUNE = 10,
	MISFIRE = 11,
	REFLECT = 12,
	EVADE = 13,
	RESIST = 14,
	// TODO: Tentative:
	PARRY = 20,
}

export interface Ability {
	abilityIcon: string
	guid: number
	name: string
	type: AbilityType
}

// Hell if I know. Seems to be used for 'Environment', and that's about it.
interface EventActor extends BaseActor {
	icon: string,
}

export interface Event {
	timestamp: number
	// TODO: Remove symbol types, they're just unessecary complication to the event handling system
	type: string | symbol

	source?: EventActor
	sourceID?: number
	sourceInstance?: number
	sourceIsFriendly: boolean
	target?: EventActor
	targetID?: number
	targetInstance?: number
	targetIsFriendly: boolean
}

// TODO: Remove once symbol types are removed
const hasStringType = <T extends Event>(event: T): event is T & {type: string} => typeof event.type === 'string'

export interface AbilityEvent extends Event {
	ability: Ability
}

interface EffectEvent extends AbilityEvent {
	hitType: HitType
	tick?: boolean

	guessAmount?: number
	expectedAmount?: number
	finalizedAmount?: number
	amount: number

	sourceResources?: ActorResources
	targetResources: ActorResources

	packetID?: number
	unpaired?: boolean

	simulated?: boolean
	actorPotencyRatio?: number
	expectedCritRate?: number
	directHitPercentage?: number
	debugMultiplier?: number
	multiplier?: number
}

export interface DeathEvent extends Event { type: 'death' }
export interface CastEvent extends AbilityEvent { type: 'begincast' | 'cast' }

export const isDamageEvent = (event: Event): event is DamageEvent => hasStringType(event) && event.type.includes('damage')
export interface DamageEvent extends EffectEvent {
	type: 'calculateddamage' | 'damage'
	overkill?: number
	absorbed: number
	multistrike?: boolean
	blocked?: number
}

export const isHealEvent = (event: Event): event is HealEvent => hasStringType(event) && event.type.includes('heal')
export interface HealEvent extends EffectEvent {
	type: 'calculatedheal' | 'heal'
	overheal: number
}

export const isApplyBuffEvent = (event: Event): event is BuffEvent => hasStringType(event) && event.type ==='applybuff'
export const isRemoveBuffEvent = (event: Event): event is BuffEvent => hasStringType(event) && event.type ==='removebuff'
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
// Misc
// -----

export enum ReportLanguage {
	JAPANESE = 'ja',
	ENGLISH = 'en',
	GERMAN = 'de',
	FRENCH = 'fr',
	KOREAN = 'kr',
	CHINESE = 'cn',

	// ???
	UNKNOWN = 'unknown',
}

// -----
// Direct API
// -----

export interface ReportFightsQuery {
	translate?: boolean,
	// This is only a thing when hitting an instance of @xivanalysis/server
	bypassCache?: boolean,
}

interface SharedReportFightsResponse {
	end: number
	owner: string
	start: number
	title: string
	zone: number
}

interface ProcessingReportFightsResponse extends SharedReportFightsResponse {
	exportedCharacters: unknown[]
	processing: true
}

export interface ProcessedReportFightsResponse extends SharedReportFightsResponse {
	enemies: Actor[]
	enemyPets: Pet[]
	fights: Fight[]
	friendlies: Actor[]
	friendlyPets: Pet[]
	lang: ReportLanguage
	phases: Phase[]
	processing?: false
}

export type ReportFightsResponse =
	| ProcessingReportFightsResponse
	| ProcessedReportFightsResponse

export interface ReportEventsQuery {
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

interface CorrectReportEventsResponse {
	events: Event[]
	nextPageTimestamp?: number
}

// Yes, really.
type MalformedReportEventsResponse = ''

export type ReportEventsResponse =
	| CorrectReportEventsResponse
	| MalformedReportEventsResponse
