import ACTIONS from 'data/ACTIONS'
import {PetTimeline} from 'parser/core/modules/PetTimeline'

export class EsteemTimeline extends PetTimeline {
	protected override timelineGroupName = 'Esteem'
	protected override timelineSummonAction = ACTIONS.LIVING_SHADOW.id
}
