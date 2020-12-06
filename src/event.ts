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

/** Fields shared by every event. */
interface FieldsBase {
	/** Timestamp of the event, in ms since unix epoch. */
	timestamp: number
}

/** Fields shared by events that travel between two actors. */
interface FieldsTargeted extends FieldsBase {
	/** Actor ID of the source of this event. */
	source: Actor['id']
	/** Actor ID of the target of this event. */
	target: Actor['id']
}

/** An actor has begun preparing an action with a cast time. */
interface EventPrepare extends FieldsTargeted {
	/** XIV Action ID */
	action: number
}

/** An actor has executed an action. */
interface EventAction extends FieldsTargeted {
	/** XIV Action ID */
	action: number
}

/** A status has been applied to an actor. */
interface EventStatusApply extends FieldsTargeted {
	/** XIV Status ID */
	status: number
	/** Duration of the status effect, if any and known. If not present, lasts until explicitly removed. */
	duration?: number
	/** Extra data associated with the status. Meaning of value, if any, is dependant on the status. */
	data?: number
}

/** A status has been removed or expired from an actor. */
interface EventStatusRemove extends FieldsTargeted {
	/** XIV Status ID */
	status: number
}

/** The server has snapshot the effects of an action on its target. */
interface EventSnapshot extends FieldsTargeted {
	/** XIV Action ID */
	action: number
	/** Unique numeric ID that will match the snapshot to each of the resulting effects. */
	sequence: number
}

/** The cause of an effect. */
export type Cause =
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

/** Calculation modifiers stemming from the source of the effect. */
export enum SourceModifier {
	NORMAL,
	MISS,
	CRITICAL,
	DIRECT,
	CRITICAL_DIRECT,
}

/** Calculation modifiers stemming from the target of the effect. */
export enum TargetModifier {
	NORMAL,
	PARRY,
	BLOCK,
	DODGE,
	INVULNERABLE,
	// TODO: Reflect?
}

/** An actor has taken damage. */
interface EventDamage extends FieldsTargeted {
	/** Cause of this damage. */
	cause: Cause
	/** Total amount of damage dealt. */
	amount: number
	/** Amount of total damage that was overkill. */
	overkill: number
	/** Unique numeric ID that will match this damage to the snapshot it stems from. If omitted, no snapshot was performed (status ticks, etc). */
	sequence?: number
	/** Overarching type of damage dealt. */
	attackType: AttackType
	/** Elemental aspect of damage dealt. */
	aspect: Aspect
	// TODO: Are these exclusive? Merge?
	/** Source damage modifier. */
	sourceModifier: SourceModifier
	/** Target damage modifier. */
	targetModifier: TargetModifier
}

/** An actor has been healed. */
interface EventHeal extends FieldsTargeted {
	/** Cause of this heal. */
	cause: Cause
	/** Total amount of healing administered. */
	amount: number
	/** Amount of total healing that was overheal. */
	overheal: number
	/** Unique numeric ID that will match this heal to the snapshot it stems from. If omitted, no snapshot was performed (status ticks, etc). */
	sequence?: number
	/** Source healing modifier. */
	sourceModifier: SourceModifier
}

/** Status of a single numeric resource. */
interface Resource {
	maximum?: number
	current?: number
}

/** Position of an actor. */
interface Position {
	x: number
	y: number
}

/** An actors parameters have been updated. */
interface EventActorUpdate extends FieldsBase {
	/** ID of the updated actor. */
	actor: Actor['id']
	/** Updated HP status. */
	hp?: Resource
	/** Updated MP status. */
	mp?: Resource
	/** Updated position. */
	position?: Position
	/** Current targetability. */
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
