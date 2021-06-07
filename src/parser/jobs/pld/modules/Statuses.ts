import STATUSES from 'data/STATUSES'
import CoreStatuses from 'parser/core/modules/Statuses'

export default class Statuses extends CoreStatuses {
	static override statusesStackMapping = {
		[STATUSES.DIVINE_VEIL_PROC.id]: STATUSES.DIVINE_VEIL.id,
	}
}
