import {getDataBy} from 'data'
import {addExtraIndex} from 'utilities'

// Correct fight info with manual overrides
export const getCorrectedFight = fight => {
	const boss = getDataBy(BOSSES, 'logId', fight.boss)
	const result = {...fight}
	if (boss) {
		Object.assign(result, boss.overrides)
	}
	return result
}

// Helper to calculate the URL to a zone banner (using my proxy)
export const getZoneBanner = zoneId => zoneId >= 0 && `https://xivanalysis.com/xivapi/zone-banner/${zoneId}`

const BOSSES = {
	// Special case - FF Logs reports trash fights with a boss ID of 0
	TRASH: {
		logId: 0,
		overrides: {zoneID: -1, zoneName: 'Trash'},
	},

	// 4.0
	// FF Logs uses the wrong zone data for Deltascape, feex.
	ALTE_ROITE: {
		logId: 42,
		overrides: {zoneID: 695, zoneName: 'Deltascape V1.0 (Savage)'},
	},
	CATASTROPHE: {
		logId: 43,
		overrides: {zoneID: 696, zoneName: 'Deltascape V2.0 (Savage)'},
	},
	HALICARNASSUS: {
		logId: 44,
		overrides: {zoneID: 697, zoneName: 'Deltascape V3.0 (Savage)'},
	},
	EXDEATH: {
		logId: 45,
		overrides: {zoneID: 698, zoneName: 'Deltascape V4.0 (Savage)'},
	},
	NEO_EXDEATH: {
		logId: 45,
		overrides: {zoneID: 698, zoneName: 'Deltascape V4.0 (Savage)'},
	},

	// 4.1
	// Bahamut prime requires custom modules to permit the scripted death
	BAHAMUT_PRIME: {logId: 1039},

	// 4.2
	// Demon chadarnook has targetable adds that should not be counted, as well as
	// a janky as fuck pull timer which changes some job openers.
	DEMON_CHADARNOOK: {logId: 52},
}

export default addExtraIndex(BOSSES, 'logId')
