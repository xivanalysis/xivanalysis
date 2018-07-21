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

	// Track the latest RR
	_royalRoad = null

	constructor(...args) {
		super(...args)

		this.addHook('removebuff', {
			abilityId: Object.keys(ROYAL_ROAD_STRENGTH_MODIFIER).map(key => parseInt(key, 10)),
		}, this._onRemoveRoyalRoad)
		this.addHook('applybuff', {abilityId: ARCANA}, this._onApplyArcanum)
	}

	_onRemoveRoyalRoad(event) {
		this._royalRoad = {
			strengthModifier: ROYAL_ROAD_STRENGTH_MODIFIER[event.ability.guid],
			rrAbility: event.ability,
			rrTimestamp: event.timestamp,
		}
	}

	_onApplyArcanum(event) {
		const newEvent = {
			...event,
			type: 'applyarcanum',
			strengthModifier: 1, // Overwritten if there's a RR
		}

		// If there's a recent RR drop, include that info
		if (
			this._royalRoad &&
			event.timestamp - this._royalRoad.rrTimestamp <= ROYAL_ROAD_GRACE
		) {
			Object.assign(newEvent, this._royalRoad)
		}

		this.parser.fabricateEvent(newEvent)
	}
}
