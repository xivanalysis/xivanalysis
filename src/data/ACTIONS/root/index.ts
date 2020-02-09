import {ACN} from 'data/ACTIONS/root/ACN'
import {ARC} from 'data/ACTIONS/root/ARC'
import {AST} from 'data/ACTIONS/root/AST'
import {BLM} from 'data/ACTIONS/root/BLM'
import {BLU} from 'data/ACTIONS/root/BLU'
import {BRD} from 'data/ACTIONS/root/BRD'
import {DNC} from 'data/ACTIONS/root/DNC'
import {DRG} from 'data/ACTIONS/root/DRG'
import {DRK} from 'data/ACTIONS/root/DRK'
import {DUTY} from 'data/ACTIONS/root/DUTY'
import {GNB} from 'data/ACTIONS/root/GNB'
import {ITEM_ID_OFFSET, ITEMS} from 'data/ACTIONS/root/ITEMS'
import {LNC} from 'data/ACTIONS/root/LNC'
import {MCH} from 'data/ACTIONS/root/MCH'
import {MNK} from 'data/ACTIONS/root/MNK'
import {MRD} from 'data/ACTIONS/root/MRD'
import {NIN} from 'data/ACTIONS/root/NIN'
import {PGL} from 'data/ACTIONS/root/PGL'
import {PLD} from 'data/ACTIONS/root/PLD'
import {RDM} from 'data/ACTIONS/root/RDM'
import {ROG} from 'data/ACTIONS/root/ROG'
import {SAM} from 'data/ACTIONS/root/SAM'
import {SCH} from 'data/ACTIONS/root/SCH'
import {SMN} from 'data/ACTIONS/root/SMN'
import {WAR} from 'data/ACTIONS/root/WAR'
import {WHM} from 'data/ACTIONS/root/WHM'
import {ROLE} from './ROLE'
import {SHARED} from './SHARED'

export {ITEM_ID_OFFSET}

export const root = {
	...SHARED,
	...ROLE,
	...DUTY,
	...ITEMS,

	...ROG,
	...ARC,
	...ACN,
	...MRD,
	...PGL,
	...LNC,

	...PLD,
	...WAR,
	...DRK,
	...GNB,

	...WHM,
	...SCH,
	...AST,

	...MNK,
	...NIN,
	...SAM,
	...DRG,

	...BRD,
	...MCH,
	...DNC,

	...BLM,
	...SMN,
	...RDM,
	...BLU,
}

export type ActionRoot = typeof root
