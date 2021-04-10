import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {Procs} from 'parser/core/modules/Procs'

export default class DNCProcs extends Procs {
	trackedProcs = [
		{
			procStatus: STATUSES.FLOURISHING_FAN_DANCE,
			consumeActions: [ACTIONS.FAN_DANCE_III],
		},
		{
			procStatus: STATUSES.FLOURISHING_CASCADE,
			consumeActions: [ACTIONS.REVERSE_CASCADE],
		},
		{
			procStatus: STATUSES.FLOURISHING_FOUNTAIN,
			consumeActions: [ACTIONS.FOUNTAINFALL],
		},
		{
			procStatus: STATUSES.FLOURISHING_SHOWER,
			consumeActions: [ACTIONS.BLOODSHOWER],
		},
		{
			procStatus: STATUSES.FLOURISHING_WINDMILL,
			consumeActions: [ACTIONS.RISING_WINDMILL],
		},
	]
	static droppedProcIcon = ACTIONS.FOUNTAINFALL.icon
	static overwroteProcIcon = ACTIONS.REVERSE_CASCADE.icon
}
