import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,

		'ARCANE_CIRCLE',
		'ENSHROUD',
		['LEMURES_SLICE', 'LEMURES_SCYTHE'],
		'GLUTTONY',
		['HELLS_INGRESS', 'HELLS_EGRESS', 'REGRESS'],
		'ARCANE_CREST',
	]
}
