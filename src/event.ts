import {Actor} from 'report'

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
}

// Merge core events into the repository.
// No declare module, as we're in the same file as the root repository.
// eslint-disable-next-line import/export
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

// -----
// #endregion
// ----
