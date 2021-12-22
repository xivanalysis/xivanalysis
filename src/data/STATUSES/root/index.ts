import {AST} from './AST'
import {BLM} from './BLM'
import {BLU} from './BLU'
import {BRD} from './BRD'
import {DNC} from './DNC'
import {DRG} from './DRG'
import {DRK} from './DRK'
import {ENEMY} from './ENEMY'
import {GNB} from './GNB'
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

export const root = {
	...ENEMY,
	...ROLE,
	...SHARED,

	...PLD,
	...WAR,
	...DRK,
	...GNB,

	...SCH,
	...AST,
	...WHM,
	...SGE,

	...MNK,
	...DRG,
	...NIN,
	...SAM,
	...RPR,

	...BRD,
	...MCH,
	...DNC,

	...SMN,
	...BLM,
	...RDM,
	...BLU,
}

export type StatusRoot = typeof root
