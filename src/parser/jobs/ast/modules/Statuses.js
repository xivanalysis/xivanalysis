import CoreStatuses from 'parser/core/modules/Statuses'
import STATUSES from 'data/STATUSES'

export default class Statuses extends CoreStatuses {
	static statusesStackMapping = {
		[STATUSES.GIANT_DOMINANCE.id]: STATUSES.EARTHLY_DOMINANCE.id,
	}
}
