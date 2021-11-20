import STATUSES from 'data/STATUSES'
import {StatusTimeline as CoreStatusTimeline} from 'parser/core/modules/StatusTimeline'

export class StatusTimeline extends CoreStatusTimeline {
	static override statusesStackMapping = {
		[STATUSES.GIANT_DOMINANCE.id]: STATUSES.EARTHLY_DOMINANCE.id,
	}
}
