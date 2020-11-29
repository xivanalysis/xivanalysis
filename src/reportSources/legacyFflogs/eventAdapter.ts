import {STATUS_ID_OFFSET} from 'data/STATUSES'
import {Event, Events, SourceModifier, TargetModifier} from 'event'
import {CastEvent, DamageEvent, EventActor, FflogsEvent, HitType} from 'fflogs'
import {Actor, Report} from 'report'
import {isDefined} from 'utilities'

const sourceHitType: Partial<Record<HitType, SourceModifier>> = {
	[HitType.MISS]: SourceModifier.MISS,
	[HitType.CRITICAL]: SourceModifier.CRITICAL,
	// Marking dodge as miss 'cus it seems to be mis-used as such on fflogs
	[HitType.DODGE]: SourceModifier.MISS,
}
const targetHitType: Partial<Record<HitType, TargetModifier>> = {
	[HitType.BLOCK]: TargetModifier.BLOCK,
	[HitType.PARRY]: TargetModifier.PARRY,
}

export function adaptEvents(report: Report, events: FflogsEvent[]): Event[] {
	const adapter = new EventAdapter({report})
	return adapter.adaptEvents(events)
}

class EventAdapter {
	private report: Report

	private eventResolutionMap = new Map<string, Events['damage']>()

	// TODO: Remove?
	private unhandledTypes = new Set<FflogsEvent['type']>()

	constructor(opts: {report: Report}) {
		this.report = opts.report
	}

	adaptEvents(events: FflogsEvent[]): Event[] {
		return events
			.map(event => this.adaptEvent(event))
			.filter(isDefined)
	}

	private adaptEvent(event: FflogsEvent): Event | undefined {
		switch (event.type) {
		case 'begincast':
		case 'cast':
			return this.adaptCastEvent(event)

		// TODO: calculateddamage
		case 'calculateddamage':
			return this.adaptCalculatedDamageEvent(event)
		case 'damage':
			return this.adaptDamageEvent(event)

		default:
			// TODO: on prod, this should probably post to sentry
			if (!this.unhandledTypes.has(event.type)) {
				console.log(`Unhandled event type "${event.type}"`)
				this.unhandledTypes.add(event.type)
			}
		}
	}

	private adaptCastEvent(event: CastEvent): Events['prepare'] | Events['action'] {
		return {
			...this.adaptTargetedFields(event),
			type: event.type === 'begincast' ? 'prepare' : 'action',
			action: event.ability.guid,
		}
	}

	private adaptCalculatedDamageEvent(event: DamageEvent): Events['damage'] {
		// Calculate modifier
		let sourceModifier = sourceHitType[event.hitType] ?? SourceModifier.NORMAL
		if (event.multistrike) {
			sourceModifier = sourceModifier === SourceModifier.CRITICAL
				? SourceModifier.CRITICAL_DIRECT
				: SourceModifier.DIRECT
		}

		// Build the new event
		const newEvent: Events['damage'] = {
			...this.adaptTargetedFields(event),
			type: 'damage',
			hit: event.ability.guid < STATUS_ID_OFFSET
				? {type: 'action', action: event.ability.guid}
				: {type: 'status', status: event.ability.guid - STATUS_ID_OFFSET},
			...resolveAmountFields(event),
			resolved: false, // TODO: check w/ calc damage
			attackType: 0, // TODO: adapt?
			aspect: 0, // TODO: adapt?
			sourceModifier,
			targetModifier: targetHitType[event.hitType] ?? TargetModifier.NORMAL,
		}

		// If there's no packet ID, I'm opting to throw - If sentry/people complain about it, we can try to
		// match up with a fallback - but animation delays can push the resolution out for 2s (or more?), so...
		if (event.packetID == null) {
			throw new Error('Calculated damage event encountered with no packet ID. Cannot resolve damage, bailing.')
		}

		// Save the unresolved event out to the map
		this.eventResolutionMap.set(`packet:${event.packetID}`, newEvent)

		return newEvent
	}

	private adaptDamageEvent(event: DamageEvent): undefined {
		// Try to find a matching event that needs resolution - if there is none, bail
		const pendingEvent = event.packetID != null
			? this.eventResolutionMap.get(`packet:${event.packetID}`)
			: undefined

		if (pendingEvent == null) {
			// TODO: handle
			throw new Error('This shouldnt happen. Check!')
		}

		Object.assign(pendingEvent, {
			resolved: true,
			// TODO: Should we use the new timestamp?
			// Calculated events seem to have no amount at all, fix.
			...resolveAmountFields(event),
		})

		return
	}

	private adaptTargetedFields(event: FflogsEvent) {
		return {
			...this.adaptBaseFields(event),
			source: resolveActorId(event.sourceID, event.source),
			target: resolveActorId(event.targetID, event.target),
		}
	}

	private adaptBaseFields(event: FflogsEvent) {
		return {timestamp: this.report.timestamp + event.timestamp}
	}
}

const resolveActorId = (id?: number, actor?: EventActor): Actor['id'] =>
	(id ?? actor?.id ?? -1).toString()

function resolveAmountFields(event: DamageEvent) {
	const overkill = event.overkill ?? 0
	return {
		// fflogs subtracts overkill from amount, amend
		amount: event.amount + overkill,
		overkill,
	}
}
