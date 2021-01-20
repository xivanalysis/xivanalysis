import {Plural, Trans} from '@lingui/react'
import {Event, Events, FieldsBase} from 'event'
import React from 'react'
import {Actor} from 'report'
import {Analyser} from '../Analyser'
import {dependency} from '../Injectable'
import {Data} from './Data'
import Suggestions, {SEVERITY, Suggestion} from './Suggestions'
import {SimpleItem, Timeline} from './Timeline'

interface EventDeath extends FieldsBase {
	/** Actor that died. */
	actor: Actor['id'],
	/**
	 * Whether or not the death should be counted.
	 * @see `Death#shouldCountDeath`
	 */
	counted: boolean
}

interface EventRaise extends FieldsBase {
	/** Actor that was raised. */
	actor: Actor['id']
}

declare module 'event' {
	interface EventTypeRepository {
		death: EventDeath
		raise: EventRaise
	}
}

// Legacy events for backwards compat
interface LegacyRaiseEvent {
	type: 'raise'
	timestamp: number
	targetID: number
}

declare module 'legacyEvent' {
	interface EventTypeRepository {
		death: LegacyRaiseEvent
	}
}

export class Death extends Analyser {
	static handle = 'death'
	static debug = true

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline

	/** Accumulated time the parsed actor has spent dead over the course of the fight. */
	get deadTime() {
		const timestamp = this.parser.currentEpochTimestamp
		const currentDeadTime = timestamp - (this.currentDeathTimestamp ?? timestamp)
		return this._deadTime + currentDeadTime
	}

	private currentDeathTimestamp?: Event['timestamp']
	private currentTranscendentTimestamp?: Event['timestamp']
	private count = 0
	private _deadTime = 0

	initialise() {
		// An actor hitting 0 HP is a sign of a death.
		this.addEventHook({
			type: 'actorUpdate',
			actor: this.parser.actor.id,
			hp: {current: 0},
		}, this.onDeath)

		// An actor gaining transcendent is a sign of a raise.
		this.addEventHook({
			type: 'statusApply',
			status: this.data.statuses.TRANSCENDENT.id,
			target: this.parser.actor.id,
		}, this.onTranscendentApply)

		// Any possible death events before transcendent falls off are flakes
		this.addEventHook({
			type: 'statusRemove',
			status: this.data.statuses.TRANSCENDENT.id,
			target: this.parser.actor.id,
		}, this.onTranscendentRemove)

		this.addEventHook('complete', this.onComplete)
	}

	private onDeath(event: Events['actorUpdate']) {
		// If we already have a death being tracked, or the player is still
		// transcendent, it's likely duplicate info, noop
		if (
			this.currentDeathTimestamp != null
			|| this.currentTranscendentTimestamp != null
		) { return }

		const counted = this.shouldCountDeath(event)

		// Queue an event for the death
		this.parser.queueEvent({
			type: 'death',
			timestamp: event.timestamp,
			actor: event.actor,
			counted,
		})

		// If we're not counting, can stop here
		if (!counted) { return }

		this.currentDeathTimestamp = event.timestamp
		this.count++
	}

	/**
	 * Determine if an event presumed to represent an actor's death should
	 * be counted as such. Override and provide custom logic for cases where
	 * a death is forced by fights or otherwise cannot be avoided.
	 * @param _event ActorUpdate event marking the actor's death.
	 */
	protected shouldCountDeath(_event: Events['actorUpdate']) {
		return true
	}

	private onTranscendentApply(event: Events['statusApply']) {
		this.currentTranscendentTimestamp = event.timestamp
		this.onRaise(event)
	}

	private onTranscendentRemove(_event: Events['statusRemove']) {
		this.currentTranscendentTimestamp = undefined
	}

	private onRaise(event: Event) {
		// If there's no current death, likely duplicate info, noop
		if (this.currentDeathTimestamp == null) { return }

		this.addDeathToTimeline(this.currentDeathTimestamp, event.timestamp)

		// Queue the raise notification.
		// Also fabricating a legacy event for backwards compatibility.
		this.parser.queueEvent({
			type: 'raise',
			timestamp: event.timestamp,
			actor: this.parser.actor.id,
		})
		this.parser.fabricateLegacyEvent({
			type: 'raise',
			timestamp: this.parser.currentTimestamp,
			targetID: this.parser.player.id,
		})

		this.currentDeathTimestamp = undefined
	}

	private onComplete(event: Events['complete']) {
		// If the actor was dead on completion, and the pull was a wipe, refund the
		// death. It's pretty meaningless to complain about the wipe itself.
		if (
			(this.parser.pull.progress ?? 0) < 100
			&& this.currentDeathTimestamp != null
		) {
			this.count = Math.max(this.count - 1, 0)
		}

		// Run raise cleanup in case the actor was dead on completion
		this.onRaise(event)

		if (this.count === 0) { return }

		// Deaths are pretty morbid
		this.suggestions.add(new Suggestion({
			icon: this.data.actions.RAISE.icon,
			content: <Trans id="core.deaths.content">
				Don't die. Between downtime, lost gauge resources, and resurrection debuffs, dying is absolutely <em>crippling</em> to damage output.
			</Trans>,
			severity: SEVERITY.MORBID,
			why: <Plural
				id="core.deaths.why"
				value={this.count}
				_1="# death"
				other="# deaths"
			/>,
		}))
	}

	private addDeathToTimeline(start: number, end: number) {
		this.timeline.addItem(new SimpleItem({
			start: start - this.parser.pull.timestamp,
			end: end - this.parser.pull.timestamp,
			// TODO: Improve?
			content: <div style={{
				width: '100%',
				height: '100%',
				backgroundColor: '#ce909085',
			}}/>,
		}))
	}
}
