import STATUSES from 'data/STATUSES'
import {StatusTimeline as CoreStatusTimeline} from 'parser/core/modules/StatusTimeline'

export class StatusTimeline extends CoreStatusTimeline {
	static override statusesStackMapping = {
		[STATUSES.EYES_OPEN.id]: STATUSES.THIRD_EYE.id,
	}
}
