import STATUSES from 'data/STATUSES'
import {StatusTimeline as CoreStatusTimeline} from 'parser/core/modules/StatusTimeline'

export class StatusTimeline extends CoreStatusTimeline {
	static override statusesStackMapping = {
		[STATUSES.BAD_BREATH_POISON.id]: STATUSES.MALODOROUS.id,
		[STATUSES.WANING_NOCTURNE.id]: STATUSES.WAXING_NOCTURNE.id,
	}
}
