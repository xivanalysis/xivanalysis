import CoreStatuses from 'parser/core/modules/Statuses'
import STATUSES from 'data/STATUSES'

export default class Statuses extends CoreStatuses {
	static statusesStackMapping = {
		[STATUSES.WALKING_DEAD.id]: STATUSES.LIVING_DEAD.id,
	}
}
