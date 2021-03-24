import {Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {Actor as ReportActor} from 'report'
import {Actor} from './Actor'

export class Actors extends Analyser {
	static handle = 'actors'
	static debug = true

	private actors = new Map<ReportActor['id'], Actor>()

	initialise() {
		this.addEventHook('actorUpdate', this.onUpdate)
	}

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
		this.debug('building actor', actor)

		return actor
	}

	private onUpdate(event: Events['actorUpdate']) {
		const actor = this.get(event.actor)
		actor.update(event)
	}
}
