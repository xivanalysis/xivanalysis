import {ActionKey} from 'data/ACTIONS'
import {Events} from 'event'
import {PetTimeline as CorePetTimeline} from 'parser/core/modules/PetTimeline'

const COMMANDED_SKILLS: ActionKey[] = [
	// Egi Assault
	'AERIAL_SLASH',
	'EARTHEN_ARMOR',
	'CRIMSON_CYCLONE',
	// Egi Assault II
	'SLIPSTREAM',
	'SMN_MOUNTAIN_BUSTER',
	'FLAMING_CRUSH',
	// Enkindles
	'AERIAL_BLAST',
	'EARTHEN_FURY',
	'INFERNO',
	// all egis
	'DEVOTION',
	// Bahamut
	'AKH_MORN',
	// Phoenix
	'REVELATION',
]

export class PetTimeline extends CorePetTimeline {

	protected override canPetBeCommanded = true

	private commandSkillsIds = COMMANDED_SKILLS.map(key => this.data.actions[key].id)
	override isCommandedEvent(event: Events['action']): boolean {
		return this.commandSkillsIds.includes(event.action)
	}
}
