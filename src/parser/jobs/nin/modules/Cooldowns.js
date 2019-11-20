import CoreCooldowns from 'parser/core/modules/Cooldowns'
import ACTIONS from 'data/ACTIONS'

export default class Cooldowns extends CoreCooldowns {
	static cooldownOrder = [
		ACTIONS.KASSATSU.id,
		ACTIONS.TEN_CHI_JIN.id,
		ACTIONS.TRICK_ATTACK.id,
		ACTIONS.DREAM_WITHIN_A_DREAM.id,
		ACTIONS.ASSASSINATE.id,
		ACTIONS.BUNSHIN.id,
		ACTIONS.BHAVACAKRA.id,
		ACTIONS.MUG.id,
		ACTIONS.MEISUI.id,
		ACTIONS.HELLFROG_MEDIUM.id,
		ACTIONS.SHUKUCHI.id,
		ACTIONS.SHADE_SHIFT.id,
	]
}
