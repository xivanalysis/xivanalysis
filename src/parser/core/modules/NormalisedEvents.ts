import {AbilityEvent, BuffEvent, DamageEvent, Event, HealEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import HitType from 'parser/core/modules/HitType'

// Based on multi-hit margin previously in use for barrage and AOE modules
const LEGACY_MUTLIHIT_DEDUPLICATION_TIME_WINDOW = 500

type BaseEvent = DamageEvent | HealEvent

interface NormalisedEvent extends AbilityEvent {
	type: string
	calculatedEvents: Array<BaseEvent | BuffEvent>
	confirmedEvents: Array<BaseEvent | BuffEvent>
}
class NormalisedEvent {
	get targetsHit(): number { return new Set((this.confirmedEvents as unknown as Event[]).map(evt => `${evt.targetID}-${evt.targetInstance}`)).size }
	get hits(): number { return this.confirmedEvents.length }
	get amount(): number | undefined {
		if (NormalisedEvents.isBaseEventArray(this.confirmedEvents)) {
			return this.confirmedEvents.reduce((total, evt) => total + evt.amount, 0)
		}
		return undefined
	}
	/**
	 * Number of damage events that did not do confirmed damage to the target.
	 *  Typically due to target or source despawning before damage applied.
	 */
	get ghostedHits(): number | undefined {
		if (NormalisedEvents.isBaseEventArray(this.calculatedEvents)) {
			return this.calculatedEvents.filter((evt) => evt.unpaired).reduce((total, evt) => total + evt.amount, 0)
		}
		return undefined
	}
	/**
	 * Total amount of damage from damage events that did not do confirmed damage to the target.
	 *  Typically due to target or source despawning before damage applied.
	 */
	get ghostedAmount(): number | undefined {
		if (NormalisedEvents.isBaseEventArray(this.calculatedEvents)) {
			return this.calculatedEvents.filter((evt) => evt.unpaired).length
		}
		return undefined
	}
	get successfulHit(): boolean | undefined {
		if (NormalisedEvents.isBaseEventArray(this.confirmedEvents)) {
			return this.confirmedEvents.reduce((successfulHit: boolean, evt) => successfulHit || evt.successfulHit, false)
		}
	}

	attachEvent(event: BaseEvent | BuffEvent) {
		if (event.type.includes('calculated')) {
			this.calculatedEvents.push(event)
		} else {
			this.confirmedEvents.push(event)
		}
	}
}

export interface NormalisedDamageEvent extends Omit<DamageEvent, 'type' | 'amount' | 'successfulHit'>, NormalisedEvent {}
export class NormalisedDamageEvent extends NormalisedEvent {
	type = 'normaliseddamage'
	calculatedEvents: DamageEvent[] = []
	confirmedEvents: DamageEvent[] = []

	constructor(event: DamageEvent) {
		super()
		Object.assign(this, (({type, amount, successfulHit, ...props}) => ({...props}))(event))
	}
}

export interface NormalisedHealEvent extends Omit<HealEvent, 'type'| 'amount' | 'successfulHit'>, NormalisedEvent {}
export class NormalisedHealEvent extends NormalisedEvent {
	type = 'normalisedheal'
	calculatedEvents: HealEvent[] = []
	confirmedEvents: HealEvent[] = []

	constructor(event: HealEvent) {
		super()
		Object.assign(this, (({type, amount, successfulHit, ...props}) => ({...props}))(event))
	}
}

export interface NormalisedApplyBuffEvent extends Omit<BuffEvent, 'type'>, NormalisedEvent {}
export class NormalisedApplyBuffEvent extends NormalisedEvent {
	type = 'normalisedapplybuff'
	calculatedEvents: BuffEvent[] = []
	confirmedEvents: BuffEvent[] = []

	constructor(event: BuffEvent) {
		super()
		Object.assign(this, (({type, ...props}) => ({...props}))(event))
	}
}

export interface NormalisedRemoveBuffEvent extends Omit<BuffEvent, 'type'>, NormalisedEvent {}
export class NormalisedRefreshBuffEvent extends NormalisedEvent {
	type = 'normalisedrefreshbuff'
	calculatedEvents: BuffEvent[] = []
	confirmedEvents: BuffEvent[] = []

	constructor(event: BuffEvent) {
		super()
		Object.assign(this, (({type, ...props}) => ({...props}))(event))
	}
}

export class NormalisedEvents extends Module {
	static handle = 'normalisedEvents'
	static debug = false

	public static isBaseEventArray(array: Array<BaseEvent | BuffEvent>): array is BaseEvent[] {
		return array.length > 0 && this.isBaseEvent(array[0])
	}

	static isBaseEvent(event: Event): event is BaseEvent { return this.isDamageEvent(event) || this.isHealEvent(event) }
	static isDamageEvent(event: Event): event is DamageEvent { return (event as DamageEvent).type.includes('damage') }
	static isHealEvent(event: Event): event is HealEvent { return (event as HealEvent).type.includes('heal') }
	static isSupportedBuffEvent(event: Event): event is BuffEvent { return this.isApplyBuffEvent(event) || this.isRemoveBuffEvent(event) }
	static isApplyBuffEvent(event: Event): event is BuffEvent { return (event as BuffEvent).type ==='applybuff' }
	static isRemoveBuffEvent(event: Event): event is BuffEvent { return (event as BuffEvent).type ==='removebuff' }

	@dependency private hitType!: HitType // Dependency to ensure HitType properties are available for determining hit success

	_normalisedEvents = new Map<number, NormalisedEvent>()

	normalise(events: Event[]): Event[] {
		events.forEach(this.normaliseEvent)

		return events.concat(Array.from(this._normalisedEvents.values()))
	}

	private normaliseEvent = (event: Event) => {
		if (!NormalisedEvents.isBaseEvent(event) && !NormalisedEvents.isSupportedBuffEvent(event)) {
			// Not a supported event type for normalisation
			return
		}
		let normalisedEvent = this.findRelatedEvent(event)

		if (!normalisedEvent) {
			this.debug('No matching event found, creating new event')
			let identifier: number
			if (NormalisedEvents.isDamageEvent(event)) {
				normalisedEvent = new NormalisedDamageEvent(event)
				identifier = event.packetID ?? event.timestamp
			} else if (NormalisedEvents.isHealEvent(event)) {
				normalisedEvent = new NormalisedHealEvent(event)
				identifier = event.packetID ?? event.timestamp
			} else {
				identifier = event.timestamp
				if (NormalisedEvents.isApplyBuffEvent(event)) {
					normalisedEvent = new NormalisedApplyBuffEvent(event)
				} else {
					normalisedEvent = new NormalisedRefreshBuffEvent(event)
				}
			}
			this._normalisedEvents.set(identifier, normalisedEvent)
		}

		normalisedEvent.attachEvent(event)
	}

	private findRelatedEvent = (event: BaseEvent | BuffEvent) => {
		this.debug(`Searching for related events for event ${event.ability.name} at ${this.parser.formatTimestamp(event.timestamp)}`)
		if (NormalisedEvents.isBaseEvent(event) && event.packetID) {
			this.debug(`Searching by packetID ${event.packetID}`)
			return this._normalisedEvents.get(event.packetID)
		}

		this.debug(`Searching by timestamp ${event.timestamp}`)
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
}
