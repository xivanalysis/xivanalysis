import STATUSES from 'data/STATUSES'
import {StatusTimeline as CoreStatusTimeline} from 'parser/core/modules/StatusTimeline'

export class StatusTimeline extends CoreStatusTimeline {
	static override statusesStackMapping = {
		[STATUSES.DIVINE_VEIL_PROC.id]: STATUSES.DIVINE_VEIL.id,
	}
}
