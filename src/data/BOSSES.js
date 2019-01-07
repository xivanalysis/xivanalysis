import {addExtraIndex} from 'utilities'
import ZONES from './ZONES'

// I'm not including xivapi IDs for now, there's nothing meanigful to referenced on that end
const BOSSES = {
	// 4.1
	BAHAMUT_PRIME: {
		logId: 1039,
		zoneId: ZONES.UCOB.logId,
	},

	// 4.2
	PHANTOM_TRAIN: {
		logId: 51,
		zoneId: ZONES.O5S.logId,
	},
	DEMON_CHADARNOOK: {
		logId: 52,
		zoneId: ZONES.O6S.logId,
	},
	GUARDIAN: {
		logId: 53,
		zoneId: ZONES.O7S.logId,
	},
	KEFKA: {
		logId: 54,
		zoneId: ZONES.O8S.logId,
	},
	GOD_KEFKA: {
		logId: 55,
		zoneId: ZONES.O8S.logId,
	},

	// UwU
	THE_ULTIMA_WEAPON: {
		logId: 0,
		zoneId: ZONES.UWU.logId,
	},
}

export default addExtraIndex(BOSSES, 'logId')
