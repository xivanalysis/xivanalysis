import ACTIONS from 'data/ACTIONS'
import CorePetTimeline from 'parser/core/modules/PetTimeline'

export default class QueenTimeline extends CorePetTimeline {
	protected override timelineGroupName = 'Automaton Queen'
	protected override timelineSummonAction = ACTIONS.AUTOMATON_QUEEN.id
}
