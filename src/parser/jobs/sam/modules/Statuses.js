import STATUSES from 'data/STATUSES'
import CoreStatuses from 'parser/core/modules/Statuses'

export default class Statuses extends CoreStatuses {
	static statusesStackMapping = {
		[STATUSES.EYES_OPEN.id]: STATUSES.THIRD_EYE.id,
	}
}
