import CoreCooldowns from 'parser/core/modules/Cooldowns'
import ACTIONS from 'data/ACTIONS'

export default class Cooldowns extends CoreCooldowns {
	static cooldownOrder = [
		ACTIONS.FLAMETHROWER.id,
		ACTIONS.WILDFIRE.id,
		ACTIONS.RAPID_FIRE.id,
		ACTIONS.REASSEMBLE.id,
		ACTIONS.RICOCHET.id,
		ACTIONS.RELOAD.id,
		ACTIONS.QUICK_RELOAD.id,
		ACTIONS.GAUSS_ROUND.id,
		ACTIONS.GAUSS_BARREL.id,
		ACTIONS.BARREL_STABILIZER.id,
		ACTIONS.REMOVE_BARREL.id,
		ACTIONS.HEARTBREAK.id,
		{
			name: 'Turrets',
			actions: [
				{
					name: 'Summon',
					merge: true,
					actions: [
						ACTIONS.ROOK_AUTOTURRET.id,
						ACTIONS.BISHOP_AUTOTURRET.id,
					],
				},
				ACTIONS.HYPERCHARGE.id,
				ACTIONS.ROOK_OVERDRIVE.id,
				ACTIONS.BISHOP_OVERDRIVE.id,
				ACTIONS.TURRET_RETRIEVAL.id,
			],
		},
		ACTIONS.DISMANTLE.id,
		ACTIONS.BLANK.id,
	]
}
