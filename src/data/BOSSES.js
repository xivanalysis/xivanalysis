import {getDataBy} from 'data'

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

	// 5.0
	// Reason you need to add override info
	// SOME_BOSS: { logId, overrides... },
}

export default BOSSES
