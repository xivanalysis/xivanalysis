import {Event, HitType} from '@xivanalysis/parser-core'
import {Module} from 'analyser/Module'

// TODO: These should probably be in the parser
const isPrepare = (event: Event.Base): event is Event.Prepare =>
	event.type === Event.Type.PREPARE
const isAction = (event: Event.Base): event is Event.Action =>
	event.type === Event.Type.ACTION
const isDamage = (event: Event.Base): event is Event.Damage =>
	event.type === Event.Type.DAMAGE

export class PrecastAction extends Module {
	static handle = 'precastAction'

	async normalise(events: Event.Base[]) {
		for (let i = 0; i < events.length; i++) {
			const event = events[i]

			// Filter down to a few event types, where we're directly dealing with the player
			if (
				(!isPrepare(event) &&
				!isAction(event) &&
				!isDamage(event)) ||
				event.sourceId !== this.analyser.actor.id
			) {
				continue
			}

			// Only need to run fixes if we get to a damage before an action
			// Also stopping if it's a status damage hit, as we can't easily derive an
			// action event from that.
			// Blame typescript for the magic, don't ask
			const magicBullshit = event
			if (!isDamage(magicBullshit) || magicBullshit.hit.type !== HitType.HIT) {
				break
			}

			const newEvent: Event.Action = {
				type: Event.Type.ACTION,
				timestamp: magicBullshit.timestamp,
				actionId: magicBullshit.hit.actionId,
				sourceId: magicBullshit.sourceId,
				targetId: magicBullshit.targetId,
			}
			events.splice(i, 0, newEvent)
			break
		}

		return events
	}
}
