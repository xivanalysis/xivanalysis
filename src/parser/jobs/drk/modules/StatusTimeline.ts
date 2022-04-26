import STATUSES from 'data/STATUSES'
import {StatusTimeline as CoreStatusTimeline} from 'parser/core/modules/StatusTimeline'

export class StatusTimeline extends CoreStatusTimeline {
	static override statusesStackMapping = {
		[STATUSES.WALKING_DEAD.id]: STATUSES.LIVING_DEAD.id,
		[STATUSES.UNDEAD_REBIRTH.id]: STATUSES.LIVING_DEAD.id,
	}
}
