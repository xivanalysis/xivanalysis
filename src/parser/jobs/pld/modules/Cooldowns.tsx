import ACTIONS from 'data/ACTIONS'
import CoreCooldowns from 'parser/core/modules/Cooldowns'

export default class Cooldowns extends CoreCooldowns {
	static cooldownOrder = [
		// Buffs
		ACTIONS.FIGHT_OR_FLIGHT.id,
		ACTIONS.REQUIESCAT.id,
		// oGCD Damage
		ACTIONS.SPIRITS_WITHIN.id,
		ACTIONS.CIRCLE_OF_SCORN.id,
		ACTIONS.SHIELD_SWIPE.id,
		// Gauge Mitigation
		ACTIONS.SHELTRON.id,
		ACTIONS.INTERVENTION.id,
		// Personal Mitigation
		ACTIONS.HALLOWED_GROUND.id,
		ACTIONS.SENTINEL.id,
		ACTIONS.RAMPART.id,
		ACTIONS.BULWARK.id,
		ACTIONS.CONVALESCENCE.id,
		ACTIONS.AWARENESS.id,
		ACTIONS.ANTICIPATION.id,
		// Personal Utility
		ACTIONS.TEMPERED_WILL.id,
		// Party Mitigation
		ACTIONS.PASSAGE_OF_ARMS.id,
		ACTIONS.DIVINE_VEIL.id,
		ACTIONS.REPRISAL.id,
		ACTIONS.COVER.id,
		// Tank Utility
		ACTIONS.PROVOKE.id,
		ACTIONS.ULTIMATUM.id,
		ACTIONS.SHIRK.id,
		// Disrupt Utility
		ACTIONS.INTERJECT.id,
		ACTIONS.LOW_BLOW.id,
	]
}
