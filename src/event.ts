import {Actor} from 'report'

// TODO DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS DOCS

// tslint:disable-next-line no-empty-interface
export interface EventTypeRepository {}

// Shorthand named type to clean up the type rendered by Event
// TODO: better name
type E<T, S> = {type: T} & S

type MergeType<T> = {
	[K in keyof T]: E<K, T[K]>
}

export type Events = MergeType<EventTypeRepository>
export type Event = Events[keyof EventTypeRepository]



// -------------------
// TODO: Need to work out where the base event structure is going to live - presumably not here.
// -------------------

interface FieldsBase {
	timestamp: number
}

interface FieldsTargeted extends FieldsBase {
	source: Actor['id']
	target: Actor['id']
}

interface EventPrepare extends FieldsTargeted {
	action: number
}

interface EventAction extends FieldsTargeted {
	action: number
}

interface EventStatusApply extends FieldsTargeted {
	status: number
	duration?: number
	data?: number
}

interface EventStatusRemove extends FieldsTargeted {
	status: number
}

interface EventSnapshot extends FieldsTargeted {
	action: number
	sequence: number
}

export type Hit =
	| {type: 'action', action: number}
	| {type: 'status', status: number}

// TODO: do i even want to keep this and aspect?
// it's in the game data under the action id, and fflogs doesn't
// expose sanely.
enum AttackType {
	UNKNOWN, // ?
	SLASHING,
	PIERCING,
	BLUNT,
	MAGIC,
	BREATH,
	PHYSICAL,
	LIMIT_BREAK,
}

// unaspected -> damage, none -> no damage
enum Aspect {
	NONE, // ?
	FIRE, // 1
	ICE, // 2
	WIND, // 3
	EARTH, // 4
	LIGHTNING, // 5
	WATER, // 6
	UNASPECTED, // 7?
}

export enum SourceModifier {
	NORMAL,
	MISS,
	CRITICAL,
	DIRECT,
	CRITICAL_DIRECT,
}

export enum TargetModifier {
	NORMAL,
	PARRY,
	BLOCK,
	DODGE,
	INVULNERABLE,
	// TODO: Reflect?
}

interface EventDamage extends FieldsTargeted {
	hit: Hit
	amount: number
	overkill: number // applied damage = amount - overkill
	sequence?: number
	attackType: AttackType
	aspect: Aspect
	// TODO: Are these exclusive? Merge?
	sourceModifier: SourceModifier
	targetModifier: TargetModifier
}

interface EventHeal extends FieldsTargeted {
	hit: Hit
	amount: number
	overheal: number
	sequence?: number
	sourceModifier: SourceModifier
}

interface Resource {
	maximum?: number
	current?: number
}

interface Position {
	x: number
	y: number
}

interface EventActorUpdate extends FieldsBase {
	actor: Actor['id']
	hp?: Resource
	mp?: Resource
	position?: Position
	targetable?: boolean
}

// decl mod
export interface EventTypeRepository {
	prepare: EventPrepare
	action: EventAction
	statusApply: EventStatusApply
	statusRemove: EventStatusRemove
	snapshot: EventSnapshot
	damage: EventDamage
	heal: EventHeal
	actorUpdate: EventActorUpdate
}
