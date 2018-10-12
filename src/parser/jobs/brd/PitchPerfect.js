/**
 * @author Yumiya
 */
import Module from 'parser/core/Module'
//import STATUSES from 'data/STATUSES'
/*
const DOTS = [
	STATUSES.STORMBITE.id,
	STATUSES.CAUSTIC_BITE.id,
]

const ENEMY_DEBUFFS = [
	STATUSES.PIERCING_RESISTANCE_DOWN.id,
	STATUSES.TRICK_ATTACK_VULNERABILITY_UP.id,
	STATUSES.CHAIN_STRATAGEM.id,
	STATUSES.FOE_REQUIEM_DEBUFF.id,
	STATUSES.HYPERCHARGE_VULNERABILITY_UP.id,
	STATUSES.RADIANT_SHIELD_PHYSICAL_VULNERABILITY_UP.id,
]

const PLAYER_BUFFS = [
	STATUSES.RAGING_STRIKES.id,
	STATUSES.STRAIGHT_SHOT.id,
	STATUSES.MEDICATED.id,
	STATUSES.LEFT_EYE.id,
	STATUSES.BROTHERHOOD.id,
	STATUSES.EMBOLDEN_PHYSICAL.id,
	STATUSES.THE_BALANCE.id,
	STATUSES.BATTLE_LITANY.id,
	STATUSES.BATTLE_VOICE.id,
	STATUSES.THE_SPEAR.id,

]

const PLAYER_DEBUFFS = [
	STATUSES.WEAKNESS.id,
	STATUSES.BRINK_OF_DEATH.id,
]
*/
// Enemies
const ENEMIES = {}

//const PLAYER = {}

export default class PitchPerfect extends Module {
	static handle = 'pitchperfect'
	static dependencies = [
		// Relying on the normaliser from this for the hit type fields
		'hitType', // eslint-disable-line xivanalysis/no-unused-dependencies
	]

	normalise(events) {

		for (const event in events) {
			console.log(event)
		}

		return events
	}

	getEnemy(targetId) {
		if (!ENEMIES[targetId]) {
			ENEMIES[targetId] = {
				statuses: {},
			}
		}

		return ENEMIES[targetId]
	}

}
