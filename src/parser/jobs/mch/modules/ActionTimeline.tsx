import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,
		'AUTOMATON_QUEEN',
		'WILDFIRE',
		'DETONATOR',
		'GAUSS_ROUND',
		'RICOCHET',
		'HYPERCHARGE',
		'BARREL_STABILIZER',
		'REASSEMBLE',
		'QUEEN_OVERDRIVE',
		'TACTICIAN',
		'FLAMETHROWER',
	]
}
