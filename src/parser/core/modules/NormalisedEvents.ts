import {AbilityEvent, BuffEvent, DamageEvent, Event, HealEvent, isApplyBuffEvent, isDamageEvent, isHealEvent, isRemoveBuffEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import HitType from 'parser/core/modules/HitType'

// Based on multi-hit margin previously in use for barrage and AOE modules
const LEGACY_MUTLIHIT_DEDUPLICATION_TIME_WINDOW = 500

type BaseEvent = DamageEvent | HealEvent
const isSupportedBuffEvent = (event: Event): event is BuffEvent => isApplyBuffEvent(event) || isRemoveBuffEvent(event)
const isBaseEvent = (event: Event): event is BaseEvent => isDamageEvent(event) || isHealEvent(event)
const isSupportedEvent = (event: Event): event is BaseEvent | BuffEvent => isBaseEvent(event) || isSupportedBuffEvent(event)
const isBaseEventArray = (array: Array<BaseEvent | BuffEvent>): array is BaseEvent[] => array.length > 0 && isBaseEvent(array[0])

interface NormalisedEvent extends AbilityEvent {
	type: string
	calculatedEvents: Array<BaseEvent | BuffEvent>
	confirmedEvents: Array<BaseEvent | BuffEvent>
}
class NormalisedEvent {
	get targetsHit(): number { return new Set(this.confirmedEvents.map(evt => `${evt.targetID}-${evt.targetInstance}`)).size }
	get hits(): number { return this.confirmedEvents.length }
	get amount(): number {
		if (isBaseEventArray(this.confirmedEvents)) {
			return this.confirmedEvents.reduce((total, evt) => total + evt.amount, 0)
		}
		return 0
	}
	/**
	 * Number of damage events that did not do confirmed damage to the target.
	 *  Typically due to target or source despawning before damage applied.
	 */
	get ghostedHits(): number {
		if (isBaseEventArray(this.calculatedEvents)) {
			return this.calculatedEvents.filter((evt) => evt.unpaired).reduce((total, evt) => total + evt.amount, 0)
		}
		return 0
	}
	/**
	 * Total amount of damage from damage events that did not do confirmed damage to the target.
	 *  Typically due to target or source despawning before damage applied.
	 */
	get ghostedAmount(): number {
		if (isBaseEventArray(this.calculatedEvents)) {
			return this.calculatedEvents.filter((evt) => evt.unpaired).length
		}
		return 0
	}
	get successfulHit(): boolean {
		if (isBaseEventArray(this.confirmedEvents)) {
			return this.confirmedEvents.reduce((successfulHit: boolean, evt) => successfulHit || evt.successfulHit, false)
		}
		return false
	}

	attachEvent(event: BaseEvent | BuffEvent) {
		if (event.type.includes('calculated')) {
			this.calculatedEvents.push(event)
		} else {
			this.confirmedEvents.push(event)
		}
	}
}

export const isNormalisedDamageEvent = (event: NormalisedEvent): event is NormalisedDamageEvent => event.type === 'normaliseddamage'
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

export const isNormalisedHealEvent = (event: NormalisedEvent): event is NormalisedHealEvent => event.type === 'normalisedheal'
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

export const isNormalisedApplyBuffEvent = (event: NormalisedEvent): event is NormalisedApplyBuffEvent => event.type === 'normalisedapplybuff'
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

export const isNormalisedRemoveBuffEvent = (event: NormalisedEvent): event is NormalisedRemoveBuffEvent => event.type === 'normalisedremovebuff'
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

	@dependency private hitType!: HitType // Dependency to ensure HitType properties are available for determining hit success

	private _normalisedEvents = new Map<number, NormalisedEvent>()

	normalise(events: Event[]): Event[] {
		events.forEach(this.normaliseEvent)

		return events.concat(Array.from(this._normalisedEvents.values()))
	}

	private normaliseEvent = (event: Event) => {
		if (!isSupportedEvent(event)) {
			// Not a supported event type for normalisation
			return
		}
		let normalisedEvent = this.findRelatedEvent(event)

		if (!normalisedEvent) {
			this.debug('No matching event found, creating new event')
			let identifier: number
			if (isDamageEvent(event)) {
				normalisedEvent = new NormalisedDamageEvent(event)
				identifier = event.packetID ?? event.timestamp
			} else if (isHealEvent(event)) {
				normalisedEvent = new NormalisedHealEvent(event)
				identifier = event.packetID ?? event.timestamp
			} else {
				identifier = event.timestamp
				if (isApplyBuffEvent(event)) {
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
		if (isBaseEvent(event) && event.packetID) {
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
