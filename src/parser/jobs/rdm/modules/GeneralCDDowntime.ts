import ACTIONS from 'data/ACTIONS'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

// Time that Jump deems ok for a OGCD to be down : ^)
const DEFAULT_ALLOWED_DOWNTIME = 4000
export default class GeneralCDDowntime extends CooldownDowntime {
	defaultAllowedDowntime = DEFAULT_ALLOWED_DOWNTIME

	trackedCds = [
		// With the changes to Acceleration, we have a lot of instances where we should hold the skill.
		// Since it's not really possible to always know when during analysis we give a blanket grace of 20 and
		// hope that it's accurate enough
		{
			cooldowns: [ACTIONS.ACCELERATION],
			allowedDowntime: 20000,
		},
		{
			cooldowns: [ACTIONS.SWIFTCAST],
			firstUseOffset: 15000,
		},
		{
			cooldowns: [ACTIONS.MANAFICATION],
			firstUseOffset: 25000,
		},
		{
			cooldowns: [ACTIONS.EMBOLDEN],
			firstUseOffset: 15000,
		},
		{
			cooldowns: [ACTIONS.FLECHE],
		},
		{
			cooldowns: [ACTIONS.CONTRE_SIXTE],
		},
	]
}
