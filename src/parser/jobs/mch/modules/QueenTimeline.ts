import ACTIONS from 'data/ACTIONS'
import CorePetTimeline from 'parser/core/modules/PetTimeline'

export default class QueenTimeline extends CorePetTimeline {
	protected timelineGroupName = 'Automaton Queen'
	protected timelineSummonAction = ACTIONS.AUTOMATON_QUEEN.id
}
