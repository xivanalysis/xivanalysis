import {DamageEvent, Event, HealEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import HitType from 'parser/core/modules/HitType'
import {Compute} from 'utilities'

// Based on multi-hit margin previously in use for barrage and AOE modules
const LEGACY_MUTLIHIT_DEDUPLICATION_TIME_WINDOW = 500
const DAMAGE_EVENT_TYPES = new Set(['damage', 'calculateddamage'])
const HEAL_EVENT_TYPES = new Set(['heal', 'calculatedheal'])

type BaseEvent = DamageEvent | HealEvent
type NormalisedEventTypes = 'normaliseddamage' | 'normalisedheal'
type NormalisedEvent<E extends BaseEvent, T extends NormalisedEventTypes> = Omit<E, 'type'> & {
	type: T,
	targetsHit: number,
	hits: number,
	/**
	 * Number of damage events that did not do confirmed damage to the target.
	 *  Typically due to target or source despawning before damage applied.
	 */
	ghostedHits: number,
	/**
	 * Total amount of damage from damage events that did not do confirmed damage to the target.
	 *  Typically due to target or source despawning before damage applied.
	 */
	ghostedAmount: number,
	calculatedEvents: E[],
	confirmedEvents: E[],
}

export type NormalisedDamageEvent = Compute<NormalisedEvent<DamageEvent, 'normaliseddamage'>>
export type NormalisedHealEvent = Compute<NormalisedEvent<HealEvent, 'normalisedheal'>>

export class NormalisedEvents extends Module {
	static handle = 'normalisedEvents'

	private static generateNew<E extends BaseEvent, T extends NormalisedEventTypes>(event: E, type: T): NormalisedEvent<E, T> {
		return {
			...event,
			type,
			targetsHit: 0,
			hits: 0,
			ghostedHits: 0,
			ghostedAmount: 0,
			calculatedEvents: [],
			confirmedEvents: [],
		}
	}

	private static attachEvent<E extends BaseEvent, T extends NormalisedEventTypes>(event: E, normalisedEvent: NormalisedEvent<E, T>) {
		if (event.type.includes('calculated')) {
			normalisedEvent.calculatedEvents.push(event)
		} else {
			normalisedEvent.confirmedEvents.push(event)
		}
	}

	@dependency private hitType!: HitType // Dependency to ensure HitType properties are available for determining hit success

	_normalisedEvents = new Map<number, NormalisedEvent<BaseEvent, NormalisedEventTypes>>()

	normalise(events: Event[]): Event[] {
		events.forEach((event) => {
			if (typeof event.type === 'string') {
				if (DAMAGE_EVENT_TYPES.has(event.type)) {
					this.normaliseEvent(event as DamageEvent, 'normaliseddamage')
				}

				if (HEAL_EVENT_TYPES.has(event.type)) {
					this.normaliseEvent(event as HealEvent, 'normalisedheal')
				}
			}
		})

		this._normalisedEvents.forEach(this.summarize)

		return events.concat(Array.from(this._normalisedEvents.values()))
	}

	private normaliseEvent<E extends BaseEvent, T extends NormalisedEventTypes>(event: E, type: T) {
		let normalisedEvent = this.findRelatedEvent(event)

		if (!normalisedEvent) {
			normalisedEvent = NormalisedEvents.generateNew(event, type)
			this._normalisedEvents.set(event.packetID ?? event.timestamp, normalisedEvent)
		}

		NormalisedEvents.attachEvent(event, normalisedEvent)
	}

	private findRelatedEvent<E extends BaseEvent>(event: E) {
		if (event.packetID) {
			return this._normalisedEvents.get(event.packetID)
		}

		// No packetID set - match based on timestamps
		const possibleRelatedEvents = Array.from(this._normalisedEvents.values())
			.filter(normalisedEvent =>
				event.ability.guid === normalisedEvent.ability.guid &&
				event.sourceID === normalisedEvent.sourceID &&
				normalisedEvent.timestamp <= event.timestamp &&
				event.timestamp - normalisedEvent.timestamp < LEGACY_MUTLIHIT_DEDUPLICATION_TIME_WINDOW,
			)
			.sort((a, b) => a.timestamp - b.timestamp)

		return possibleRelatedEvents[0] || undefined
	}

	private summarize = (normalisedEvent: NormalisedEvent<BaseEvent, NormalisedEventTypes>) => {
		const allEvents = normalisedEvent.calculatedEvents.concat(normalisedEvent.confirmedEvents)

		const hitGhosted = (evt: BaseEvent) => evt.unpaired

		normalisedEvent.hits = normalisedEvent.confirmedEvents.length
		normalisedEvent.targetsHit = new Set(normalisedEvent.confirmedEvents.map(evt => `${evt.targetID}-${evt.targetInstance}`)).size
		normalisedEvent.amount = normalisedEvent.confirmedEvents.reduce((total, evt) => total + evt.amount, 0)
		normalisedEvent.ghostedHits = normalisedEvent.calculatedEvents.filter(hitGhosted).length
		normalisedEvent.ghostedAmount = normalisedEvent.calculatedEvents.filter(hitGhosted).reduce((total, evt) => total + evt.amount, 0)
		normalisedEvent.successfulHit = normalisedEvent.calculatedEvents.reduce((successfulHit: boolean, evt) => successfulHit || evt.successfulHit, false)
		normalisedEvent.timestamp = allEvents.map(evt => evt.timestamp).reduce((min, timestamp) => Math.min(min, timestamp))
	}
}
