import CoreCooldowns from 'parser/core/modules/Cooldowns'
import ACTIONS from 'data/ACTIONS'

export default class Cooldowns extends CoreCooldowns {
	static cooldownOrder = [
		ACTIONS.BARRAGE.id,
		ACTIONS.RAGING_STRIKES.id,
		ACTIONS.BATTLE_VOICE.id,
		{
			name: 'Bloodletter',
			merge: true,
			actions: [
				ACTIONS.BLOODLETTER.id,
				ACTIONS.RAIN_OF_DEATH.id,
			],
		},
		{
			name: 'Songs',
			merge: true,
			actions: [
				ACTIONS.THE_WANDERERS_MINUET.id,
				ACTIONS.MAGES_BALLAD.id,
				ACTIONS.ARMYS_PAEON.id,
			],
		},
		ACTIONS.EMPYREAL_ARROW.id,
		{
			name: 'Sidewinder',
			merge: true,
			actions: [
				ACTIONS.SIDEWINDER.id,
				ACTIONS.SHADOWBITE.id,
			],
		},
		ACTIONS.PITCH_PERFECT.id,
		ACTIONS.TROUBADOUR.id,
		ACTIONS.NATURES_MINNE.id,
		ACTIONS.THE_WARDENS_PAEAN.id,
		ACTIONS.REPELLING_SHOT.id,
	]
}
