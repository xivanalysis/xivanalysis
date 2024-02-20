import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {Cause, Event, Events, SourceModifier, TargetModifier} from 'event'
import React from 'react'
import {Actor, Pull} from 'report'
import {formatDuration} from 'utilities'

export interface EventFormatterOptions<E extends Event> {
	event: E,
	pull: Pull,
}
export type EventFormatter<E extends Event> =
	(event: EventFormatterOptions<E>) => React.ReactNode
export const eventFormatters = new Map<string, EventFormatter<Event>>()

/**
 * Register a formatter function for the specified event type. The formatter will
 * be used to provide human-readable text for that event type in the events view
 * output.
 *
 * @param type Type of event to register the formatter for.
 * @param formatter The formatter to register.
 */
export function registerEventFormatter<T extends keyof Events>(type: T, formatter: EventFormatter<Events[T]>) {
	if (eventFormatters.has(type)) {
		throw new Error(`Trying to register formatter for already-handled event type ${type}`)
	}
	eventFormatters.set(type, formatter as EventFormatter<Event>)
}

// -----
// #region Stock event formatters
// -----

const getActorName = (actorId: Actor['id'], actors: Actor[]) =>
	actors.find(actor => actor.id === actorId)?.name
	?? actorId

function formatCause(cause: Cause) {
	switch (cause.type) {
	case 'action': return <ActionLink id={cause.action}/>
	case 'status': return <StatusLink id={cause.status}/>
	default: return JSON.stringify(cause)
	}
}

function formatSourceModifier(modifier: SourceModifier) {
	switch (modifier) {
	case SourceModifier.NORMAL: return ''
	case SourceModifier.MISS: return ' Miss.'
	case SourceModifier.CRITICAL: return ' Critical hit!'
	case SourceModifier.DIRECT: return ' Direct hit!'
	case SourceModifier.CRITICAL_DIRECT: return ' Critical direct hit!'
	default: return ''
	}
}

function formatTargetModifier(modifier: TargetModifier) {
	switch (modifier) {
	case TargetModifier.NORMAL: return ''
	case TargetModifier.PARRY: return ' Parried.'
	case TargetModifier.BLOCK: return ' Blocked.'
	case TargetModifier.DODGE: return ' Dodged.'
	case TargetModifier.INVULNERABLE: return ' Invulnerable.'
	default: return ''
	}
}

registerEventFormatter('prepare', ({event, pull}) => <>
	{getActorName(event.source, pull.actors)}
	&nbsp;prepares <ActionLink id={event.action}/>
	&nbsp;on {getActorName(event.target, pull.actors)}
</>)

registerEventFormatter('interrupt', ({event, pull}) => <>
	{getActorName(event.source, pull.actors)}
	&nbsp;interrupts {getActorName(event.target, pull.actors)}'s
	&nbsp;<ActionLink id={event.action}/>
</>)

registerEventFormatter('action', ({event, pull}) => <>
	{getActorName(event.source, pull.actors)}
	&nbsp;uses <ActionLink id={event.action}/>
	&nbsp;on {getActorName(event.target, pull.actors)}
</>)

registerEventFormatter('statusApply', ({event, pull}) => <>
	{getActorName(event.source, pull.actors)}
	&nbsp;applies <StatusLink id={event.status}/>
	&nbsp;on {getActorName(event.target, pull.actors)}
	{event.duration != null && <>&nbsp;for {formatDuration(event.duration, {hideMinutesIfZero: true})}</>}
	{event.data != null && <>&nbsp;with data <code>{event.data}</code></>}
</>)

registerEventFormatter('statusRemove', ({event, pull}) => <>
	{getActorName(event.source, pull.actors)}'s
	&nbsp;<StatusLink id={event.status}/>
	&nbsp;fades from {getActorName(event.target, pull.actors)}
</>)

registerEventFormatter('execute', ({event, pull}) => <>
	{getActorName(event.source, pull.actors)}'s
	&nbsp;<ActionLink id={event.action}/>
	&nbsp;executes on {getActorName(event.target, pull.actors)}
	&nbsp;(seq: {event.sequence})
</>)

registerEventFormatter('damage', ({event, pull}) => <>
	{getActorName(event.source, pull.actors)}'s
	&nbsp;{formatCause(event.cause)}
	&nbsp;hits
	{
		event.targets.map(t => <>
			&nbsp;{getActorName(t.target, pull.actors)}
			&nbsp;for {t.amount} damage
			{t.overkill > 0 && <>,&nbsp;overkilling by {t.overkill}</>}.
			{formatSourceModifier(t.sourceModifier)}
			{formatTargetModifier(t.targetModifier)}
		</>)
	}
	{event.sequence && <>&nbsp;(seq: {event.sequence})</>}
</>)

registerEventFormatter('heal', ({event, pull}) => <>
	{getActorName(event.source, pull.actors)}'s
	&nbsp;{formatCause(event.cause)}
	&nbsp;heals&nbsp;
	{
		event.targets.map(t => <>
			&nbsp;{getActorName(t.target, pull.actors)}
			&nbsp;for {t.amount} HP
			{t.overheal > 0 && <>,&nbsp;overhealing by {t.overheal}</>}.
			{formatSourceModifier(t.sourceModifier)}
		</>)
	}
	{event.sequence && <>&nbsp;(seq: {event.sequence})</>}
</>)

registerEventFormatter('actorUpdate', ({event, pull}) => <>
	{getActorName(event.actor, pull.actors)} is updated.
	{event.hp != null && <>&nbsp;HP: {event.hp.current}/{event.hp.maximum}.</>}
	{event.mp != null && <>&nbsp;MP: {event.mp.current}/{event.mp.maximum}.</>}
	{event.position != null && <>&nbsp;Position: {event.position.x},{event.position.y}.</>}
	{event.targetable != null && <>&nbsp;{event.targetable ? 'Targetable' : 'Untargetable'}.</>}
</>)

registerEventFormatter('gaugeUpdate', ({event, pull}) => <>
	{getActorName(event.actor, pull.actors)}'s gauge is updated.&nbsp;
</>)

// -----
// #endregion
// -----
