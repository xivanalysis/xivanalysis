import {ACTIONS} from 'data/ACTIONS'
import {STATUSES} from 'data/STATUSES'

// BLU won't get the reduced Swiftcast/extended Addle for another 4 years at minimum,
// so we just override the values for these back to their pre-Dawntrail values:
// TODO: _DO NOT_ do this. This risks kluding the actual values used by other jobs depending on module load order.
ACTIONS.SWIFTCAST.cooldown = 60000
STATUSES.ADDLE.duration = 10000
