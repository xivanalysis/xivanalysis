import {ACTIONS} from 'data/ACTIONS'
import {PetTimeline} from 'parser/core/modules/PetTimeline'

export class QueenTimeline extends PetTimeline {
	protected override timelineGroupName = 'Automaton Queen'
	protected override timelineSummonAction = ACTIONS.AUTOMATON_QUEEN.id
}
