import {Event, HitType, SourceModifier, TargetModifier} from '@xivanalysis/parser-core'
import React from 'react'

// chosen by fair dice roll.
// guaranteed to be random.
const EVENT_PREFIX = 1024

let nextOffset = 0

export interface Formatters {
	actor: (actorId: number) => React.ReactNode
	action: (actionId: number) => React.ReactNode
	status: (statusId: number) => React.ReactNode
}

interface EventTypeMeta<T extends Event.Base> {
	name: string,
	formatter?: (event: T, formatters: Formatters) => React.ReactNode
}

export const eventMeta = new Map<Event.Base['type'], EventTypeMeta<any>>()

export function registerEvent<T extends Event.Base>(meta: EventTypeMeta<T>) {
	const id = EVENT_PREFIX + nextOffset++
	eventMeta.set(id, meta)
	return id
}

// Set up meta for core events.
// NOTE: Do _not_ add your custom events here. Use `registerEvent` in your module file.
eventMeta.set(Event.Type.UNKNOWN, {
	name: 'Core/UNKNOWN',
	formatter: event => JSON.stringify(event.meta),
})

eventMeta.set(Event.Type.META, {
	name: 'Core/META',
	formatter: event => JSON.stringify(event.meta),
})

eventMeta.set(Event.Type.BEGIN_DUTY, {
	name: 'Core/BEGIN_DUTY',
	formatter: (event: Event.BeginDuty) => JSON.stringify(event.duty),
})

eventMeta.set(Event.Type.UPDATE_DUTY, {
	name: 'Core/UPDATE_DUTY',
	formatter: (event: Event.UpdateDuty) => JSON.stringify(event.changes),
})

eventMeta.set(Event.Type.END_DUTY, {
	name: 'Core/END_DUTY',
	formatter: (event: Event.EndDuty) => <>End of current duty.</>,
})

eventMeta.set(Event.Type.ADD_ACTOR, {
	name: 'Core/ADD_ACTOR',
	formatter: (event: Event.AddActor, {actor}: Formatters) =>
		<>{actor(event.actor.id)} is added to combat.</>,
	// TODO: Do I want to show resources and such here?
})

eventMeta.set(Event.Type.UPDATE_ACTOR, {
	name: 'Core/UPDATE_ACTOR',
	formatter: (event: Event.UpdateActor, {actor}: Formatters) =>
		<>{actor(event.actorId)} is updated with {JSON.stringify(event.changes)}.</>,
})

eventMeta.set(Event.Type.REMOVE_ACTOR, {
	name: 'Core/REMOVE_ACTOR',
	formatter: (event: Event.RemoveActor, {actor}: Formatters) =>
		<>{actor(event.actorId)} is removed from combat.</>,
})

eventMeta.set(Event.Type.DEATH, {
	name: 'Core/DEATH',
	formatter: (event: Event.Death, {actor}: Formatters) =>
		<>{actor(event.sourceId)} kills {actor(event.targetId)}.</>,
})

eventMeta.set(Event.Type.PREPARE, {
	name: 'Core/PREPARE',
	formatter: (event: Event.Prepare, {action, actor}: Formatters) =>
		<>{actor(event.sourceId)} prepares {action(event.actionId)} on {actor(event.targetId)}.</>,
})

eventMeta.set(Event.Type.ACTION, {
	name: 'Core/ACTION',
	formatter: (event: Event.Action, {action, actor}: Formatters) =>
		<>{actor(event.sourceId)} performs {action(event.actionId)} on {actor(event.targetId)}.</>,
})

eventMeta.set(Event.Type.DAMAGE, {
	name: 'Core/DAMAGE',
	formatter: (event: Event.Damage, {action, actor, status}: Formatters) => <>
		{event.hit.type === HitType.HIT
			? <>{action(event.hit.actionId)}</>
			: <>{status(event.hit.statusId)}</>
		}&nbsp;
		from {actor(event.sourceId)}&nbsp;
		{event.hit.type === HitType.HIT ? 'hits' : 'ticks on'}&nbsp;
		{actor(event.targetId)}&nbsp;
		for {event.amount} damage.&nbsp;
		({SourceModifier[event.sourceModifier]}, {TargetModifier[event.targetModifier]})
	</>,
})

eventMeta.set(Event.Type.HEAL, {
	name: 'Core/HEAL',
	formatter: (event: Event.Heal, {action, actor, status}: Formatters) => <>
		{event.hit.type === HitType.HIT
			? <>{action(event.hit.actionId)}</>
			: <>{status(event.hit.statusId)}</>
		}&nbsp;
		from {actor(event.sourceId)}&nbsp;
		heals {actor(event.targetId)}&nbsp;
		for {event.amount} HP.&nbsp;
		({SourceModifier[event.sourceModifier]})
	</>,
})

eventMeta.set(Event.Type.ADD_STATUS, {
	name: 'Core/ADD_STATUS',
	formatter: (event: Event.AddStatus, {actor, status}: Formatters) => <>
		{actor(event.sourceId)} applies&nbsp;
		{status(event.statusId)}{event.extra && ` (${event.extra})`}&nbsp;
		to {actor(event.targetId)}
		{event.duration && ` for ${event.duration} seconds.`}
	</>,
})

eventMeta.set(Event.Type.REMOVE_STATUS, {
	name: 'Core/REMOVE_STATUS',
	formatter: (event: Event.RemoveStatus, {actor, status}: Formatters) =>
		<>The {status(event.statusId)} applied by {actor(event.sourceId)} is removed from {actor(event.targetId)}</>,
})
