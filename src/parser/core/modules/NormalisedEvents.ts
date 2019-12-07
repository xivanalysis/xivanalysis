import {DamageEvent, Event, HealEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import HitType from 'parser/core/modules/HitType'

// Based on multi-hit margin previously in use for barrage and AOE modules
const LEGACY_MUTLIHIT_DEDUPLICATION_TIME_WINDOW = 500

const DAMAGE_EVENT_TYPES: Array<Event['type']> = [
	'damage',
	'calculateddamage',
]

const HEAL_EVENT_TYPES: Array<Event['type']> = [
	'heal',
	'calculatedheal',
]

export interface NormalisedDamageEvent extends Omit<DamageEvent, 'type'> {
	type: 'normaliseddamage'
	targetsHit: number
	hits: number
	ghostedHits: number
	ghostedAmount: number
	calculatedEvents: DamageEvent[]
	confirmedEvents: DamageEvent[]
	attachEvent(event: DamageEvent): void
}

export interface NormalisedHealEvent extends Omit<HealEvent, 'type'> {
	type: 'normalisedheal'
	targetsHit: number
	hits: number
	ghostedHits: number
	ghostedAmount: number
	calculatedEvents: HealEvent[]
	confirmedEvents: HealEvent[]
	attachEvent(event: HealEvent): void
}

export class NormalisedEvents extends Module {
	static handle = 'normalisedEvents'

	private static GenerateNewDamageEvent(event: DamageEvent): NormalisedDamageEvent {
		return {
			...event,
			type: 'normaliseddamage',
			targetsHit: 0,
			hits: 0,
			ghostedHits: 0,
			ghostedAmount: 0,
			calculatedEvents: [],
			confirmedEvents: [],
			attachEvent(event: DamageEvent): void {
				if (event.type.includes('calculated')) {
					this.calculatedEvents.push(event)
				} else {
					this.confirmedEvents.push(event)
				}
			},
		}
	}

	private static GenerateNewHealEvent(event: HealEvent): NormalisedHealEvent {
		return {
			...event,
			type: 'normalisedheal',
			targetsHit: 0,
			hits: 0,
			ghostedHits: 0,
			ghostedAmount: 0,
			calculatedEvents: [],
			confirmedEvents: [],
			attachEvent(event: HealEvent): void {
				if (event.type.includes('calculated')) {
					this.calculatedEvents.push(event)
				} else {
					this.confirmedEvents.push(event)
				}
			},
		}
	}

	@dependency private hitType!: HitType

	_normalisedDamageEvents = new Map<number, NormalisedDamageEvent>()
	_normalisedHealEvents = new Map<number, NormalisedHealEvent>()

	normalise(events: Event[]): Event[] {
		events.forEach((event) => {
			if (DAMAGE_EVENT_TYPES.includes(event.type)) {
				this.normaliseDamageEvent(event as DamageEvent)
			}

			if (HEAL_EVENT_TYPES.includes(event.type)) {
				this.normaliseHealEvent(event as HealEvent)
			}
		})

		this._normalisedDamageEvents.forEach(this.summarize, this)
		this._normalisedHealEvents.forEach(this.summarize, this)

		return events.concat(Array.from(this._normalisedDamageEvents.values()), Array.from(this._normalisedHealEvents.values()))
	}

	private normaliseDamageEvent(event: DamageEvent) {
		let normalisedEvent = this.findRelatedDamageEvent(event)

		if (!normalisedEvent) {
			normalisedEvent = NormalisedEvents.GenerateNewDamageEvent(event)
			this._normalisedDamageEvents.set(event.packetID ?? event.timestamp, normalisedEvent)
		}

		normalisedEvent.attachEvent(event)
	}

	private normaliseHealEvent(event: HealEvent) {
		let normalisedEvent = this.findRelatedHealEvent(event)

		if (!normalisedEvent) {
			normalisedEvent = NormalisedEvents.GenerateNewHealEvent(event)
			this._normalisedHealEvents.set(event.packetID ?? event.timestamp, normalisedEvent)
		}

		normalisedEvent.attachEvent(event)
	}

	private findRelatedDamageEvent(event: DamageEvent) {
		if (event.packetID) {
			return this._normalisedDamageEvents.get(event.packetID)
		}

		// No packetID set - match based on timestamps
		const possibleRelatedEvents = Array.from(this._normalisedDamageEvents.values())
			.filter((normalisedEvent) => {
				return event.ability.guid === normalisedEvent.ability.guid
					&& event.sourceID === normalisedEvent.sourceID
					&& normalisedEvent.timestamp <= event.timestamp
					&& event.timestamp - normalisedEvent.timestamp < LEGACY_MUTLIHIT_DEDUPLICATION_TIME_WINDOW
			})
			.sort((a, b) => a.timestamp - b.timestamp)

		return possibleRelatedEvents[0] || undefined
	}

	private findRelatedHealEvent(event: HealEvent) {
		if (event.packetID) {
			return this._normalisedHealEvents.get(event.packetID)
		}

		// No packetID set - match based on timestamps
		const possibleRelatedEvents = Array.from(this._normalisedHealEvents.values())
			.filter((normalisedEvent) => {
				return event.ability === normalisedEvent.ability
					&& event.sourceID === normalisedEvent.sourceID
					&& normalisedEvent.timestamp <= event.timestamp
					&& event.timestamp - normalisedEvent.timestamp < LEGACY_MUTLIHIT_DEDUPLICATION_TIME_WINDOW
			})
			.sort((a, b) => a.timestamp - b.timestamp)

		return possibleRelatedEvents[0] || undefined
	}

	private summarize(normalisedEvent: NormalisedDamageEvent | NormalisedHealEvent) {
		const confirmedEvents: Array<DamageEvent | HealEvent> = normalisedEvent.confirmedEvents
		const calculatedEvents: Array<DamageEvent | HealEvent> = normalisedEvent.calculatedEvents
		const allEvents: Array<DamageEvent | HealEvent> = calculatedEvents.concat(confirmedEvents)

		const hitGhosted = (evt: DamageEvent | HealEvent) => evt.unpaired

		normalisedEvent.hits = confirmedEvents.length
		normalisedEvent.targetsHit = new Set(confirmedEvents.map(evt => `${evt.targetID}-${evt.targetInstance}`)).size
		normalisedEvent.amount = confirmedEvents.reduce((total, evt) => total + evt.amount, 0)
		normalisedEvent.ghostedHits = calculatedEvents.filter(hitGhosted).length
		normalisedEvent.ghostedAmount = calculatedEvents.filter(hitGhosted).reduce((total, evt) => total + evt.amount, 0)
		normalisedEvent.successfulHit = true
		// normalisedEvent.successfulHit = effectiveEvents.reduce((successfulHit, evt) => successfulHit || evt.successfulHit, false)
		normalisedEvent.timestamp = allEvents.map(evt => evt.timestamp).reduce((min, timestamp) => Math.min(min, timestamp))
	}
}
