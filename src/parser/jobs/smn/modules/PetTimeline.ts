import ACTIONS from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import CorePetTimeline from 'parser/core/modules/PetTimeline'

const COMMANDED_SKILLS: number[] = [
	// Egi Assault
	ACTIONS.AERIAL_SLASH.id,
	ACTIONS.EARTHEN_ARMOR.id,
	ACTIONS.CRIMSON_CYCLONE.id,
	// Egi Assault II
	ACTIONS.SLIPSTREAM.id,
	ACTIONS.SMN_MOUNTAIN_BUSTER.id,
	ACTIONS.FLAMING_CRUSH.id,
	// Enkindles
	ACTIONS.AERIAL_BLAST.id,
	ACTIONS.EARTHEN_FURY.id,
	ACTIONS.INFERNO.id,
	// all egis
	ACTIONS.DEVOTION.id,
	// Bahamut
	ACTIONS.AKH_MORN.id,
	// Phoenix
	ACTIONS.REVELATION.id,
]

export class PetTimeline extends CorePetTimeline {

	protected canPetBeCommanded = true

	isCommandedEvent(event: CastEvent) {
		return COMMANDED_SKILLS.includes(event.ability.guid)
	}
}
