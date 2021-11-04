import {ACN} from './ACN'
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
import {MCH} from './MCH'
import {MNK} from './MNK'
import {NIN} from './NIN'
import {PLD} from './PLD'
import {RDM} from './RDM'
import {ROLE} from './ROLE'
import {RPR} from './RPR'
import {SAM} from './SAM'
import {SCH} from './SCH'
import {SGE} from './SGE'
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

	...ACN,

	...PLD,
	...WAR,
	...DRK,
	...GNB,

	...WHM,
	...SCH,
	...AST,
	...SGE,

	...MNK,
	...NIN,
	...SAM,
	...DRG,
	...RPR,

	...BRD,
	...MCH,
	...DNC,

	...BLM,
	...SMN,
	...RDM,
	...BLU,
}

export type ActionRoot = typeof root
