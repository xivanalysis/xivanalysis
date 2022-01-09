import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,

		'ARCANE_CIRCLE',
		'ENSHROUD',
		['LEMURES_SLICE', 'LEMURES_SCYTHE'],
		'GLUTTONY',
		// Ingress and Egress share a CDG - we don't need to specify both to combine.
		['HELLS_INGRESS', 'REGRESS'],
		'ARCANE_CREST',
	]
}
