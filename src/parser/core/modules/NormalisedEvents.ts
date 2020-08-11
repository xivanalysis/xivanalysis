import {AbilityEvent, BuffEvent, DamageEvent, HealEvent, AbilityEventFields, isDamageEvent, isHealEvent} from 'fflogs'
import {sortEvents} from 'parser/core/EventSorting'
import Module, {dependency} from 'parser/core/Module'
import HitType from 'parser/core/modules/HitType'
import PrecastStatus from './PrecastStatus'
import {Event} from 'events'

// Based on multi-hit margin previously in use for barrage and AOE modules
const LEGACY_MUTLIHIT_DEDUPLICATION_TIME_WINDOW = 500

type BaseEvent = DamageEvent | HealEvent

const supportedBuffEventTypes = ['applybuff', 'removebuff', 'applydebuff', 'removedebuff']
const isSupportedBuffEvent = (event: Event): event is BuffEvent =>
	(supportedBuffEventTypes as any[]).includes(event.type)

const isBaseEvent = (event: Event): event is BaseEvent =>
	isDamageEvent(event) || isHealEvent(event)

const isSupportedEvent = (event: Event): event is BaseEvent | BuffEvent =>
	isBaseEvent(event) || isSupportedBuffEvent(event)

const isBaseEventArray = (array: Array<BaseEvent | BuffEvent>): array is BaseEvent[] =>
	array.length > 0 && isBaseEvent(array[0])

export interface NormalisedEventFields extends AbilityEventFields {
	calculatedEvents: Array<BaseEvent | BuffEvent>
	confirmedEvents: Array<BaseEvent | BuffEvent>
}
export class NormalisedEventFields {
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

export interface NormalisedDamageEvent extends Omit<DamageEvent, 'type' | 'amount' | 'successfulHit'>, NormalisedEventFields {}
export class NormalisedDamageEvent extends NormalisedEventFields {
	type = 'normaliseddamage' as const
	calculatedEvents: DamageEvent[] = []
	confirmedEvents: DamageEvent[] = []

	constructor(event: DamageEvent) {
		super()
		Object.assign(this, (({type, amount, successfulHit, ...props}) => ({...props}))(event))
	}
}

export interface NormalisedHealEvent extends Omit<HealEvent, 'type'| 'amount' | 'successfulHit'>, NormalisedEventFields {}
export class NormalisedHealEvent extends NormalisedEventFields {
	type = 'normalisedheal' as const
	calculatedEvents: HealEvent[] = []
	confirmedEvents: HealEvent[] = []

	constructor(event: HealEvent) {
		super()
		Object.assign(this, (({type, amount, successfulHit, ...props}) => ({...props}))(event))
	}
}

export interface NormalisedApplyBuffEvent extends Omit<BuffEvent, 'type'>, NormalisedEventFields {}
export class NormalisedApplyBuffEvent extends NormalisedEventFields {
	type = 'normalisedapplybuff' as const
	calculatedEvents: BuffEvent[] = []
	confirmedEvents: BuffEvent[] = []

	constructor(event: BuffEvent) {
		super()
		Object.assign(this, (({type, ...props}) => ({...props}))(event))
	}
}



export interface NormalisedApplyDebuffEvent extends Omit<BuffEvent, 'type'>, NormalisedEventFields {}
export class NormalisedApplyDebuffEvent extends NormalisedEventFields {
	type = 'normalisedapplydebuff' as const
	calculatedEvents: BuffEvent[] = []
	confirmedEvents: BuffEvent[] = []

	constructor(event: BuffEvent) {
		super()
		Object.assign(this, (({type, ...props}) => ({...props}))(event))
	}
}

export interface NormalisedRemoveBuffEvent extends Omit<BuffEvent, 'type'>, NormalisedEventFields {}
export class NormalisedRemoveBuffEvent extends NormalisedEventFields {
	type = 'normalisedremovebuff' as const
	calculatedEvents: BuffEvent[] = []
	confirmedEvents: BuffEvent[] = []

	constructor(event: BuffEvent) {
		super()
		Object.assign(this, (({type, ...props}) => ({...props}))(event))
	}
}

export interface NormalisedRemoveDebuffEvent extends Omit<BuffEvent, 'type'>, NormalisedEventFields {}
export class NormalisedRemoveDebuffEvent extends NormalisedEventFields {
	type = 'normalisedremovedebuff' as const
	calculatedEvents: BuffEvent[] = []
	confirmedEvents: BuffEvent[] = []

	constructor(event: BuffEvent) {
		super()
		Object.assign(this, (({type, ...props}) => ({...props}))(event))
	}
}

export type NormalisedEvent =
	| NormalisedDamageEvent
	| NormalisedHealEvent
	| NormalisedApplyBuffEvent
	| NormalisedApplyDebuffEvent
	| NormalisedRemoveBuffEvent
	| NormalisedRemoveDebuffEvent

declare module 'events' {
	interface EventTypeRepository {
		normalisedEvents: NormalisedEvent
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

		const targetsPet = this.parser.pull.actors
			.some(actor => actor.id === event.targetID?.toString() && actor.owner?.playerControlled)
		if (targetsPet) {
			// We're choosing to ignore events that only target pets, since those aren't useful to keep track of
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
				if (event.type === 'applybuff') {
					normalisedEvent = new NormalisedApplyBuffEvent(event)
				} else if (event.type === 'removebuff') {
					normalisedEvent = new NormalisedRemoveBuffEvent(event)
				} else if (event.type === 'applydebuff') {
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
