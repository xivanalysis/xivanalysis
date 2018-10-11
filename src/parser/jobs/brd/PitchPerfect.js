/**
 * @author Yumiya
 */
import Module from 'parser/core/Module'
import STATUSES from 'data/STATUSES'

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

export default class PitchPerfect extends Module {
	static handle = 'pitchperfect'
	static dependencies = [
		// Relying on the normaliser from this for the hit type fields
		'hitType', // eslint-disable-line xivanalysis/no-unused-dependencies
	]

	normalise(events) {

		return events
	}

	getEnemy(targetId) {
		return ENEMIES[targetId] || {
			id: targetId,
			dots: {
				[STATUSES.CAUSTIC_BITE.id]: {
					application: null,
					removal: null,
					isRunning: () => { return this.application && this.application.timestamp || this.removal < 0 && this.removal.timestamp || 0 },
				},
				[STATUSES.STORMBITE.id]: {
					application: null,
					removal: null,
					isRunning: () => { return this.application && this.application.timestamp || this.removal < 0 && this.removal.timestamp || 0 },
				},
			},
			hasDot: (id) => { return this.dots[id] || false },
		}
	}

}
