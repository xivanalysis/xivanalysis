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
		ACTIONS.INTERVENE.id,
		// Gauge Mitigation
		ACTIONS.SHELTRON.id,
		ACTIONS.INTERVENTION.id,
		// Personal Mitigation
		ACTIONS.HALLOWED_GROUND.id,
		ACTIONS.SENTINEL.id,
		ACTIONS.RAMPART.id,
		// Personal Utility
		ACTIONS.ARMS_LENGTH.id,
		// Party Mitigation
		ACTIONS.PASSAGE_OF_ARMS.id,
		ACTIONS.DIVINE_VEIL.id,
		ACTIONS.REPRISAL.id,
		ACTIONS.COVER.id,
		// Tank Utility
		ACTIONS.PROVOKE.id,
		ACTIONS.SHIRK.id,
		// Disrupt Utility
		ACTIONS.INTERJECT.id,
		ACTIONS.LOW_BLOW.id,
	]
}
