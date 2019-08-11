import Module from 'parser/core/Module'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'

// Statuses applied before the pull won't have an apply(de)?buff event
// Fake buff applications so modules don't need to take it into account
export default class PrecastStatus extends Module {
	static handle = 'precastStatus'
	static dependencies = [
		// Forcing action to run first, cus we want to always splice in before it.
		'precastAction', // eslint-disable-line @xivanalysis/no-unused-dependencies
	]

	_combatantStatuses = {}

	normalise(events) {
		const startTime = this.parser.fight.start_time

		for (let i = 0; i < events.length; i++) {
			const event = events[i]
			const targetId = event.targetID

			this._combatantStatuses[targetId] = this._combatantStatuses[targetId] || []

			if (event.type === 'applybuff') {
				this._combatantStatuses[targetId].push(event.ability.guid)
			}

			if (['removebuff', 'applybuffstack', 'removebuffstack', 'refreshbuff'].includes(event.type)) {
				const statusId = event.ability.guid

				// If it's already been applied, we don't have to worry about it
				if (this._combatantStatuses[targetId].includes(statusId)) {
					continue
				}

				// Fab an event and splice it in at the start of the fight
				events.splice(0, 0, {
					// Can inherit most of the event data from the current one
					...event,
					// Override a few vals
					timestamp: startTime - 1,
					type: 'applybuff',
				})

				// Determine if this buff comes from a known action, fab a cast event
				const statusInfo = getDataBy(STATUSES, 'id', event.ability.guid)
				if (statusInfo && statusInfo.actionId) {
					const castAbility = getDataBy(ACTIONS, 'id', statusInfo.actionId)
					if (castAbility) {
						const castEvent = event
						castEvent.timestamp = startTime - 2
						castEvent.type = 'cast'
						castEvent.ability.guid = castAbility.id

						events.splice(0, 0, castEvent)
					}
				}

				this._combatantStatuses[targetId].push(statusId)
			}
		}

		return events
	}
}
