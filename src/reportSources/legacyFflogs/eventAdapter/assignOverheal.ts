import {Event, Events} from 'event'
import {FflogsEvent, HealEvent} from 'fflogs'
import {AdapterStep} from './base'

/**
 * FFLogs models healing events as "calculatedheal" events at the time of cast (e.g. Character prepares Action on Target Amount)
 * and then as "heal" events at the time the effect resolves (e.g. Character Action Target Amount)
 * The two separate events have the same SequenceID, but overheal is reported on the effect resolution packet only.
 * We need to add the overheal amounts to the main heal events as well
 *
 * IMPORTANT: This adapter MUST run before the AOE deduplication adapter, as the AOE deduplication breaks the assumption of this adapter that only one target exists per event
 */
export class AssignOverhealStep extends AdapterStep {
	private healEvents = new Map<string, Events['heal']>()

	override adapt(baseEvent: FflogsEvent, adaptedEvents: Event[]): Event[] {
		switch (baseEvent.type) {
		case 'calculatedheal':
			this.storeHealEvent(adaptedEvents)
			break
		case 'heal':
			this.populateOverheal(baseEvent, adaptedEvents)
			break
		}

		return adaptedEvents
	}

	override postprocess(adaptedEvents: Event[]) {
		this.setUnmatchedHealsToOverheal()
		return adaptedEvents
	}

	private storeHealEvent(adaptedEvents: Event[]) {
		const healEvent = adaptedEvents.find((e): e is Events['heal'] => e.type === 'heal')
		if (healEvent != null && healEvent.sequence != null) {
			this.healEvents.set(this.buildIdentifierFromMultiTarget(healEvent), healEvent)
		}
	}

	private populateOverheal(baseEvent: HealEvent, adaptedEvents: Event[]) {
		const executeEvent = adaptedEvents.find((e): e is Events['execute'] => e.type === 'execute')
		if (executeEvent == null) {
			return
		}

		const eventIdentifier = this.buildIdentifierFromSingleTarget(executeEvent)
		const healEvent = this.healEvents.get(eventIdentifier)
		if (healEvent == null) {
			return
		}

		healEvent.targets[0].overheal = baseEvent.overheal ?? 0
		this.healEvents.delete(eventIdentifier)
	}

	private setUnmatchedHealsToOverheal() {
		// Any heal events remaining in the state tracker were unpaired, assume fully overheal
		//   (they may also have ghosted if the target died, but this matches the vastly more common case, and what FFLogs's data tables assume)
		this.healEvents.forEach(event => event.targets[0].overheal = event.targets[0].amount)
	}

	private buildIdentifierFromMultiTarget(event: Events['heal']): string {
		if (event.sequence == null) {
			return ''
		}

		return `${event.sequence.toString()}-${event.targets[0].target}`
	}

	private buildIdentifierFromSingleTarget(event: Events['execute']): string {
		return `${event.sequence.toString()}-${event.target}`
	}
}
