import {Events, HitType} from '@xivanalysis/parser-core'
import {Module} from 'analyser/Module'

// TODO: These should probably be in the parser
const isPrepare = (event: Events.Base): event is Events.Prepare =>
	event.type === Events.Type.PREPARE
const isAction = (event: Events.Base): event is Events.Action =>
	event.type === Events.Type.ACTION
const isDamage = (event: Events.Base): event is Events.Damage =>
	event.type === Events.Type.DAMAGE

export class PrecastAction extends Module {
	static handle = 'precastAction'

	async normalise(events: Events.Base[]) {
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
			if (!isDamage(magicBullshit) || magicBullshit.hitType !== HitType.HIT) {
				break
			}

			const newEvent: Events.Action = {
				...magicBullshit,
				type: Events.Type.ACTION,
			}
			events.splice(i, 0, newEvent)
			break
		}

		return events
	}
}
