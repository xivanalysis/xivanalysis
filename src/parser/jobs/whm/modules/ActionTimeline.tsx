import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,
		// Selfbuffs
		'PRESENCE_OF_MIND',
		'THIN_AIR',
		//oGCD SingleTarget
		'DIVINE_BENISON',
		'TETRAGRAMMATON',
		'BENEDICTION',
		'AQUAVEIL',
		//oGCD AoE Heal
		['LITURGY_OF_THE_BELL', 'LITURGY_OF_THE_BELL_ACTIVATION', 'LITURGY_OF_THE_BELL_ON_DAMAGE'],
		'ASSIZE',
		'ASYLUM',
		//Group Mitigations
		'TEMPERANCE',
		'PLENARY_INDULGENCE',
		//Role Actions
		'LUCID_DREAMING',
		'SWIFTCAST',
		'SURECAST',
	]
}
