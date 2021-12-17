import {ActionKey} from 'data/ACTIONS'
import {Events} from 'event'
import {PetTimeline as CorePetTimeline} from 'parser/core/modules/PetTimeline'

const COMMANDED_SKILLS: ActionKey[] = [
	// Summons
	'AERIAL_BLAST',
	'EARTHEN_FURY',
	'INFERNO',
	// Carbuncle
	'SEARING_LIGHT',
	// Bahamut
	'AKH_MORN',
	// Phoenix
	'REVELATION',
]

export class PetTimeline extends CorePetTimeline {

	protected override canPetBeCommanded = true

	private commandSkillsIds = COMMANDED_SKILLS.map(key => this.data.actions[key].id)
	protected override isCommandedEvent(event: Events['action']): boolean {
		return this.commandSkillsIds.includes(event.action)
	}
}
