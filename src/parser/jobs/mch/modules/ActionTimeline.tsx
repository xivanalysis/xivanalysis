import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,
		'AUTOMATON_QUEEN',
		'QUEEN_OVERDRIVE',
		'WILDFIRE',
		'DETONATOR',
		'BARREL_STABILIZER',
		'HYPERCHARGE',
		'GAUSS_ROUND',
		'RICOCHET',
		'REASSEMBLE',
		'CHAIN_SAW',
		'AIR_ANCHOR',
		'DRILL',
		'FLAMETHROWER',
		'TACTICIAN',
	]
}
