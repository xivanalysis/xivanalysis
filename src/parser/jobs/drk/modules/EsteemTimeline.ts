import ACTIONS from 'data/ACTIONS'
import CorePetTimeline from 'parser/core/modules/PetTimeline'

export class EsteemTimeline extends CorePetTimeline {
	protected timelineGroupName = 'Esteem'
	protected timelineSummonAction = ACTIONS.LIVING_SHADOW.id
}
