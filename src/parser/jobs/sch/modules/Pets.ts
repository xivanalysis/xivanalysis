import {ActionKey} from 'data/ACTIONS'
import {Events} from 'event'
import {PetTimeline} from 'parser/core/modules/PetTimeline'

const PET_ACTIONS_FROM_COMMANDS: ActionKey[] = [
	'WHISPERING_DAWN',
	'FEY_ILLUMINATION',
	'FEY_BLESSING',
	'CONSOLATION',
	'ANGELS_WHISPER',
	'FEY_UNION',
	'SERAPHIC_ILLUMINATION',
]

export default class Pets extends PetTimeline {
	static override handle = 'schfaerietimeline'

	protected override canPetBeCommanded = true

	private petActionIds = PET_ACTIONS_FROM_COMMANDS.map(key => this.data.actions[key].id)
	protected override isCommandedEvent(event: Events['action']): boolean {
		return this.petActionIds.includes(event.action)
	}
}
