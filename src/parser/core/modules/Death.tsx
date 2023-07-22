import {Plural, Trans} from '@lingui/react'
import {Event, Events, FieldsBase, Resource} from 'event'
import React from 'react'
import {Actor} from 'report'
import {Analyser} from '../Analyser'
import {EventHook} from '../Dispatcher'
import {filter} from '../filter'
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

export interface ActorDeathInfo {
	timestampDeath?: Event['timestamp']
	timestampTranscendent?: Event['timestamp']
	count: number
	duration: number
	raiseHook?: EventHook<Events['actorUpdate']>
}

export class Death extends Analyser {
	static override handle = 'death'
	static override debug = true

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline

	/** Accumulated time the parsed actor has spent dead over the course of the fight. */
	get deadTime() {
		return this.getDuration(this.parser.actor.id)
	}

	private info = new Map<Actor['id'], ActorDeathInfo>()

	getCount(actorId: Actor['id']) {
		return this.getActorInfo(actorId).count
	}

	getDuration(actorId: Actor['id']) {
		const actorInfo = this.getActorInfo(actorId)
		const timestamp = this.parser.currentEpochTimestamp
		const currentDeadTime = timestamp - (actorInfo.timestampDeath ?? timestamp)
		return actorInfo.duration + currentDeadTime
	}

	override initialise() {
		// An actor hitting 0 HP is a sign of a death.
		this.addEventHook({
			type: 'actorUpdate',
			hp: {current: 0},
		}, this.onDeath)

		// An actor gaining transcendent is a sign of a raise.
		this.addEventHook({
			type: 'statusApply',
			status: this.data.statuses.TRANSCENDENT.id,
		}, this.onTranscendentApply)

		// Any possible death events before transcendent falls off are flakes
		this.addEventHook({
			type: 'statusRemove',
			status: this.data.statuses.TRANSCENDENT.id,
		}, this.onTranscendentRemove)

		this.addEventHook('complete', this.onComplete)
	}

	private getActorInfo(actorId: Actor['id']): ActorDeathInfo {
		let actorInfo = this.info.get(actorId)
		if (actorInfo == null) {
			actorInfo = {count: 0, duration: 0}
			this.info.set(actorId, actorInfo)
		}
		return actorInfo
	}

	private onDeath(event: Events['actorUpdate']) {
		const actorInfo = this.getActorInfo(event.actor)

		// If we already have a death being tracked, or the player is still
		// transcendent, it's likely duplicate info, noop
		if (
			actorInfo.timestampDeath != null
			|| actorInfo.timestampTranscendent != null
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

		actorInfo.timestampDeath = event.timestamp
		actorInfo.count++

		// Keep an eye out for the actor gaining health post-death - it signals that it has resurrected in some
		// manner that bypassed the transcendent check. Transcendent itself is applied before any HP gain, so
		// player actors will likely not trigger this hook.
		actorInfo.raiseHook = this.addEventHook(
			filter<Event>()
				.type('actorUpdate')
				.actor(event.actor)
				.hp(filter<Resource>()
					.current((value): value is number => value > 0)),
			event => this.onRaise(event.actor, event.timestamp),
		)
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
		const actorInfo = this.getActorInfo(event.target)
		actorInfo.timestampTranscendent = event.timestamp
		this.onRaise(event.target, event.timestamp)
	}

	private onTranscendentRemove(event: Events['statusRemove']) {
		const actorInfo = this.getActorInfo(event.target)
		actorInfo.timestampTranscendent = undefined
	}

	private onRaise(actorId: Actor['id'], timestamp: Event['timestamp']) {
		const actorInfo = this.getActorInfo(actorId)

		// If there's no current death, likely duplicate info, noop
		if (actorInfo.timestampDeath == null) { return }

		// We only show the parsed player's deaths on the timeline itself
		if (actorId === this.parser.actor.id) {
			this.addDeathToTimeline(actorInfo.timestampDeath, timestamp)
		}

		actorInfo.duration += timestamp - actorInfo.timestampDeath
		actorInfo.timestampDeath = undefined

		if (actorInfo.raiseHook != null) {
			this.removeEventHook(actorInfo.raiseHook)
			actorInfo.raiseHook = undefined
		}

		// Queue the raise notification.
		this.parser.queueEvent({
			type: 'raise',
			timestamp,
			actor: actorId,
		})
	}

	protected deathSuggestionWhy(_actorId: Actor['id'], playerInfo: ActorDeathInfo): JSX.Element {
		return <Plural
			id="core.deaths.why"
			value={playerInfo.count}
			_1="# death"
			other="# deaths"
		/>
	}

	private onComplete(event: Events['complete']) {
		for (const [actorId, actorInfo] of this.info) {
			// If the actor was dead on completion, and the pull was a wipe, refund the
			// death. It's pretty meaningless to complain about the wipe itself.
			if (
				(this.parser.pull.progress ?? 0) < 100
				&& actorInfo.timestampDeath != null
			) {
				actorInfo.count = Math.max(actorInfo.count - 1, 0)
			}

			// Run raise cleanup in case the actor was dead on completion
			this.onRaise(actorId, event.timestamp)
		}

		const playerInfo = this.getActorInfo(this.parser.actor.id)
		if (playerInfo.count === 0) { return }

		// Deaths are pretty morbid
		this.suggestions.add(new Suggestion({
			icon: this.data.actions.RAISE.icon,
			content: <Trans id="core.deaths.content">
				Don't die. Between downtime, lost gauge resources, and resurrection debuffs, dying is absolutely <em>crippling</em> to damage output.
			</Trans>,
			severity: SEVERITY.MORBID,
			why: this.deathSuggestionWhy(this.parser.actor.id, playerInfo),
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
