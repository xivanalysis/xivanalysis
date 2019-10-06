import CoreStatuses from 'parser/core/modules/Statuses'
import STATUSES from 'data/STATUSES'

export default class Statuses extends CoreStatuses {
	static statusesStackMapping = {
		[STATUSES.EYES_OPEN.id]: STATUSES.THIRD_EYE.id,
	}
}
