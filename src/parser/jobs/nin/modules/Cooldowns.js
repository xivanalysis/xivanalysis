import CoreCooldowns from 'parser/core/modules/Cooldowns'
import ACTIONS from 'data/ACTIONS'

export default class Cooldowns extends CoreCooldowns {
	static cooldownOrder = [
		{
			name: 'Ninjutsu',
			actions: [
				{
					name: 'Mudras',
					merge: true,
					actions: [
						ACTIONS.TEN.id,
						ACTIONS.CHI.id,
						ACTIONS.JIN.id,
					],
				},
				ACTIONS.FUMA_SHURIKEN.id,
				ACTIONS.RAITON.id,
				ACTIONS.SUITON.id,
				ACTIONS.KATON.id,
				ACTIONS.DOTON.id,
				ACTIONS.HUTON.id,
				ACTIONS.HYOTON.id,
				ACTIONS.RABBIT_MEDIUM.id,
			],
		},
		ACTIONS.KASSATSU.id,
		ACTIONS.TEN_CHI_JIN.id,
		ACTIONS.TRICK_ATTACK.id,
		ACTIONS.DREAM_WITHIN_A_DREAM.id,
		ACTIONS.DUALITY.id,
		ACTIONS.BHAVACAKRA.id,
		ACTIONS.MUG.id,
		ACTIONS.JUGULATE.id,
		ACTIONS.HELLFROG_MEDIUM.id,
		ACTIONS.ASSASSINATE.id,
		ACTIONS.SHADEWALKER.id,
		ACTIONS.SMOKE_SCREEN.id,
		ACTIONS.SHUKUCHI.id,
		ACTIONS.SHADE_SHIFT.id,
	]
}
