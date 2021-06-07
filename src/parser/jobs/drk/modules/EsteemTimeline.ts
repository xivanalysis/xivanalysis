import ACTIONS from 'data/ACTIONS'
import CorePetTimeline from 'parser/core/modules/PetTimeline'

export class EsteemTimeline extends CorePetTimeline {
	protected override timelineGroupName = 'Esteem'
	protected override timelineSummonAction = ACTIONS.LIVING_SHADOW.id
}
