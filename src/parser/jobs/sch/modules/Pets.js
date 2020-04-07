import ACTIONS from 'data/ACTIONS'
import PetTimeline from 'parser/core/modules/PetTimeline'

const PET_ACTIONS_FROM_COMMANDS = [
	ACTIONS.WHISPERING_DAWN.id,
	ACTIONS.FEY_ILLUMINATION.id,
	ACTIONS.FEY_BLESSING.id,
	ACTIONS.CONSOLATION.id,
	ACTIONS.ANGELS_WHISPER.id,
	ACTIONS.FEY_UNION.id,
	ACTIONS.SERAPHIC_ILLUMINATION.id,
]

export default class Pets extends PetTimeline {
	static handle = 'schfaerietimeline'

	canPetBeCommanded = true

	isCommandedEvent(event) {
		const guid = event.ability.guid
		if (PET_ACTIONS_FROM_COMMANDS.includes(guid)) {
			return true
		}
		return false
	}
}
