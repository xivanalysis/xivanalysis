import ACTIONS from 'data/ACTIONS'
import STATUS from 'data/STATUSES'

// BLU won't get the reduced Swiftcast/extended Addle for another 4 years at minimum,
// so we just override the values for these back to their pre-Dawntrail values:
ACTIONS.SWIFTCAST.cooldown = 60000
STATUS.ADDLE.duration = 10000

