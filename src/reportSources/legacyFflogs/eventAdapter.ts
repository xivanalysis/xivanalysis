import * as Sentry from '@sentry/browser'
import {STATUS_ID_OFFSET} from 'data/STATUSES'
import {Event, Events, Cause, SourceModifier, TargetModifier} from 'event'
import {ActorResources, BuffEvent, BuffStackEvent, CastEvent, DamageEvent, DeathEvent, EventActor, FflogsEvent, HealEvent, HitType, TargetabilityUpdateEvent} from 'fflogs'
import {Actor, Report} from 'report'
import {isDefined} from 'utilities'

/** Mapping from FFLogs hit types to source-originating modifiers. */
const sourceHitType: Partial<Record<HitType, SourceModifier>> = {
	[HitType.MISS]: SourceModifier.MISS,
	[HitType.CRITICAL]: SourceModifier.CRITICAL,
	// Marking dodge as miss 'cus it seems to be mis-used as such on fflogs
	[HitType.DODGE]: SourceModifier.MISS,
}

/** Mapping from FFLogs hit types to target-originating modifiers. */
const targetHitType: Partial<Record<HitType, TargetModifier>> = {
	[HitType.BLOCK]: TargetModifier.BLOCK,
	[HitType.PARRY]: TargetModifier.PARRY,
	[HitType.IMMUNE]: TargetModifier.INVULNERABLE,
}

/** Adapt an array of FFLogs APIv1 events to xiva representation. */
export function adaptEvents(report: Report, events: FflogsEvent[]): Event[] {
	const adapter = new EventAdapter({report})
	return adapter.adaptEvents(events)
}

class EventAdapter {
	/** xiva report representation. */
	private report: Report

	/** Set of event types marked as unhandled. Used to prevent duplicate warnings. */
	private unhandledTypes = new Set<FflogsEvent['type']>()

	constructor(opts: {report: Report}) {
		this.report = opts.report
	}

	adaptEvents(events: FflogsEvent[]): Event[] {
		return events
			.flatMap(event => this.adaptEvent(event))
			.filter(isDefined)
	}

	/** Adapt an FFLogs APIv1 event to xiva representation if any. */
	private adaptEvent(event: FflogsEvent): Event | Event[] | undefined {
		switch (event.type) {
		case 'begincast':
		case 'cast':
			return this.adaptCastEvent(event)

		case 'calculateddamage':
		case 'calculatedheal':
			return this.adaptSnapshotEvent(event)

		case 'damage':
			return this.adaptDamageEvent(event)

		case 'heal':
			return this.adaptHealEvent(event)

		case 'applybuff':
		case 'applydebuff':
		case 'refreshbuff':
		case 'refreshdebuff':
			return this.adaptStatusApplyEvent(event)

		// TODO: Due to FFLogs™️ Quality™️, this effectively results in a double application
		// of every stacked status. Probably should resolve that out.
		case 'applybuffstack':
		case 'applydebuffstack':
		case 'removebuffstack':
		case 'removedebuffstack':
			return this.adaptStatusApplyDataEvent(event)

		case 'removebuff':
		case 'removedebuff':
			return this.adaptStatusRemoveEvent(event)

		case 'death':
			return this.adaptDeathEvent(event)

		case 'targetabilityupdate':
			return this.adaptTargetableEvent(event)

		/* eslint-disable no-fallthrough */
		// Dispels are already modelled by other events, and aren't something we really care about
		case 'dispel':
		// Encounter events don't expose anything particularly useful for us
		case 'encounterstart':
		case 'encounterend':
		// We don't have much need for limit break, at least for now
		case 'limitbreakupdate':
		// We are _technically_ limiting down to a single zone, so any zonechange should be fluff
		case 'zonechange':
		// Not My Problem™️
		case 'checksummismatch':
		// I mean if Kihra doesn't know, how am I supposed to?
		case 'unknown':
			break
		/* eslint-enable no-fallthrough */

		default:
			// Anything that reaches this point is unknown. If we've already notified, just noop
			const unknownEvent = event as any
			if (this.unhandledTypes.has(unknownEvent.type)) {
				break
			}

			// Report missing event types to sentry & mark as reported
			Sentry.withScope(scope => {
				scope.setExtras({
					report: this.report.meta.code,
					event,
				})
				Sentry.captureMessage(`adapter.fflogs.unhandled.${unknownEvent.type}`)
			})
			if (process.env.NODE_ENV === 'development') {
				console.warn(`Unhandled FFLogs event type "${unknownEvent.type}".`)
			}
			this.unhandledTypes.add(unknownEvent.type)
		}
	}

	private adaptCastEvent(event: CastEvent): Events['prepare' | 'action'] {
		return {
			...this.adaptTargetedFields(event),
			type: event.type === 'begincast' ? 'prepare' : 'action',
			action: event.ability.guid,
		}
	}

	private adaptSnapshotEvent(event: DamageEvent | HealEvent): Array<Events['snapshot' | 'actorUpdate']> {
		// Calc events should all have a packet ID for sequence purposes. Let sentry catch outliers.
		const sequence = event.packetID
		if (sequence == null) {
			throw new Error('Calculated damage event encountered with no packet ID.')
		}

		const newEvent: Events['snapshot'] = {
			...this.adaptTargetedFields(event),
			type: 'snapshot',
			action: event.ability.guid,
			sequence,
		}

		return [newEvent, ...this.buildActorUpdateResourceEvents(event)]
	}

	private adaptDamageEvent(event: DamageEvent): Array<Events['damage' | 'actorUpdate']> {
		// Calculate source modifier
		let sourceModifier = sourceHitType[event.hitType] ?? SourceModifier.NORMAL
		if (event.multistrike) {
			sourceModifier = sourceModifier === SourceModifier.CRITICAL
				? SourceModifier.CRITICAL_DIRECT
				: SourceModifier.DIRECT
		}

		// Build the new event
		const overkill = event.overkill ?? 0
		const newEvent: Events['damage'] = {
			...this.adaptTargetedFields(event),
			type: 'damage',
			cause: resolveCause(event.ability.guid),
			// fflogs subtracts overkill from amount, amend
			amount: event.amount + overkill,
			overkill,
			sequence: event.packetID,
			sourceModifier,
			targetModifier: targetHitType[event.hitType] ?? TargetModifier.NORMAL,
		}

		return [newEvent, ...this.buildActorUpdateResourceEvents(event)]
	}

	private adaptHealEvent(event: HealEvent): Array<Events['heal' | 'actorUpdate']> {
		const overheal = event.overheal ?? 0
		const newEvent: Events['heal'] = {
			...this.adaptTargetedFields(event),
			type: 'heal',
			cause: resolveCause(event.ability.guid),
			amount: event.amount + overheal,
			overheal,
			sequence: event.packetID,
			sourceModifier: sourceHitType[event.hitType] ?? SourceModifier.NORMAL,
		}

		return [newEvent, ...this.buildActorUpdateResourceEvents(event)]
	}

	private adaptStatusApplyEvent(event: BuffEvent | BuffStackEvent): Events['statusApply'] {
		return {
			...this.adaptTargetedFields(event),
			type: 'statusApply',
			status: resolveStatusId(event.ability.guid),
			// Omitting duration, as it's not exposed by fflogs in any way.
		}
	}

	private adaptStatusApplyDataEvent(event: BuffStackEvent): Events['statusApply'] {
		const newEvent = this.adaptStatusApplyEvent(event)
		newEvent.data = event.stack
		return newEvent
	}

	private adaptStatusRemoveEvent(event: BuffEvent): Events['statusRemove'] {
		return {
			...this.adaptTargetedFields(event),
			type: 'statusRemove',
			status: resolveStatusId(event.ability.guid),
		}
	}

	private buildActorUpdateResourceEvents(event: DamageEvent | HealEvent) {
		const {source, target} = resolveActorIds(event)

		const newEvents: Array<Events['actorUpdate']> = []

		if (event.targetResources) {
			newEvents.push(this.buildActorUpdateResourceEvent(target, event.targetResources, event))
		}

		if (event.sourceResources) {
			newEvents.push(this.buildActorUpdateResourceEvent(source, event.sourceResources, event))
		}

		return newEvents
	}

	private buildActorUpdateResourceEvent(
		actor: Actor['id'],
		resources: ActorResources,
		event: FflogsEvent,
	): Events['actorUpdate'] {
		// TODO: Do we want to bother tracking actor resources to prevent duplicate updates?
		return {
			...this.adaptBaseFields(event),
			type: 'actorUpdate',
			actor,
			hp: {current: resources.hitPoints, maximum: resources.maxHitPoints},
			mp: {current: resources.mp, maximum: resources.maxMP},
			position: {x: resources.x, y: resources.y},
		}
	}

	private adaptDeathEvent(event: DeathEvent): Events['actorUpdate'] {
		return {
			...this.adaptBaseFields(event),
			type: 'actorUpdate',
			actor: resolveActorId({
				id: event.targetID,
				instance: event.targetInstance,
				actor: event.target,
			}),
			hp: {current: 0},
			mp: {current: 0},
		}
	}

	private adaptTargetableEvent(event: TargetabilityUpdateEvent): Events['actorUpdate'] {
		return {
			...this.adaptBaseFields(event),
			type: 'actorUpdate',
			actor: resolveActorId({
				id: event.targetID,
				instance: event.targetInstance,
				actor: event.target,
			}),
			targetable: !!event.targetable,
		}
	}

	private adaptTargetedFields(event: FflogsEvent) {
		return {
			...this.adaptBaseFields(event),
			...resolveActorIds(event),
		}
	}

	private adaptBaseFields(event: FflogsEvent) {
		return {timestamp: this.report.timestamp + event.timestamp}
	}
}

const resolveActorIds = (event: FflogsEvent) => ({
	source: resolveActorId({
		id: event.sourceID,
		instance: event.sourceInstance,
		actor: event.source,
	}),
	target: resolveActorId({
		id: event.targetID,
		instance: event.targetInstance,
		actor: event.target,
	}),
})

const resolveActorId = (opts: {id?: number, instance?: number, actor?: EventActor}): Actor['id'] => {
	const id = (opts.id ?? opts.actor?.id ?? -1).toString()
	const instance = opts.instance ?? 1
	return instance > 1
		? `${id}:${instance}`
		: id
}

const resolveCause = (fflogsAbilityId: number): Cause =>
	fflogsAbilityId < STATUS_ID_OFFSET
		? {type: 'action', action: fflogsAbilityId}
		: {type: 'status', status: resolveStatusId(fflogsAbilityId)}

const resolveStatusId = (fflogsStatusId: number) =>
	fflogsStatusId - STATUS_ID_OFFSET
