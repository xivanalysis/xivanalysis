import ENEMY from './ENEMY'
import ROLE from './ROLE'
import SHARED from './SHARED'
import ACN from './ACN'
import SCH from './SCH'
import AST from './AST'
import MNK from './MNK'
import DRG from './DRG'
import NIN from './NIN'
import BRD from './BRD'
import MCH from './MCH'
import SMN from './SMN'
import BLM from './BLM'
import RDM from './RDM'
import WAR from './WAR'
import WHM from './WHM'
import PLD from './PLD'
import SAM from './SAM'
import DRK from './DRK'
import GNB from './GNB'
import DNC from './DNC'

export const STATUS_ID_OFFSET = 1000000

const STATUSES = correctIdsToMatchLogs({
	...ENEMY,
	...ROLE,
	...SHARED,
	...ACN,

	...PLD,
	...WAR,
	...DRK,
	...GNB,

	...SCH,
	...AST,
	...WHM,

	...MNK,
	...DRG,
	...NIN,
	...SAM,

	...BRD,
	...MCH,
	...DNC,

	...SMN,
	...BLM,
	...RDM,
})

/**
 * Presumably because WoW statuses and spells share the same ID space, FFLogs adds 1m to every status ID.
 * I'm not gonna get everyone to do that in here, so just automating it.
 *
 * @template T extends object
 * @param {T} obj
 * @returns {T}
 */
function correctIdsToMatchLogs (obj) {
	Object.keys(obj).forEach(key => {
		const status = obj[key]
		if (Array.isArray(status.id)) {
			status.id = status.id.map(id => id + STATUS_ID_OFFSET)
		} else {
			status.id = status.id + STATUS_ID_OFFSET
		}
		if (status.stackWith) {
			status.stackWith += STATUS_ID_OFFSET
		}
	})
	return obj
}

export const STATUS_EFFECT_TYPES = {
	selfDamageBuff: {
		ids: [
			//			STATUSES.RAGING_STRIKES.id,
			//			STATUSES.BARRAGE.id,
			//			STATUSES.DEVILMENT.id,
		],
		settings: {
			color: '#00FF00',
		},
	},

	partyDamageBuff: {
		ids: [
			//			STATUSES.BATTLE_VOICE.id,
			//			STATUSES.TECHNICAL_FINISH.id,
			//			STATUSES.BATTLE_LITANY.id,
			//			STATUSES.BROTHERHOOD.id,
			//			STATUSES.TRICK_ATTACK_VULNERABILITY_UP.id,
			//			STATUSES.EMBOLDEN_PHYSICAL.id,
			//			STATUSES.CHAIN_STRATAGEM.id,
			//			STATUSES.DEVOTION.id,
		],
		settings: {
			color: '#00FF00',
		},
	},

	partyDamageMitigation: {
		ids: [
			//			STATUSES.SHIELD_SAMBA.id,
			//			STATUSES.DARK_MISSIONARY.id,
			//			STATUSES.HEART_OF_LIGHT.id,
			//			STATUSES.TACTICIAN.id,
			//			STATUSES.PASSAGE_OF_ARMS.id,
		],
		settings: {
			color: '#00FF00',
		},
	},

	partyShield: {
		ids: [
			//			STATUSES.DIVINE_VEIL_AFTER_HEAL.id,
			//			STATUSES.SHAKE_IT_OFF.id,
		],
		settings: {
			color: '#00FF00',
		},
	},

	selfMitigation: {
		ids: [
			//			STATUSES.RAMPART.id,
			//			STATUSES.DARK_MIND.id,
			//			STATUSES.SHADOW_WALL.id,
			//			STATUSES.SENTINEL.id,
			//			STATUSES.SHELTRON.id,
		],
		settings: {
			color: '#FF0000',
		},
	},
}

export default STATUSES
