import {ACN} from './ACN'
import {ARC} from './ARC'
import {AST} from './AST'
import {BLM} from './BLM'
import {BLU} from './BLU'
import {BRD} from './BRD'
import {DNC} from './DNC'
import {DRG} from './DRG'
import {DRK} from './DRK'
import {DUTY} from './DUTY'
import {GNB} from './GNB'
import {ITEM_ID_OFFSET, ITEMS} from './ITEMS'
import {LIMIT_BREAK} from './LIMIT_BREAK'
import {LNC} from './LNC'
import {MCH} from './MCH'
import {MNK} from './MNK'
import {MRD} from './MRD'
import {NIN} from './NIN'
import {PGL} from './PGL'
import {PLD} from './PLD'
import {RDM} from './RDM'
import {ROG} from './ROG'
import {ROLE} from './ROLE'
import {SAM} from './SAM'
import {SCH} from './SCH'
import {SHARED} from './SHARED'
import {SMN} from './SMN'
import {WAR} from './WAR'
import {WHM} from './WHM'

export {ITEM_ID_OFFSET}

export const root = {
	...SHARED,
	...ROLE,
	...DUTY,
	...ITEMS,
	...LIMIT_BREAK,

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
