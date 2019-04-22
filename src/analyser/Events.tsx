import {Events, HitType, SourceModifier, TargetModifier} from '@xivanalysis/parser-core'
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

interface EventTypeMeta<T extends Events.Base> {
	name: string,
	formatter?: (event: T, formatters: Formatters) => React.ReactNode
}

export const eventMeta = new Map<Events.Base['type'], EventTypeMeta<any>>()

export function registerEvent<T extends Events.Base>(meta: EventTypeMeta<T>) {
	const id = EVENT_PREFIX + nextOffset++
	eventMeta.set(id, meta)
	return id
}

// Set up meta for core events.
// NOTE: Do _not_ add your custom events here. Use `registerEvent` in your module file.
eventMeta.set(Events.Type.UNKNOWN, {
	name: 'Core/UNKNOWN',
	formatter: event => JSON.stringify(event.meta),
})

eventMeta.set(Events.Type.META, {
	name: 'Core/META',
	formatter: event => JSON.stringify(event.meta),
})

eventMeta.set(Events.Type.ADD_ACTOR, {
	name: 'Core/ADD_ACTOR',
	formatter: (event: Events.AddActor, {actor}: Formatters) =>
		<>{actor(event.actor.id)} is added to combat.</>,
	// TODO: Do I want to show resources and such here?
})

eventMeta.set(Events.Type.UPDATE_ACTOR, {
	name: 'Core/UPDATE_ACTOR',
	formatter: (event: Events.UpdateActor, {actor}: Formatters) =>
		<>{actor(event.actorId)} is updated with {JSON.stringify(event.changes)}.</>,
})

eventMeta.set(Events.Type.REMOVE_ACTOR, {
	name: 'Core/REMOVE_ACTOR',
	formatter: (event: Events.RemoveActor, {actor}: Formatters) =>
		<>{actor(event.actorId)} is removed from combat.</>,
})

eventMeta.set(Events.Type.DEATH, {
	name: 'Core/DEATH',
	formatter: (event: Events.Death, {actor}: Formatters) =>
		<>{actor(event.sourceId)} kills {actor(event.targetId)}.</>,
})

eventMeta.set(Events.Type.PREPARE, {
	name: 'Core/PREPARE',
	formatter: (event: Events.Prepare, {action, actor}: Formatters) =>
		<>{actor(event.sourceId)} prepares {action(event.actionId)} on {actor(event.targetId)}.</>,
})

eventMeta.set(Events.Type.ACTION, {
	name: 'Core/ACTION',
	formatter: (event: Events.Action, {action, actor}: Formatters) =>
		<>{actor(event.sourceId)} performs {action(event.actionId)} on {actor(event.targetId)}.</>,
})

eventMeta.set(Events.Type.DAMAGE, {
	name: 'Core/DAMAGE',
	formatter: (event: Events.Damage, {action, actor, status}: Formatters) => <>
		{actor(event.sourceId)}'s&nbsp;
		{event.hitType === HitType.HIT
			? <>{action(event.actionId)} hits</>
			: <>{status(event.statusId)} ticks on</>
		}&nbsp;
		{actor(event.targetId)}&nbsp;
		for {event.amount} damage.&nbsp;
		({SourceModifier[event.sourceModifier]}, {TargetModifier[event.targetModifier]})
	</>,
})

eventMeta.set(Events.Type.HEAL, {
	name: 'Core/HEAL',
	formatter: (event: Events.Heal, {action, actor, status}: Formatters) => <>
		{actor(event.sourceId)}'s&nbsp;
		{event.hitType === HitType.HIT
			? <>{action(event.actionId)}</>
			: <>{status(event.statusId)}</>
		}&nbsp;
		heals {actor(event.targetId)}&nbsp;
		for {event.amount} HP.&nbsp;
		({SourceModifier[event.sourceModifier]})
	</>,
})

eventMeta.set(Events.Type.ADD_STATUS, {
	name: 'Core/ADD_STATUS',
	formatter: (event: Events.AddStatus, {actor, status}: Formatters) => <>
		{actor(event.sourceId)} applies&nbsp;
		{status(event.statusId)}{event.extra && ` (${event.extra})`}&nbsp;
		to {actor(event.targetId)}
		{event.duration && ` for ${event.duration} seconds.`}
	</>,
})

eventMeta.set(Events.Type.REMOVE_STATUS, {
	name: 'Core/REMOVE_STATUS',
	formatter: (event: Events.RemoveStatus, {actor, status}: Formatters) =>
		<>{actor(event.sourceId)}'s {status(event.statusId)} is removed from {actor(event.targetId)}</>,
})
