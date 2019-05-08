import {Event, HitType} from '@xivanalysis/parser-core'
import {Module} from 'analyser/Module'

export class PrecastAction extends Module {
	static handle = 'precastAction'

	async normalise(events: Event.Base[]) {
		for (let i = 0; i < events.length; i++) {
			const event = events[i]

			// Filter down to a few event types, where we're directly dealing with the player
			if (
				(!Event.isPrepare(event) &&
					!Event.isAction(event) &&
					!Event.isDamage(event)) ||
				event.sourceId !== this.analyser.actor.id
			) {
				continue
			}

			// Only need to run fixes if we get to a damage before an action
			// Also stopping if it's a status damage hit, as we can't easily derive an
			// action event from that.
			if (!Event.isDamage(event) || event.hit.type !== HitType.HIT) {
				break
			}

			const newEvent: Event.Action = {
				type: Event.Type.ACTION,
				timestamp: event.timestamp,
				actionId: event.hit.actionId,
				sourceId: event.sourceId,
				targetId: event.targetId,
			}
			events.splice(i, 0, newEvent)
			break
		}

		return events
	}
}
