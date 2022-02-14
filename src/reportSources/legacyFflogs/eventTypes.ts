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
	UNKNOWN = 'Unknown', // ???

	// Friendly
	PALADIN = 'Paladin',
	WARRIOR = 'Warrior',
	DARK_KNIGHT = 'DarkKnight',
	GUNBREAKER = 'Gunbreaker',
	WHITE_MAGE = 'WhiteMage',
	SCHOLAR = 'Scholar',
	ASTROLOGIAN = 'Astrologian',
	SAGE = 'Sage',
	MONK = 'Monk',
	DRAGOON = 'Dragoon',
	NINJA = 'Ninja',
	SAMURAI = 'Samurai',
	REAPER = 'Reaper',
	BARD = 'Bard',
	MACHINIST = 'Machinist',
	DANCER = 'Dancer',
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
	absorb?: number
	mp: number
	maxMP: number
	tp: number
	maxTP: number
	x: number
	y: number
	facing?: number
}

// -----
// Event field data
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

// Used for inlined actors, typically those that are unranked / uncounted
export interface EventActor extends BaseActor {
	icon: string,
}

/** Fields potentially present on all fflogs events */
export interface BaseEventFields {
	timestamp: number

	source?: EventActor
	sourceID?: number
	sourceInstance?: number
	sourceIsFriendly: boolean
	target?: EventActor
	targetID?: number
	targetInstance?: number
	targetIsFriendly: boolean
}

/**
 * These will NEVER have source/target fields. Only extending so I don't cause
 * a massive ripple of broken types on a retrofit.
 */
interface EncounterFields extends BaseEventFields {
	timestamp: number
	encounterID: number
	name: string
	size: number
	difficulty?: number
}

/** Fields present on events caused by, or in relation to an "ability" being executed */
export interface AbilityEventFields extends BaseEventFields {
	ability: Ability
}

/** Fields present on events wherein a discrete effect has taken place */
interface EffectEventFields extends AbilityEventFields {
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
	multiplier?: number
	bonusPercent?: number
}

// -----
// Events
// -----

export interface EncounterStartEvent extends EncounterFields {
	type: 'encounterstart' | 'dungeonstart'
	affixes: unknown[]
	level: number
}

export interface EncounterEndEvent extends EncounterFields {
	type: 'encounterend' | 'dungeonend'
	completion?: number
	difficulty: number
	kill: boolean
	medal?: number
}

export interface DeathEvent extends BaseEventFields {
	type: 'death'
	ability?: Ability
}

/* These likewise do not have source/target fields */
export interface InstanceSealUpdateEvent extends BaseEventFields {
	type: 'instancesealupdate'
	placeID: number
	placeName: string
	sealType: number
}

export interface LimitBreakUpdateEvent extends BaseEventFields {
	type: 'limitbreakupdate'
	bars: number
	value: number
}

export interface ChecksumMismatchEvent extends BaseEventFields {
	type: 'checksummismatch'
	data: number
}

export interface ZoneChangeEvent extends BaseEventFields {
	type: 'zonechange'
	zoneDifficulty: number
	zoneID: number
	zoneName: string,
}

export interface WipeCalledEvent extends BaseEventFields {
	type: 'wipecalled'
}

export interface MapChangeEvent extends BaseEventFields {
	type: 'mapchange'
	mapID: number
	mapName: string
	mapFile?: unknown
}

export interface WorldMarkerPlacedEvent extends BaseEventFields {
	type: 'worldmarkerplaced'
	mapID: number
	x: number
	y: number
	icon: number
}

export interface WorldMarkerRemovedEvent extends BaseEventFields {
	type: 'worldmarkerremoved'
	icon: number
}

/* End no source/target */

export interface CombatantInfoAura {
	ability: number
	icon: string
	name: string
	source: number
	stacks: number
}

export interface CombatantInfoEvent extends BaseEventFields {
	type: 'combatantinfo'
	auras: CombatantInfoAura[]
	gear: [] // unused in xiv
	level: number

	// Only present on logger
	attack?: number
	attackMagicPotency?: number
	criticalHit?: number
	determination?: number
	dexterity?: number
	directHit?: number
	healMagicPotency?: number
	intelligence?: number
	mind?: number
	piety?: number
	skillSpeed?: number
	spellSpeed?: number
	strength?: number
	tenacity?: number
	vitality?: number
}

export interface UnknownEvent extends AbilityEventFields {
	type: 'unknown'
}

export interface DispelEvent extends AbilityEventFields {
	type: 'dispel',
	extraAbility: Ability,
	isBuff: boolean,
}

export interface InterruptEvent extends AbilityEventFields {
	type: 'interrupt'
	extraAbility: Ability
}

const castEventTypes = [
	'begincast',
	'cast',
] as const
export const isCastEvent = (event: FflogsEvent): event is CastEvent =>
	(castEventTypes as readonly unknown[]).includes(event.type)
export interface CastEvent extends AbilityEventFields {
	type: typeof castEventTypes[number]
}

export interface BuffEvent extends AbilityEventFields {
	type:
		| 'applybuff'
		| 'applydebuff'
		| 'refreshbuff'
		| 'refreshdebuff'
		| 'removebuff'
		| 'removedebuff'
	absorb?: number
}

export interface BuffStackEvent extends AbilityEventFields {
	type:
		| 'applybuffstack'
		| 'applydebuffstack'
		| 'removebuffstack'
		| 'removedebuffstack'
	stack: number
}

export interface TargetabilityUpdateEvent extends AbilityEventFields {
	type: 'targetabilityupdate'
	targetable: 0 | 1
}

const damageEventTypes = [
	'calculateddamage',
	'damage',
] as const
export const isDamageEvent = (event: FflogsEvent): event is DamageEvent =>
	(damageEventTypes as readonly unknown[]).includes(event.type)
export interface DamageEvent extends EffectEventFields {
	type: typeof damageEventTypes[number]
	overkill?: number
	absorbed?: number
	multistrike?: boolean
	blocked?: number
}

// Bruh.
export interface InstaKillEvent extends EffectEventFields {
	type: 'instakill'
	// Does not include "amount" and "hitType" fields.
}

// Could consider rolling into HealEvent if this ever gets used.
export interface AbsorbedEvent extends EffectEventFields {
	type: 'absorbed',
	attackerID: number,
	attackerIsFriendly: boolean,
	extraAbility: Ability
	fight: number,
	// Does not include "hitType" field.
}

const healEventTypes = [
	'calculatedheal',
	'heal',
] as const
export const isHealEvent = (event: FflogsEvent): event is HealEvent =>
	(healEventTypes as readonly unknown[]).includes(event.type)
export interface HealEvent extends EffectEventFields {
	type: typeof healEventTypes[number]
	overheal?: number
}

type EncounterEvent =
	| EncounterStartEvent
	| EncounterEndEvent

type EffectEvent =
	| DamageEvent
	| HealEvent
	| InstaKillEvent
	| AbsorbedEvent

export type AbilityEvent =
	| EffectEvent
	| CastEvent
	| BuffEvent
	| BuffStackEvent
	| TargetabilityUpdateEvent
	| DispelEvent
	| InterruptEvent

export type FflogsEvent =
	| EncounterEvent
	| AbilityEvent
	| DeathEvent
	| LimitBreakUpdateEvent
	| ChecksumMismatchEvent
	| ZoneChangeEvent
	| UnknownEvent
	| WipeCalledEvent
	| WorldMarkerPlacedEvent
	| WorldMarkerRemovedEvent
	| MapChangeEvent
	| CombatantInfoEvent
	| InstanceSealUpdateEvent

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
	enemies?: undefined
	enemyPets?: undefined
	fights?: undefined
	friendlies?: undefined
	friendlyPets?: undefined
	lang?: undefined
	phases?: undefined
	processing?: true
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
	events: FflogsEvent[]
	nextPageTimestamp?: number
}

// Yes, really.
type MalformedReportEventsResponse = string

export type ReportEventsResponse =
	| CorrectReportEventsResponse
	| MalformedReportEventsResponse
