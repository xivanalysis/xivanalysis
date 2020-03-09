import STATUSES from 'data/STATUSES'
import CoreStatuses from 'parser/core/modules/Statuses'

export class Statuses extends CoreStatuses {
	static statusesStackMapping = {
		[STATUSES.WALKING_DEAD.id]: STATUSES.LIVING_DEAD.id,
	}
}
