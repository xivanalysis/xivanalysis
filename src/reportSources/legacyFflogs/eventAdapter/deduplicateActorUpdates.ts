import {Event, Events, Position, Resource} from 'event'
import {FflogsEvent} from 'fflogs'
import _ from 'lodash'
import {Actor} from 'report'
import {AdapterStep} from './base'

export class DeduplicateActorUpdateStep extends AdapterStep {
	private actorState = new Map<Actor['id'], Events['actorUpdate']>()

	adapt(baseEvent: FflogsEvent, adaptedEvents: Event[]): Event[] {
		const out: Event[] = []
		for (const event of adaptedEvents) {
			const adapted = event.type === 'actorUpdate'
				? this.adaptActorUpdate(event)
				: event
			adapted && out.push(adapted)
		}
		return out
	}

	private adaptActorUpdate(next: Events['actorUpdate']): Event | undefined {
		// Grab the previous state of the actor - if there is nothing, the new state is all we know
		const prev = this.actorState.get(next.actor)
		if (prev == null) {
			this.actorState.set(next.actor, next)
			return next
		}

		// Build an object of changes since the previous values
		const updates = this.denseObject([
			['hp', this.resolveResource(prev.hp, next.hp)],
			['mp', this.resolveResource(prev.mp, next.mp)],
			['position', this.resolvePosition(prev.position, next.position)],
		])

		// If nothing has changed, we can noop this entire event
		if (updates == null) {
			return undefined
		}

		this.actorState.set(next.actor, _.merge({}, prev, updates))

		return {
			type: 'actorUpdate',
			timestamp: next.timestamp,
			actor: next.actor,
			...updates,
		}
	}

	private resolveResource(
		prev?: Partial<Resource>,
		next?: Partial<Resource>,
	): Partial<Resource> | undefined {
		return this.denseObject([
			['current', this.resolveValue(prev?.current, next?.current)],
			['maximum', this.resolveValue(prev?.maximum, next?.maximum)],
		])
	}

	private resolvePosition(
		prev?: Partial<Position>,
		next?: Partial<Position>,
	): Partial<Position> | undefined {
		return this.denseObject([
			['x', this.resolveValue(prev?.x, next?.x)],
			['y', this.resolveValue(prev?.y, next?.y)],
		])
	}

	private resolveValue<T>(prev?: T, next?: T): T | undefined {
		return next !== prev ? next : undefined
	}

	private denseObject<T extends object>(entries: Array<[string, unknown]>): T | undefined {
		const filtered = entries.filter(([, value]) => value != null)
		return filtered.length === 0
			? undefined
			: Object.fromEntries(filtered) as T
	}
}
