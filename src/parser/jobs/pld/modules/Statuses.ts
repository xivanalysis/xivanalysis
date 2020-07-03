import CoreStatuses from 'parser/core/modules/Statuses'
import STATUSES from 'data/STATUSES'

export default class Statuses extends CoreStatuses {
	static statusesStackMapping = {
		[STATUSES.DIVINE_VEIL_PROC.id]: STATUSES.DIVINE_VEIL.id,
	}
}
