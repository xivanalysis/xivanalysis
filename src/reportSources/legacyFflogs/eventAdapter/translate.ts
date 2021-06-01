import * as Sentry from '@sentry/browser'
import {Patch, PatchNumber} from 'data/PATCHES'
import {STATUS_ID_OFFSET} from 'data/STATUSES'
import {Event, Events, Cause, SourceModifier, TargetModifier} from 'event'
import {ActorResources, BuffEvent, BuffStackEvent, CastEvent, DamageEvent, DeathEvent, FflogsEvent, HealEvent, HitType, TargetabilityUpdateEvent} from 'fflogs'
import {Actor} from 'report'
import {resolveActorId} from '../base'
import {AdapterOptions, AdapterStep} from './base'

/*
NOTES:
- FFLogs uses an ID offset for statuses. It's currently handled throughout the application - once legacy handling is removed, we can safely contain the offset in the adaption.
- FFLogs re-attributes limit break results to a special actor, resulting in two actions (one from the original, one from fabricated), then all follow-up data being on the fabricated actor. We should adapt that back to the caster.
*/

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

/* eslint-disable @typescript-eslint/no-magic-numbers */
/** Mapping from FFLogs actions that are effect-only and don't map to a specific calculateddamage or calculatedheal event */
const EFFECT_ONLY_ACTIONS = new Set([
	1302, // Regeneration
	500000, // Combined DoTs
	500001, // Combined HoTs
])

/** Mapping from failed actions that are effect-only and don't map to a specific calculateddamage or calculatedheal event */
const FAILED_HITS = new Set([
	HitType.MISS,
	HitType.DODGE,
	HitType.IMMUNE,
	HitType.RESIST,
])
/* eslint-enable @typescript-eslint/no-magic-numbers */

// Calculated damage/heal events were not added to FF Logs until during 5.05 ish.
// To ensure the xiva event model remains sane, we patch up events to match them together.
const CALCULATED_DAMAGE_UPDATE: PatchNumber = '5.08'

/** Translate an FFLogs APIv1 event to the xiva representation, if any exists. */
export class TranslateAdapterStep extends AdapterStep {
	private unhandledTypes = new Set<string>()

	private falseSequence = 0
	private adaptEffectEvent: (event: DamageEvent | HealEvent) => Event[]
	private adaptDamageEvent: (event: DamageEvent) => Event[]
	private adaptHealEvent: (event: HealEvent) => Event[]

	constructor(opts: AdapterOptions) {
		super(opts)

		// TODO: Remove this logic in 6.0.
		const patch = new Patch(this.report.edition, this.report.timestamp/1000)
		const beforeCalculateDamageUpdate = patch.before(CALCULATED_DAMAGE_UPDATE)
		this.adaptEffectEvent = beforeCalculateDamageUpdate
			? this.adaptPreCalculatedEffectEvent
			: this.adaptPostCalculatedEffectEvent

		// While the above should be enough, we noop the calculated* events just in
		// case they slip through, to preserve event stream sanity.
		this.adaptDamageEvent = beforeCalculateDamageUpdate
			? this.adaptNothing
			: this.adaptPostCalculatedDamageEvent
		this.adaptHealEvent = beforeCalculateDamageUpdate
			? this.adaptNothing
			: this.adaptPostCalculatedHealEvent
	}

	adapt(baseEvent: FflogsEvent, _adaptedEvents: Event[]): Event[] {
		switch (baseEvent.type) {
		case 'begincast':
		case 'cast':
			return [this.adaptCastEvent(baseEvent)]

		case 'calculateddamage':
			return this.adaptDamageEvent(baseEvent)
		case 'calculatedheal':
			return this.adaptHealEvent(baseEvent)

		case 'damage':
		case 'heal':
			return this.adaptEffectEvent(baseEvent)

		case 'applybuff':
		case 'applydebuff':
		case 'refreshbuff':
		case 'refreshdebuff':
			return [this.adaptStatusApplyEvent(baseEvent)]

		// TODO: Due to FFLogs™️ Quality™️, this effectively results in a double application
		// of every stacked status. Probably should resolve that out.
		case 'applybuffstack':
		case 'applydebuffstack':
		case 'removebuffstack':
		case 'removedebuffstack':
			return [this.adaptStatusApplyDataEvent(baseEvent)]

		case 'removebuff':
		case 'removedebuff':
			return [this.adaptStatusRemoveEvent(baseEvent)]

		case 'death':
			return [this.adaptDeathEvent(baseEvent)]

		case 'targetabilityupdate':
			return [this.adaptTargetableEvent(baseEvent)]

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
		// New event type from unreleased (as of 2021/04/26) fflogs client. Doesn't contain anything useful.
		case 'wipecalled':
		// I mean if Kihra doesn't know, how am I supposed to?
		case 'unknown':
			break
			/* eslint-enable no-fallthrough */

		default: {
			// Anything that reaches this point is unknown. If we've already notified, just noop
			const unknownEvent = baseEvent as {type: string}
			if (this.unhandledTypes.has(unknownEvent.type)) {
				break
			}

			// Report missing event types to sentry & mark as reported
			Sentry.withScope(scope => {
				scope.setExtras({
					report: this.report.meta.code,
					event: baseEvent,
				})
				Sentry.captureMessage(`adapter.fflogs.unhandled.${unknownEvent.type}`)
			})
			if (process.env.NODE_ENV === 'development') {
				console.warn(`Unhandled FFLogs event type "${unknownEvent.type}".`)
			}
			this.unhandledTypes.add(unknownEvent.type)
		}
		}

		return []
	}

	private adaptNothing(_event: FflogsEvent): Event[] { return [] }

	private adaptCastEvent(event: CastEvent): Events['prepare' | 'action'] {
		return {
			...this.adaptTargetedFields(event),
			type: event.type === 'begincast' ? 'prepare' : 'action',
			action: event.ability.guid,
		}
	}

	private adaptPreCalculatedEffectEvent(event: DamageEvent | HealEvent): Event[] {
		// Adapt the event into the primary effect event
		let adaptedEvents: Event[] | undefined
		if (event.type === 'damage') { adaptedEvents = this.adaptPostCalculatedDamageEvent(event) }
		if (event.type === 'heal') { adaptedEvents = this.adaptPostCalculatedHealEvent(event) }
		if (adaptedEvents == null) {
			throw new Error(`Unexpected event type "${event.type}" when adapting old effect event.`)
		}

		const primaryEventIndex = adaptedEvents
			.findIndex(adaptedEvent => adaptedEvent.type === 'damage' || adaptedEvent.type === 'heal')

		// We don't get explicit execution, fabricate an execute to preserve event stream semantics
		const sequence = this.falseSequence++
		(adaptedEvents[primaryEventIndex] as Events['damage' | 'heal']).sequence = sequence
		adaptedEvents.splice(primaryEventIndex+1, 0, {
			...this.adaptTargetedFields(event),
			type: 'execute',
			action: event.ability.guid,
			sequence,
		})

		return adaptedEvents
	}

	private adaptPostCalculatedEffectEvent(event: DamageEvent | HealEvent): Array<Events['execute' | 'damage' | 'heal' | 'actorUpdate']> {
		// Calc events should all have a packet ID for sequence purposes. Let sentry catch outliers.
		const sequence = event.packetID
		if (sequence == null) {
			// Damage over time or Heal over time effects are sent as damage/heal events without a sequence ID -- there is no execute confirmation for over time effects, just the actual damage or heal event
			// Similarly, certain failed hits will generate an "unpaired" event
			const cause = resolveCause(event.ability.guid)
			if (
				cause.type === 'status'
				|| EFFECT_ONLY_ACTIONS.has(event.ability.guid)
				|| FAILED_HITS.has(event.hitType)
			) {
				if (event.type === 'damage') { return this.adaptPostCalculatedDamageEvent(event) }
				if (event.type === 'heal') { return this.adaptPostCalculatedHealEvent(event) }
			}
			throw new Error('FFLogs Effect event encountered with no packet ID, did not match to over time status effect (DoT/HoT)')
		}

		const targetedFields = this.adaptTargetedFields(event)
		const newEvent: Events['execute'] = {
			...targetedFields,
			type: 'execute',
			action: event.ability.guid,
			sequence,
		}

		return [newEvent, ...this.buildActorUpdateResourceEvents(event)]
	}

	private adaptPostCalculatedDamageEvent(event: DamageEvent): Array<Events['damage' | 'actorUpdate']> {
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

	private adaptPostCalculatedHealEvent(event: HealEvent): Array<Events['heal' | 'actorUpdate']> {
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
			position: {x: resources.x, y: resources.y, bearing: resources.facing},
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

const resolveCause = (fflogsAbilityId: number): Cause =>
	fflogsAbilityId < STATUS_ID_OFFSET
		? {type: 'action', action: fflogsAbilityId}
		: {type: 'status', status: resolveStatusId(fflogsAbilityId)}

// TODO: When removing legacy, resolve status IDs without the offset
const resolveStatusId = (fflogsStatusId: number) =>
	fflogsStatusId
