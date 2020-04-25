import {AbilityEvent, BuffEvent, DamageEvent, Event, HealEvent, isApplyBuffEvent, isDamageEvent, isHealEvent, isRemoveBuffEvent, isApplyDebuffEvent, isRemoveDebuffEvent} from 'fflogs'
import {sortEvents} from 'parser/core/EventSorting'
import Module, {dependency} from 'parser/core/Module'
import HitType from 'parser/core/modules/HitType'
import PrecastStatus from './PrecastStatus'

// Based on multi-hit margin previously in use for barrage and AOE modules
const LEGACY_MUTLIHIT_DEDUPLICATION_TIME_WINDOW = 500

type BaseEvent = DamageEvent | HealEvent
const isSupportedBuffEvent = (event: Event): event is BuffEvent => isApplyBuffEvent(event) || isRemoveBuffEvent(event) || isApplyDebuffEvent(event) || isRemoveDebuffEvent(event)
const isBaseEvent = (event: Event): event is BaseEvent => isDamageEvent(event) || isHealEvent(event)
const isSupportedEvent = (event: Event): event is BaseEvent | BuffEvent => isBaseEvent(event) || isSupportedBuffEvent(event)
const isBaseEventArray = (array: Array<BaseEvent | BuffEvent>): array is BaseEvent[] => array.length > 0 && isBaseEvent(array[0])

export interface NormalisedEvent extends AbilityEvent {
	type: string
	calculatedEvents: Array<BaseEvent | BuffEvent>
	confirmedEvents: Array<BaseEvent | BuffEvent>
}
export class NormalisedEvent {
	get targetsHit(): number { return new Set(this.confirmedEvents.map(evt => `${evt.targetID}-${evt.targetInstance}`)).size }

	/**
	 * Return all hits, regardless of whether they were confirmed or were ghosted
	 */
	get hits(): Array<BaseEvent | BuffEvent> {
		if (this.calculatedEvents.length > 0) {
			return this.calculatedEvents
		}
		return this.confirmedEvents
	}
	/**
	 * Return the number of hits recorded for this actions, confirmed or ghosted
	 */
	get hitCount(): number { return this.hits.length }

	/**
	 * For damage or heal actions, the total of all damage or healing done by all hits, confirmed or ghosted
	 * For buff actions, 0
	 */
	get hitAmount(): number {
		if (isBaseEventArray(this.hits)) {
			return this.hits.reduce((total, evt) => total + evt.amount, 0)
		}
		return 0
	}
	/**
	 * Return the number of critical hits recorded for this action, confirmed or ghosted
	 */
	get criticalHits(): number {
		if (isBaseEventArray(this.hits)) {
			return this.hits.filter(evt => evt.criticalHit).length
		}
		return 0
	}
	/**
	 * Return the number of direct hits recorded for this action, confirmed or ghosted
	 */
	get directHits(): number {
		if (isBaseEventArray(this.hits)) {
			return this.hits.filter(evt => evt.directHit).length
		}
		return 0
	}
	/**
	 * For damage or heal actions, did any of the events (confirmed or ghosted) for this action generate a successful hit?
	 * - Successful hits are hits that did not miss, and that did not hit an INVULNERABLE or IMMUNE target
	 *     (e.g. due to filter debuffs that force you to attack a specific target)
	 * - In game data from e6s confirms that an event is considered successful by the game for advancing combo
	 *     or generating gauge as long as the calculateddamage event occurs, even if the confirming damage packet doesn't
	 */
	get hasSuccessfulHit(): boolean {
		if (isBaseEventArray(this.calculatedEvents) && this.calculatedEvents.length > 0) {
			return this.calculatedEvents.reduce((successfulHit: boolean, evt) => successfulHit || evt.successfulHit, false)
		}
		if (isBaseEventArray(this.confirmedEvents)) {
			return this.confirmedEvents.reduce((successfulHit: boolean, evt) => successfulHit || evt.successfulHit, false)
		}
		return false
	}

	/**
	 * For damage or heal actions, return all hits that ghosted for this action
	 *  Ghosted hits generate a "prepares" packet but did not actually deal damage or apply healing
	 *  Hits typically ghost due to target or source despawning before damage applied.
	 * For buff events, returns an empty array
	 */
	get ghostedHits(): BaseEvent[] {
		if (isBaseEventArray(this.calculatedEvents)) {
			return this.calculatedEvents.filter(evt => evt.unpaired)
		}
		return []
	}
	/**
	 * Return the number of hits for this action that ghosted.
	 */
	get ghostedHitCount(): number {
		return this.ghostedHits.length
	}
	/**
	 * For damage or heal actions, the total of all damage or healing that did not occur due to ghosted hits
	 * For buff events, 0
	 */
	get ghostedHitAmount(): number {
		return this.ghostedHits.reduce((total, evt) => total + evt.amount, 0)
	}

	/**
	 * For damage or heal actions, return all hits that succeeded for this action (generated a confirming damage action)
	 * For buff events, returns all events
	 */
	get successfulHits(): Array<BaseEvent | BuffEvent> {
		return this.confirmedEvents
	}
	/**
	 * Return the number of hits for this action that succeeded
	 */
	get successfulHitCount(): number {
		return this.successfulHits.length
	}
	/**
	 * For damage or heal actions, the total of all damage or healing that was confirmed
	 * For buff events, 0
	 */
	get successfulHitAmount(): number {
		if (isBaseEventArray(this.successfulHits)) {
			return this.successfulHits.reduce((total, evt) => total + evt.amount, 0)
		}
		return 0
	}

	attachEvent(event: BaseEvent | BuffEvent) {
		if (event.type.includes('calculated')) {
			this.calculatedEvents.push(event)
		} else {
			this.confirmedEvents.push(event)
		}
	}
}

export const isNormalisedDamageEvent = (event: Event): event is NormalisedDamageEvent => event.type === 'normaliseddamage'
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

export const isNormalisedHealEvent = (event: Event): event is NormalisedHealEvent => event.type === 'normalisedheal'
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

export const isNormalisedApplyBuffEvent = (event: Event): event is NormalisedApplyBuffEvent => event.type === 'normalisedapplybuff'
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

export const isNormalisedApplyDebuffEvent = (event: Event): event is NormalisedApplyDebuffEvent => event.type === 'normalisedapplydebuff'
export interface NormalisedApplyDebuffEvent extends Omit<BuffEvent, 'type'>, NormalisedEvent {}
export class NormalisedApplyDebuffEvent extends NormalisedEvent {
	type = 'normalisedapplydebuff'
	calculatedEvents: BuffEvent[] = []
	confirmedEvents: BuffEvent[] = []

	constructor(event: BuffEvent) {
		super()
		Object.assign(this, (({type, ...props}) => ({...props}))(event))
	}
}

export const isNormalisedRemoveBuffEvent = (event: Event): event is NormalisedRemoveBuffEvent => event.type === 'normalisedremovebuff'
export interface NormalisedRemoveBuffEvent extends Omit<BuffEvent, 'type'>, NormalisedEvent {}
export class NormalisedRemoveBuffEvent extends NormalisedEvent {
	type = 'normalisedremovebuff'
	calculatedEvents: BuffEvent[] = []
	confirmedEvents: BuffEvent[] = []

	constructor(event: BuffEvent) {
		super()
		Object.assign(this, (({type, ...props}) => ({...props}))(event))
	}
}

export const isNormalisedRemoveDebuffEvent = (event: Event): event is NormalisedRemoveDebuffEvent => event.type === 'normalisedremovedebuff'
export interface NormalisedRemoveDebuffEvent extends Omit<BuffEvent, 'type'>, NormalisedEvent {}
export class NormalisedRemoveDebuffEvent extends NormalisedEvent {
	type = 'normalisedremovedebuff'
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
	@dependency private precastStatus!: PrecastStatus // Dependency to ensure events synthed by precast status are normalised

	private _normalisedEvents = new Map<string, NormalisedEvent>()

	normalise(events: Event[]): Event[] {
		events.forEach(this.normaliseEvent)

		return sortEvents(events.concat(Array.from(this._normalisedEvents.values())))
	}

	private normaliseEvent = (event: Event) => {
		if (!isSupportedEvent(event)) {
			// Not a supported event type for normalisation
			return
		}
		let normalisedEvent = this.findRelatedEvent(event)

		if (!normalisedEvent) {
			this.debug('No matching event found, creating new event')
			let identifier: string
			if (isDamageEvent(event)) {
				normalisedEvent = new NormalisedDamageEvent(event)
				identifier = event.packetID ? `${event.packetID}` : this.getFallbackIdentifier(event)
			} else if (isHealEvent(event)) {
				normalisedEvent = new NormalisedHealEvent(event)
				identifier = event.packetID ? `${event.packetID}` : this.getFallbackIdentifier(event)
			} else {
				identifier = this.getFallbackIdentifier(event)
				if (isApplyBuffEvent(event)) {
					normalisedEvent = new NormalisedApplyBuffEvent(event)
				} else if (isRemoveBuffEvent(event)) {
					normalisedEvent = new NormalisedRemoveBuffEvent(event)
				} else if (isApplyDebuffEvent(event)) {
					normalisedEvent = new NormalisedApplyDebuffEvent(event)
				} else {
					// isRemoveDebuffEvent(event) - can't check or TS will flag normalisedEvent as possibly undefined
					normalisedEvent = new NormalisedRemoveDebuffEvent(event)
				}
			}
			this._normalisedEvents.set(identifier, normalisedEvent)
		}

		normalisedEvent.attachEvent(event)
	}

	private getFallbackIdentifier = (event: AbilityEvent) =>
		`${event.timestamp}-${event.ability.guid}-${event.type.toString()}`

	private findRelatedEvent = (event: BaseEvent | BuffEvent) => {
		this.debug(`Searching for related events for event ${event.ability.name} at ${this.parser.formatTimestamp(event.timestamp)}`)
		if (isBaseEvent(event) && event.packetID) {
			this.debug(`Searching by packetID ${event.packetID}`)
			return this._normalisedEvents.get(`${event.packetID}`)
		}

		this.debug(`Searching by timestamp ${event.timestamp} and ability ID ${event.ability.guid}`)
		// No packetID set - match based on timestamps
		const possibleRelatedEvents = Array.from(this._normalisedEvents.values())
			.filter(normalisedEvent =>
				event.type.includes(normalisedEvent.type.replace('normalised', '')) &&
				event.ability.guid === normalisedEvent.ability.guid &&
				event.sourceID === normalisedEvent.sourceID &&
				normalisedEvent.timestamp <= event.timestamp &&
				event.timestamp - normalisedEvent.timestamp < LEGACY_MUTLIHIT_DEDUPLICATION_TIME_WINDOW,
			)
			.sort((a, b) => a.timestamp - b.timestamp)

		return possibleRelatedEvents[0] || undefined
	}
}
