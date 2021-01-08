import STATUSES from 'data/STATUSES'
import CoreStatuses from 'parser/core/modules/Statuses'

export default class Statuses extends CoreStatuses {
	static statusesStackMapping = {
		[STATUSES.GIANT_DOMINANCE.id]: STATUSES.EARTHLY_DOMINANCE.id,
	}
}
