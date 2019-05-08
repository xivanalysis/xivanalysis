import {Actor, Event} from '@xivanalysis/parser-core'
import {Module} from 'analyser/Module'
import _ from 'lodash'

interface ActorMeta {
	actor: Actor
	history: Array<Partial<Actor>>
}

export class Actors extends Module {
	static handle = 'actors'

	private actors = new Map<Actor['id'], ActorMeta>()

	protected init() {
		this.addHook(Event.Type.ADD_ACTOR, this.onAdd)
		this.addHook(Event.Type.UPDATE_ACTOR, this.onUpdate)
		// TODO: onRemove
	}

	private onAdd(event: Event.AddActor) {
		this.actors.set(event.actor.id, {
			actor: event.actor,
			history: [event.actor],
		})
	}

	private onUpdate(event: Event.UpdateActor) {
		const actorMeta = this.actors.get(event.actorId)

		if (!actorMeta) {
			// TODO: This might be common in ACT logs, though possibly an issue for the pipeline, not the analyser?
			throw new Error(`Actor ${event.actorId} was updated without being added.`)
		}

		actorMeta.actor = _.merge(actorMeta.actor, event.changes)
		actorMeta.history.push(event.changes)
	}

	/** Get a representation of the specified actor at the time of the call */
	getActor(actorId: number) {
		const actorMeta = this.actors.get(actorId)
		if (!actorMeta) { return }

		return actorMeta.actor
	}
}
