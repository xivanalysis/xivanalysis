import ACTIONS from 'data/ACTIONS'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

// Time that Jump deems ok for a OGCD to be down : ^)
const DEFAULT_ALLOWED_DOWNTIME = 1000
export default class GeneralCDDowntime extends CooldownDowntime {
	defaultAllowedAverageDowntime = DEFAULT_ALLOWED_DOWNTIME

	trackedCds = [
		// With the changes to Acceleration, we have a lot of instances where we should hold the skill.
		// Since it's not really possible to always know when during analysis we give a blanket grace of 20 and
		// hope that it's accurate enough
		{
			cooldowns: [ACTIONS.ACCELERATION],
			allowedAverageDowntime: 4000,
		},
		{
			cooldowns: [ACTIONS.SWIFTCAST],
			firstUseOffset: 31000,
		},
		{
			cooldowns: [ACTIONS.MANAFICATION],
			firstUseOffset: 17500,
		},
		{
			cooldowns: [ACTIONS.EMBOLDEN],
			firstUseOffset: 7500,
		},
		{
			cooldowns: [ACTIONS.FLECHE],
		},
		{
			cooldowns: [ACTIONS.CONTRE_SIXTE],
		},
	]
}
