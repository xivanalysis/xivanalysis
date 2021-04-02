import {Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {Actor as ReportActor} from 'report'
import {Actor} from './Actor'

export class Actors extends Analyser {
	static handle = 'actors'

	private actors = new Map<ReportActor['id'], Actor>()

	initialise() {
		this.addEventHook('actorUpdate', this.onUpdate)
	}

	/** Data for the actor currently being analysed. */
	get current() {
		return this.get(this.parser.actor.id)
	}

	/** Retrive the data for the actor of the specified ID. */
	get(id: ReportActor['id']) {
		let actor = this.actors.get(id)
		if (actor != null) {
			return actor
		}

		const reportActor = this.parser.pull.actors
			.find(actor => actor.id === id)

		if (reportActor == null) {
			throw new Error(`Actor ${id} does not exist within pull ${this.parser.pull.id}`)
		}

		actor = new Actor({actor: reportActor})
		this.actors.set(id, actor)

		return actor
	}

	private onUpdate(event: Events['actorUpdate']) {
		const actor = this.get(event.actor)
		actor.update(event)
	}
}
