import ENEMY from './root/ENEMY'
import ROLE from './root/ROLE'
import SHARED from './root/SHARED'
import {ACN} from './root/ACN'
import SCH from './root/SCH'
import AST from './root/AST'
import MNK from './root/MNK'
import DRG from './root/DRG'
import NIN from './root/NIN'
import BRD from './root/BRD'
import MCH from './root/MCH'
import SMN from './root/SMN'
import BLM from './root/BLM'
import RDM from './root/RDM'
import WAR from './root/WAR'
import WHM from './root/WHM'
import PLD from './root/PLD'
import SAM from './root/SAM'
import DRK from './root/DRK'
import GNB from './root/GNB'
import DNC from './root/DNC'

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
	})
	return obj
}

export default STATUSES
