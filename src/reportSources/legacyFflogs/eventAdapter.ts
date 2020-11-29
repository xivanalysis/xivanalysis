import {STATUS_ID_OFFSET} from 'data/STATUSES'
import {Event, Events} from 'events'
import {CastEvent, DamageEvent, EventActor, FflogsEvent} from 'fflogs'
import {Actor, Report} from 'report'
import {isDefined} from 'utilities'

export function adaptEvents(report: Report, events: FflogsEvent[]): Event[] {
	const adapter = new EventAdapter({report})
	return adapter.adaptEvents(events)
}

class EventAdapter {
	private report: Report

	// TODO: Remove
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

	private adaptDamageEvent(event: DamageEvent): Events['damage'] {
		const overkill = event.overkill ?? 0

		return {
			...this.adaptTargetedFields(event),
			type: 'damage',
			hit: event.ability.guid < STATUS_ID_OFFSET
				? {type: 'action', action: event.ability.guid}
				: {type: 'status', status: event.ability.guid - STATUS_ID_OFFSET},
			// fflogs subtracts overkill from amount, amend
			amount: event.amount + overkill,
			overkill,
			resolved: false, // TODO: check w/ calc damage
			attackType: 0, // TODO: adapt?
			aspect: 0, // TODO: adapt?
			sourceModifer: 0, // TODO: adapt
			targetModifier: 0, // TODO: adapt
		}
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
