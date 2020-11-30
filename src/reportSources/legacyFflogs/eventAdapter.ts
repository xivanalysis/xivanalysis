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
		const resolutionKey = getResolutionKey(event)
		if (resolutionKey == null) {
			throw new Error('Calculated damage event encountered with no packet ID. Cannot resolve damage, bailing.')
		}

		// Save the unresolved event out to the map
		this.eventResolutionMap.set(resolutionKey, newEvent)

		return newEvent
	}

	private adaptDamageEvent(event: DamageEvent): undefined {
		// Try to find a matching event that needs resolution - if there is none, bail
		// TODO: can probably just bail instead of throwing
		const resolutionKey = getResolutionKey(event)
		if (resolutionKey == null) {
			// These are known cases where no packet ID is recieved - and i'm okay with. This is only here for dev so I can debug when something unknown comes in
			// TODO: DO NOT RELEASE WITH THIS CODE
			// TODO: THIS IS EATING ALL TICK DAMAGE, RESOLVE
			if (
				event.tick ||
				event.hitType === HitType.DODGE
			) {
				return
			}
			console.log(event)
			console.log(this.eventResolutionMap)
			throw new Error('???')
		}

		const pendingEvent = this.eventResolutionMap.get(resolutionKey)
		if (pendingEvent == null) {
			// TODO: handle
			console.log(event)
			console.log(resolutionKey)
			console.log(this.eventResolutionMap)

			// TODO: This is due to duplicated actor IDs stemming from instances. Need to split instances in report adapter first.
			throw new Error('This shouldnt happen. Check!')
		}

		this.eventResolutionMap.delete(resolutionKey)

		Object.assign(pendingEvent, {
			resolved: true,
			// TODO: Should we use the new timestamp? Will need to sort results if we do.
			// Calculated events seem to have no amount at all, fix.
			...resolveAmountFields(event),
		})

		return
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

function getResolutionKey(event: DamageEvent) {
	if (event.packetID == null) { return }
	const {source, target} = resolveActorIds(event)
	return `${event.packetID}|${source}|${target}`
}

const resolveActorIds = (event: FflogsEvent) => ({
	source: resolveActorId({id: event.sourceID, instance: event.sourceInstance, actor: event.source}),
	target: resolveActorId({id: event.targetID, instance: event.targetInstance, actor: event.target}),
})

const resolveActorId = (opts: {id?: number, instance?: number, actor?: EventActor}): Actor['id'] => {
	const id = (opts.id ?? opts.actor?.id ?? -1).toString()
	const instance = opts.instance ?? 1
	return instance > 1
		? `${id}:${instance}`
		: id
}

function resolveAmountFields(event: DamageEvent) {
	const overkill = event.overkill ?? 0
	return {
		// fflogs subtracts overkill from amount, amend
		amount: event.amount + overkill,
		overkill,
	}
}
