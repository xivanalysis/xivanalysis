import {Event} from 'event'
import {Actor} from 'report'
import {resolveActorId} from '../base'
import {FflogsEvent} from '../eventTypes'
import {AdapterOptions, AdapterStep, MutationAdaptionResult} from './base'

/*
Yeah, there's a bit of a story to this one.

In some rare cases, fflogs will report metadata for two or more instances of an
enemy, where all but one of those instances gets hit by 1-2 events total before
being unused for the remainder of the fight. Unlike most cases of these "unused"
actors common in XIV fight design, these actors share their `kind` (BNpc metadata)
with the real enemy itself - likely due to the issue being caused by logging
tools - and are therefore difficult to seperate in an automated manner.

To work around this issue, this file acts as a manually-maintained list of actor
kinds that exhibit this behavior. Any actors with their kind listed here will
have all instance metadata stripped from their events, resulting in all events
involving the targeted actor kind converging on a single "conglomerate" actor.
Given this is only intended to be used when the existence of other instances is
erroneous in the first place, that should be safe.

Before adding anything to this file, make absolutely sure that it can't be
otherwise resolved through parser-land changes, such as boss-specific
invulnerability configuration.
*/

const MERGE_KINDS: Set<Actor['kind']> = new Set([
	// Ex5: Rubicante primary boss instance. Logs intermittently include a brief
	// secondary instance of this actor's kind which can throw off ananalysis
	// around targeting.
	// https://www.fflogs.com/reports/a:DMfrPk7X2qBzHL9y#fight=last&hostility=1&source=243.2&view=events
	'15756',
])

export class MergeActorInstancesStep extends AdapterStep {
	private stripActors: Set<Actor['id']>

	constructor(opts: AdapterOptions) {
		super(opts)

		// Resolve the actor kinds we want to strip instances of to a list of pull-relevant actor IDs.
		const actorIds = this.pull.actors
			.filter(actor => MERGE_KINDS.has(actor.kind))
			.map(actor => actor.id)
		this.stripActors = new Set(actorIds)
	}

	override adapt(baseEvent: FflogsEvent, adaptedEvents:Event[]): MutationAdaptionResult {
		// Check each Fflogs event going through the adapter, stripping actor instances when required.
		let event = baseEvent
		event = this.strip(event, 'source')
		event = this.strip(event, 'target')

		return {
			adaptedEvents,
			dangerouslyMutatedBaseEvent: event,
		}
	}

	private strip<F extends 'source' | 'target'>(event: FflogsEvent, field: F) {
		const idField = `${field}ID` as const
		const instanceField = `${field}Instance` as const

		const actorId = resolveActorId({
			id: event[idField],
			instance: event[instanceField],
			actor: event[field],
		})

		if (!this.stripActors.has(actorId)) {
			return event
		}

		const mutatedEvent = {...event}
		delete mutatedEvent[instanceField]

		return mutatedEvent
	}
}
