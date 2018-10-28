import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'

const ROYAL_ROAD_STRENGTH_MODIFIER = {
	[STATUSES.ENHANCED_ROYAL_ROAD.id]: 1.5,
	[STATUSES.EXPANDED_ROYAL_ROAD.id]: 0.5,
	[STATUSES.EXTENDED_ROYAL_ROAD.id]: 1,
}

// Give 2s for royal drop -> card apply because square's networking is trash
const ROYAL_ROAD_GRACE = 2000

const ARCANA = [
	STATUSES.THE_BALANCE.id,
	STATUSES.THE_BOLE.id,
	STATUSES.THE_ARROW.id,
	STATUSES.THE_SPEAR.id,
	STATUSES.THE_EWER.id,
	STATUSES.THE_SPIRE.id,
]

// Handling AST cards in core as they can technically effect anyone
export default class Arcanum extends Module {
	static handle = 'arcanum'
	static dependencies = [
		// AE needs to run its normaliser first
		'additionalEvents', // eslint-disable-line xivanalysis/no-unused-dependencies
	]

	normalise(events) {
		let _royalRoad = null
		const rrIds = Object.keys(ROYAL_ROAD_STRENGTH_MODIFIER).map(key => parseInt(key, 10))

		for (let i = 0; i < events.length; i++) {
			const event = events[i]

			if (!event.ability) { continue }

			// Store the most recent RR
			if (event.type === 'removebuff' && rrIds.includes(event.ability.guid)) {
				_royalRoad = {
					strengthModifier: ROYAL_ROAD_STRENGTH_MODIFIER[event.ability.guid],
					rrAbility: event.ability,
					rrTimestamp: event.timestamp,
				}
				continue
			}

			// Look for card buffs and modify their event data
			if (
				(event.type === 'applybuff' || event.type === 'refreshbuff') &&
				ARCANA.includes(event.ability.guid)
			) {
				let props = {strengthModifier: 1}

				if (_royalRoad && event.timestamp - _royalRoad.rrTimestamp <= ROYAL_ROAD_GRACE) {
					props = _royalRoad
				}

				Object.assign(event, props)
			}
		}

		return events
	}
}
