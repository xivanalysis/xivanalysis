import {AttributeValue, Event, Events, Position, Resource} from 'event'
import _ from 'lodash'
import {Actor} from 'report'
import {FflogsEvent} from '../eventTypes'
import {AdapterStep} from './base'

export class DeduplicateActorUpdateStep extends AdapterStep {
	private actorState = new Map<Actor['id'], Events['actorUpdate']>()

	override adapt(baseEvent: FflogsEvent, adaptedEvents: Event[]): Event[] {
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
		const baseFields = {
			type: 'actorUpdate',
			timestamp: next.timestamp,
			actor: next.actor,
		} as const

		type DeduplicatedFields = Omit<Events['actorUpdate'], keyof typeof baseFields>
		const updates = this.denseObject<DeduplicatedFields>()([
			['hp', this.resolveResource(prev.hp, next.hp)],
			['mp', this.resolveResource(prev.mp, next.mp)],
			['position', this.resolvePosition(prev.position, next.position)],
			['targetable', this.resolveValue(prev.targetable, next.targetable)],
			['attributes', this.resolveAttributes(prev.attributes, next.attributes)],
		])

		// If nothing has changed, we can noop this entire event
		if (updates == null) {
			return undefined
		}

		this.actorState.set(next.actor, this.mergeUpdates(prev, next))

		return {
			...baseFields,
			...updates,
		}
	}

	private resolveResource(
		prev?: Partial<Resource>,
		next?: Partial<Resource>,
	) {
		return this.denseObject<Resource>()([
			['current', this.resolveValue(prev?.current, next?.current)],
			['maximum', this.resolveValue(prev?.maximum, next?.maximum)],
		])
	}

	private resolvePosition(
		prev?: Partial<Position>,
		next?: Partial<Position>,
	) {
		return this.denseObject<Position>()([
			['x', this.resolveValue(prev?.x, next?.x)],
			['y', this.resolveValue(prev?.y, next?.y)],
			['bearing', this.resolveValue(prev?.bearing, next?.bearing)],
		])
	}

	private resolveValue<T>(prev?: T, next?: T): T | undefined {
		return next !== prev ? next : undefined
	}

	private resolveAttributes(
		prev?: AttributeValue[],
		next?: AttributeValue[],
	) {
		// If previous is null, next is accurate regardless of null status.
		// If next is null, nothing has changed and we can noop with a null.
		if (prev == null || next == null) { return next }

		const attributes: AttributeValue[] = []
		for (const nextAttr of next) {
			const prevAttr = prev.find(prevAttr => prevAttr.attribute === nextAttr.attribute)
			if (prevAttr != null && prevAttr.value === nextAttr.value) {
				continue
			}
			attributes.push(nextAttr)
		}
		return attributes.length > 0 ? attributes : undefined
	}

	private denseObject<T extends object>() {
		// If you're getting red squigglies up above when calling this function, it's
		// almost certainly because a new field has been added to one of the interfaces,
		// and needs to be added to the call site. Yes, it's ugly as fuck. But it catches
		// nasty mistakes, so it's worth it.
		return <
			M extends Array<[keyof T, unknown]>
		>(
			entries: [keyof T] extends [M[number][0]] ? M : never[]
		) => {
			const filtered = (entries as M).filter(([, value]) => value != null)
			return filtered.length === 0
				? undefined
				: Object.fromEntries(filtered) as Partial<T>
		}
	}

	private mergeUpdates(
		prev: Events['actorUpdate'],
		next: Events['actorUpdate'],
	) {
		return _.mergeWith({}, prev, next, (prevValue, nextValue, key) => {
			// If it's the attributes array, do a bit of a smarter merge
			if (key !== 'attributes' || prevValue == null || nextValue == null) { return }

			return _.values(_.merge(
				_.keyBy(prevValue, 'attribute'),
				_.keyBy(nextValue, 'attribute'),
			))
		})
	}
}
