/**
 * @author Yumiya
 */
import CooldownDowntime from 'parser/core/modules/CooldownDowntime'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'

export default class OGCDDowntime extends CooldownDowntime {

	constructor(...args) {
		super(...args)

		this.trackedCds = [
			ACTIONS.BARRAGE.id,
			ACTIONS.RAGING_STRIKES.id,
			ACTIONS.SIDEWINDER.id,
		]

		this.target = 100
	}

	// This is to handle cases where the player casts Raging Strikes pre-pull
	normalise(events) {
		let firstRagingStrikesCast = 0
		let firstRagingStrikesApply = 0

		// Used to capture a Raging Strike cast to splice a new one easily
		let ragingStrikesCast = {}

		for (const event of events) {
			// Checks to make sure it's the players cast of Raging Strikes
			if (this.parser.byPlayer(event) && event.ability) {
				if (!firstRagingStrikesCast && event.type === 'cast' && event.ability.guid === ACTIONS.RAGING_STRIKES.id) {
					firstRagingStrikesCast = event.timestamp
					ragingStrikesCast = event
				}
				if (!firstRagingStrikesApply && event.type === 'applybuff' && event.ability.guid === STATUSES.RAGING_STRIKES.id) {
					firstRagingStrikesApply = event.timestamp
				}
				// Once we have gotten this information, no need to waste time
				if (firstRagingStrikesCast && firstRagingStrikesApply) {
					break
				}
			}
		}

		if (firstRagingStrikesCast > firstRagingStrikesApply) {
			const insertionIndex = events.findIndex(event => {
				return event.timestamp >= firstRagingStrikesApply
			})
			events.splice(insertionIndex, 0, {
				...ragingStrikesCast,
				timestamp: firstRagingStrikesApply,
			})
		}
		return events
	}
}
