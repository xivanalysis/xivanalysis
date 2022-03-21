import {Actor} from 'report'
import {Compute} from 'utilities/typescript'

/*
Welcome to the *｡･ﾟ★｡ magic ☆ﾟ･｡° event file!
You're probably here to add your new fabricated event to the event type!
Don't. I'm a big meanie and _will_ block your PR.

Instead, you'll want to set it up from your module file, using declaration merging
(https://www.typescriptlang.org/docs/handbook/declaration-merging.html).
It'll look something like this:
```ts
declare module 'event' {
	interface EventTypeRepository {
		newEventType: FieldsInNewEventType
		otherNewEventType: FieldsButForTheOtherEventType
	}
}
```

Doing the above will automatically merge it into the `Event` type exported below,
making it available and discoverable throughout the rest of the parser.
*/

/**
 * Declaration merge target. You don't want to use this directly unless you are
 * declaring a new type of event. If you're importing this, you're doing it wrong.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface,import/export
export interface EventTypeRepository {}

/** Event fields with merged type discrimination field. */
type E<T, S> = {type: T} & S

/** For each field of interface T, merge the key into the value as a discrimation field. */
type MergeType<T> = {
	[K in keyof T]: E<K, T[K]>
}

/**
 * Object type of every event type declared throughout the application.
 * To access a specific type, use `Events['eventType']`.
 */
export type Events = MergeType<EventTypeRepository>
/** Union of every event type declared throughout the application. */
export type Event = Events[keyof EventTypeRepository]

// -----
// #region Core xivanalysis parser event definitions.
// -----

/** Fields shared by every event. */
export interface FieldsBase {
	/** Timestamp of the event, in ms since unix epoch. */
	timestamp: number
}

/** Fields shared by events that travel between two actors. */
export interface FieldsTargeted extends FieldsBase {
	/** Actor ID of the source of this event. */
	source: Actor['id']
	/** Actor ID of the target of this event. */
	target: Actor['id']
}

export interface FieldsMultiTargeted extends FieldsBase {
	/** Actor ID of the source of this event */
	source: Actor['id']
	/** Array of targets of this event
	 * Interfaces that extend this should merge additional properties into this array
	 */
	targets: Array<{ target: Actor['id'] }>
}

/** An actor has begun preparing an action with a cast time. */
interface EventPrepare extends FieldsTargeted {
	/** XIV Action ID */
	action: number
}

/** An actor's cast has been interrupted in some manner. */
interface EventInterrupt extends FieldsTargeted {
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
	/** If this status is a shield, the amount that was remaining unabsorbed when the shield expired */
	remainingShield?: number
}

/** The server has confirmed the execution of an action on its target. */
interface EventExecute extends FieldsTargeted {
	/** XIV Action ID */
	action: number
	/** Unique numeric ID that will match the execution to each of the actions that caused it. */
	sequence: number
}

/** The cause of an effect. */
export type Cause =
	| {type: 'action', action: number}
	| {type: 'status', status: number}

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

type MergeArrays<T> = T extends unknown[] ? Array<Compute<T[number]>> : never

/** An actor has taken damage. */
interface EventDamage extends FieldsMultiTargeted {
	/** Cause of this damage. */
	cause: Cause
	/** Unique numeric ID that will match this damage to its execution confirmation. If omitted, no confirmation will occur (status ticks, etc). */
	sequence?: number
	/** Effects on each target */
	targets: MergeArrays<FieldsMultiTargeted['targets'] & Array<{
		/** Total amount of damage dealt. */
		amount: number
		/** Amount of total damage that was overkill. */
		overkill: number
		/** Source damage modifier. */
		sourceModifier: SourceModifier
		/** Target damage modifier. */
		targetModifier: TargetModifier
		/** Bonus multiplier on the damage from which positionals can be inferred */
		bonusPercent: number
	}>>
}

/** An actor has been healed. */
interface EventHeal extends FieldsMultiTargeted {
	/** Cause of this heal. */
	cause: Cause
	/** Unique numeric ID that will match this heal to its execution confirmation. If omitted, no confirmation will occur (status ticks, etc). */
	sequence?: number
	/** Effects on each target */
	targets: MergeArrays<FieldsMultiTargeted['targets'] & Array<{
		/** Total amount of healing administered. */
		amount: number
		/** Amount of total healing that was overheal. */
		overheal: number
		/** Source healing modifier. */
		sourceModifier: SourceModifier
	}>>
}

/** Status of a single numeric resource. */
export interface Resource {
	maximum: number
	current: number
}

/** Position of an actor. */
export interface Position {
	x: number
	y: number
	bearing: number
}

export enum Attribute {
	SKILL_SPEED,
	SPELL_SPEED,
}

/** Actor attribute (stat value) */
export interface AttributeValue {
	attribute: Attribute
	value: number
	estimated: boolean
}

/** An actors parameters have been updated. */
interface EventActorUpdate extends FieldsBase {
	/** ID of the updated actor. */
	actor: Actor['id']
	/** Updated HP status. */
	hp?: Partial<Resource>
	/** Updated MP status. */
	mp?: Partial<Resource>
	/** Updated position. */
	position?: Partial<Position>
	/** Current targetability. */
	targetable?: boolean
	/** Current attributes (stats) */
	attributes?: AttributeValue[]
}

// Merge core events into the repository.
// No declare module, as we're in the same file as the root repository.
// eslint-disable-next-line import/export
export interface EventTypeRepository {
	prepare: EventPrepare
	interrupt: EventInterrupt
	action: EventAction
	statusApply: EventStatusApply
	statusRemove: EventStatusRemove
	execute: EventExecute
	damage: EventDamage
	heal: EventHeal
	actorUpdate: EventActorUpdate
}

// -----
// #endregion
// ----
